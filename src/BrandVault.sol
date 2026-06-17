// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAavePool, IERC20, IBrandToken, IBrandFactory, ReserveDataLegacy} from './Interfaces.sol';
import {SafeTransferLib} from './utils/SafeTransferLib.sol';

/// @title BrandVault
/// @notice Per-brand vault. Fans deposit USDC -> supplied to Aave V3 -> minted the brand
///         token 1:1. Principal is always 1:1 redeemable by holders. The surplus over
///         principal (Aave yield) is the brand's, harvestable to its treasury minus an
///         optional protocol fee. Deployed as an EIP-1167 clone; init-time state only.
contract BrandVault {
    using SafeTransferLib for address;

    // --- Immutables (baked into the implementation bytecode; clones read them correctly) ---
    address public immutable usdc;
    IAavePool public immutable aavePool;

    // --- Per-clone storage (set in initialize) ---
    address public brandOwner;
    address public treasury;
    IBrandToken public token;
    IBrandFactory public factory;
    address public aToken; // auto-wired from Aave at init; admin-overridable

    uint256 public totalPrincipal; // USDC, 6 decimals — sum of user principal
    uint256 public cap;            // max totalPrincipal; 0 == unlimited

    // --- Brand profile (rendered by the frontend; no off-chain infra needed) ---
    string public logoURI;
    string public description;
    string public benefitsURI;  // canonical perks field: inline benefits JSON or a URI
    string public metadataURI;  // legacy/back-compat metadata string

    bool public paused;
    uint256 private reentrancyGuard;

    event Deposited(address indexed user, uint256 amount);
    event Redeemed(address indexed user, uint256 amount);
    event Harvested(address indexed to, uint256 amount);
    event ProtocolFeeTaken(address indexed recipient, uint256 amount);
    event MetadataUpdated(string uri);
    event LogoUpdated(string logoURI);
    event DescriptionUpdated(string description);
    event BenefitsUpdated(string benefitsURI);
    event ProfileUpdated(string logoURI, string description, string benefitsURI);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event TreasuryUpdated(address indexed newTreasury);
    event CapUpdated(uint256 newCap);
    event ATokenUpdated(address indexed newAToken);

    modifier onlyBrandOwner() { require(msg.sender == brandOwner, 'NOT_BRAND_OWNER'); _; }
    modifier notPaused() { require(!paused, 'PAUSED'); _; }
    modifier nonReentrant() { require(reentrancyGuard == 0, 'REENTRANT'); reentrancyGuard = 1; _; reentrancyGuard = 0; }

    constructor(address _usdc, address _aavePool) {
        require(_usdc != address(0) && _aavePool != address(0), 'ZERO_ADDR');
        usdc = _usdc; aavePool = IAavePool(_aavePool);
    }

    /// @notice One-time clone initializer. Wires the aToken from Aave automatically.
    function initialize(
        address _brandOwner,
        address _treasury,
        address _token,
        uint256 _cap,
        address _factory,
        string calldata _logoURI,
        string calldata _description,
        string calldata _benefitsURI
    ) external {
        require(address(token) == address(0), 'ALREADY_INIT');
        require(
            _brandOwner != address(0) && _treasury != address(0) && _token != address(0) && _factory != address(0),
            'ZERO_ADDR'
        );
        brandOwner = _brandOwner;
        treasury   = _treasury;
        token      = IBrandToken(_token);
        cap        = _cap;
        factory    = IBrandFactory(_factory);
        logoURI    = _logoURI;
        description = _description;
        benefitsURI = _benefitsURI;
        _autoWireAToken();
    }

    /// @dev Resilient aToken discovery: a non-conforming pool must never break creation.
    function _autoWireAToken() internal {
        try aavePool.getReserveData(usdc) returns (ReserveDataLegacy memory rd) {
            if (rd.aTokenAddress != address(0)) {
                aToken = rd.aTokenAddress;
                emit ATokenUpdated(rd.aTokenAddress);
            }
        } catch {
            // leave aToken unset; aBalance() falls back; owner can setAToken/rewireAToken later
        }
    }

    /// @notice Re-derive the aToken from Aave's canonical reserve data.
    /// @dev The aToken is ONLY ever sourced from the (trusted, immutable) Aave pool —
    ///      never from caller input — so a brand owner cannot repoint accounting at a
    ///      fake token to inflate availableYield() and drain principal via harvestYield().
    function rewireAToken() external onlyBrandOwner { _autoWireAToken(); }

    // --- Brand owner config ---
    function setTreasury(address _treasury) external onlyBrandOwner {
        require(_treasury != address(0), 'ZERO_ADDR'); treasury = _treasury; emit TreasuryUpdated(_treasury);
    }

    function setCap(uint256 _cap) external onlyBrandOwner { cap = _cap; emit CapUpdated(_cap); }

    function setMetadataURI(string calldata uri) external onlyBrandOwner { metadataURI = uri; emit MetadataUpdated(uri); }
    function setLogoURI(string calldata uri) external onlyBrandOwner { logoURI = uri; emit LogoUpdated(uri); }
    function setDescription(string calldata desc) external onlyBrandOwner { description = desc; emit DescriptionUpdated(desc); }
    function setBenefitsURI(string calldata uri) external onlyBrandOwner { benefitsURI = uri; emit BenefitsUpdated(uri); }

    /// @notice Set all profile fields in one tx.
    function setProfile(string calldata _logoURI, string calldata _description, string calldata _benefitsURI)
        external onlyBrandOwner
    {
        logoURI = _logoURI; description = _description; benefitsURI = _benefitsURI;
        emit ProfileUpdated(_logoURI, _description, _benefitsURI);
    }

    function pause() external onlyBrandOwner { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyBrandOwner { paused = false; emit Unpaused(msg.sender); }

    // --- Accounting ---
    /// @dev Prefers the wired aToken balance; the raw-USDC fallback exists only for
    ///      mock/test environments where no aToken is configured.
    function aBalance() public view returns (uint256) {
        if (aToken != address(0)) {
            return IERC20(aToken).balanceOf(address(this));
        }
        return IERC20(usdc).balanceOf(address(this));
    }

    function availableYield() public view returns (uint256) {
        uint256 ab = aBalance();
        if (ab > totalPrincipal) return ab - totalPrincipal;
        return 0;
    }

    /// @notice True when every holder can still redeem 1:1.
    function isSolvent() external view returns (bool) {
        return aBalance() >= totalPrincipal;
    }

    /// @notice Shortfall of backing vs principal (0 when solvent).
    function solvencyDeficit() external view returns (uint256) {
        uint256 ab = aBalance();
        return ab >= totalPrincipal ? 0 : totalPrincipal - ab;
    }

    /// @notice Single-call read for the frontend brand page.
    function profile() external view returns (
        string memory name_, string memory symbol_, address token_,
        address treasury_, uint256 cap_, uint256 totalPrincipal_,
        string memory logoURI_, string memory description_,
        string memory benefitsURI_, string memory metadataURI_
    ) {
        return (
            token.name(), token.symbol(), address(token),
            treasury, cap, totalPrincipal,
            logoURI, description, benefitsURI, metadataURI
        );
    }

    // --- Core flows ---
    function deposit(uint256 amount) external notPaused nonReentrant {
        require(amount > 0, 'ZERO_AMOUNT');
        // Refuse deposits into a mis-wired vault: without the aToken we cannot account
        // backing, so the vault would look instantly insolvent and strand yield.
        address at = aToken;
        require(at != address(0), 'ATOKEN_UNSET');
        require(cap == 0 || totalPrincipal + amount <= cap, 'CAP');
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.safeApprove(address(aavePool), amount); // supply() pulls USDC from this vault

        // Mint shares equal to the aTokens actually credited. Aave's ray math can credit
        // `amount - dust` (a wei or two), so crediting the user `amount` would leave the
        // vault under-backed and break exact-amount redemption. Tracking the real delta keeps
        // totalSupply == totalPrincipal <= aBalance, so every holder can always redeem 1:1.
        uint256 before = IERC20(at).balanceOf(address(this));
        aavePool.supply(usdc, amount, address(this), 0);
        uint256 minted = IERC20(at).balanceOf(address(this)) - before;
        require(minted > 0, 'NO_SHARES');

        totalPrincipal += minted;
        token.mint(msg.sender, minted);
        emit Deposited(msg.sender, minted);
    }

    /// @notice Burn brand token and withdraw USDC 1:1. Never pausable — holders can always exit.
    function redeem(uint256 amount) external nonReentrant {
        require(amount > 0, 'ZERO_AMOUNT');
        // CEI: effects first so totalSupply == totalPrincipal holds at the external-call boundary.
        token.burn(msg.sender, amount);
        totalPrincipal -= amount;
        // Aave V3 withdraw burns this vault's aTokens; it does not pull USDC, so no approve needed.
        uint256 withdrawn = aavePool.withdraw(usdc, amount, msg.sender);
        require(withdrawn >= amount, 'REDEEM_LT_PRINCIPAL');
        emit Redeemed(msg.sender, amount);
    }

    /// @notice Harvest yield (surplus over principal) to treasury, minus the protocol fee.
    function harvestYield() external onlyBrandOwner notPaused nonReentrant {
        uint256 yieldAmt = availableYield();
        require(yieldAmt > 0, 'NO_YIELD');

        uint16  bps   = factory.protocolFeeBps();
        address feeTo = factory.protocolFeeRecipient();

        uint256 feeAmt     = (bps == 0 || feeTo == address(0)) ? 0 : (yieldAmt * bps) / 10_000;
        uint256 creatorAmt = yieldAmt - feeAmt; // remainder (floor on fee favors the creator)

        if (feeAmt > 0) {
            uint256 wf = aavePool.withdraw(usdc, feeAmt, feeTo);
            require(wf >= feeAmt, 'FEE_WITHDRAW_FAIL');
            emit ProtocolFeeTaken(feeTo, wf);
        }
        if (creatorAmt > 0) {
            uint256 wc = aavePool.withdraw(usdc, creatorAmt, treasury);
            require(wc >= creatorAmt, 'WITHDRAW_FAIL');
            emit Harvested(treasury, wc);
        }
    }
}
