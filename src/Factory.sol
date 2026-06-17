// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BrandVault} from './BrandVault.sol';
import {BrandToken} from './BrandToken.sol';
import {Clones} from './utils/Clones.sol';

/// @title Factory
/// @notice Deploys per-brand BrandVault + BrandToken clones (EIP-1167) and holds the
///         protocol fee config that vaults read live at harvest time.
contract Factory {
    address public immutable usdc;
    address public immutable aavePool;
    address public protocolAdmin;
    address public immutable vaultImpl;
    address public immutable tokenImpl;

    // --- Protocol fee on harvested yield (read live by every vault) ---
    uint16  public constant MAX_FEE_BPS = 1000; // hard cap: 10% of yield (never principal)
    uint16  public protocolFeeBps;
    address public protocolFeeRecipient;

    struct BrandInfo {
        address vault;
        address token;
        string name;
        string symbol;
        address owner;
        address treasury;
        uint256 cap;
    }
    BrandInfo[] private _brands;

    event BrandCreated(address indexed creator, address vault, address token, string name, string symbol, address treasury, uint256 cap);
    event ProtocolFeeConfigUpdated(uint16 bps, address recipient);
    event AdminUpdated(address indexed newAdmin);

    modifier onlyAdmin() { require(msg.sender == protocolAdmin, 'NOT_ADMIN'); _; }

    constructor(address _usdc, address _aavePool, address _admin) {
        require(_usdc != address(0) && _aavePool != address(0) && _admin != address(0), 'ZERO_ADDR');
        usdc = _usdc; aavePool = _aavePool; protocolAdmin = _admin;
        vaultImpl = address(new BrandVault(_usdc, _aavePool));
        tokenImpl = address(new BrandToken());
        // Default: 5% of yield to the protocol admin treasury (non-predatory; never touches principal).
        protocolFeeBps = 500;
        protocolFeeRecipient = _admin;
        emit ProtocolFeeConfigUpdated(500, _admin);
    }

    function _isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), 'ZERO_ADDR'); protocolAdmin = _admin; emit AdminUpdated(_admin);
    }

    /// @notice Update the protocol fee taken from harvested yield. Capped at MAX_FEE_BPS.
    function setProtocolFee(uint16 bps, address recipient) external onlyAdmin {
        require(bps <= MAX_FEE_BPS, 'FEE_TOO_HIGH');
        require(recipient != address(0) || bps == 0, 'ZERO_RECIPIENT');
        protocolFeeBps = bps;
        protocolFeeRecipient = recipient;
        emit ProtocolFeeConfigUpdated(bps, recipient);
    }

    /// @notice Create a brand with no profile (profile can be set later by the owner).
    function createBrand(string calldata name, string calldata symbol, address treasury, uint256 cap)
        public returns (address vault, address token)
    {
        return _create(name, symbol, treasury, cap, '', '', '');
    }

    /// @notice Create a fully-rendered brand (identity + profile) in one tx.
    function createBrandWithProfile(
        string calldata name,
        string calldata symbol,
        address treasury,
        uint256 cap,
        string calldata logoURI,
        string calldata description,
        string calldata benefitsURI
    ) external returns (address vault, address token) {
        return _create(name, symbol, treasury, cap, logoURI, description, benefitsURI);
    }

    function _create(
        string memory name,
        string memory symbol,
        address treasury,
        uint256 cap,
        string memory logoURI,
        string memory description,
        string memory benefitsURI
    ) internal returns (address vault, address token) {
        require(treasury != address(0), 'ZERO_TREASURY');
        address v = Clones.clone(vaultImpl);
        if (!_isContract(v)) {
            v = address(new BrandVault(usdc, aavePool));
        }
        address t = Clones.clone(tokenImpl);
        if (!_isContract(t)) {
            t = address(new BrandToken());
        }
        // Token must be initialized before the vault reads token.name()/symbol() (none here, but
        // keeps ownership wiring correct): vault.initialize sets profile + auto-wires aToken.
        BrandToken(t).initialize(name, symbol, v);
        BrandVault(v).initialize(msg.sender, treasury, t, cap, address(this), logoURI, description, benefitsURI);
        _brands.push(BrandInfo({
            vault: v,
            token: t,
            name: name,
            symbol: symbol,
            owner: msg.sender,
            treasury: treasury,
            cap: cap
        }));
        emit BrandCreated(msg.sender, v, t, name, symbol, treasury, cap);
        return (v, t);
    }

    // --- Enumeration ---
    function brandsCount() external view returns (uint256) { return _brands.length; }

    /// @notice Paginated brand read. Prefer this over getBrands() as the list grows.
    function getBrandsRange(uint256 offset, uint256 limit) external view returns (BrandInfo[] memory page) {
        uint256 len = _brands.length;
        if (offset >= len) return new BrandInfo[](0);
        uint256 end = offset + limit;
        if (end > len) end = len;
        uint256 n = end - offset;
        page = new BrandInfo[](n);
        for (uint256 i = 0; i < n; ++i) {
            page[i] = _brands[offset + i];
        }
    }

    /// @notice Returns all brands. Unbounded — prefer brandsCount() + getBrandsRange() at scale.
    function getBrands() external view returns (BrandInfo[] memory brands) {
        return _brands;
    }
}
