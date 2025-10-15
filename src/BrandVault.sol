// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAavePool, IERC20, IBrandToken} from './Interfaces.sol';
import {SafeTransferLib} from './utils/SafeTransferLib.sol';

contract BrandVault {
    using SafeTransferLib for address;

    address public immutable usdc;
    IAavePool public immutable aavePool;

    address public brandOwner;
    address public treasury;
    IBrandToken public token;
    address public aToken; // optional aToken address for precise balance

    uint256 public totalPrincipal; // in USDC 6 decimals
    uint256 public cap;

    string public metadataURI;

    bool public paused;
    uint256 private reentrancyGuard;

    event Deposited(address indexed user, uint256 amount);
    event Redeemed(address indexed user, uint256 amount);
    event Harvested(address indexed to, uint256 amount);
    event MetadataUpdated(string uri);
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

    function initialize(address _brandOwner, address _treasury, address _token, uint256 _cap) external {
        require(address(token) == address(0), 'ALREADY_INIT');
        require(_brandOwner != address(0) && _treasury != address(0) && _token != address(0), 'ZERO_ADDR');
        brandOwner = _brandOwner; treasury = _treasury; token = IBrandToken(_token); cap = _cap;
    }

    function setTreasury(address _treasury) external onlyBrandOwner {
        require(_treasury != address(0), 'ZERO_ADDR'); treasury = _treasury; emit TreasuryUpdated(_treasury);
    }

    function setMetadataURI(string calldata uri) external onlyBrandOwner { metadataURI = uri; emit MetadataUpdated(uri); }

    function setCap(uint256 _cap) external onlyBrandOwner { cap = _cap; emit CapUpdated(_cap); }

    function setAToken(address _aToken) external onlyBrandOwner {
        require(_aToken != address(0), 'ZERO_ADDR');
        aToken = _aToken;
        emit ATokenUpdated(_aToken);
    }

    function pause() external onlyBrandOwner { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyBrandOwner { paused = false; emit Unpaused(msg.sender); }

    function aBalance() public view returns (uint256) {
        // Prefer precise aToken balance if configured; fallback to local USDC for mocks/tests
        if (aToken != address(0)) {
            return IERC20(aToken).balanceOf(address(this));
        }
        return IERC20(usdc).balanceOf(address(this));
    }

    function availableYield() public view returns (uint256) {
        uint256 ab = aBalance();
        if (ab > totalPrincipal) return ab - totalPrincipal; return 0;
    }

    function deposit(uint256 amount) external notPaused nonReentrant {
        require(amount > 0, 'ZERO_AMOUNT');
        require(totalPrincipal + amount <= cap || cap == 0, 'CAP');
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.safeApprove(address(aavePool), amount);
        aavePool.supply(usdc, amount, address(this), 0);
        totalPrincipal += amount;
        token.mint(msg.sender, amount);
        emit Deposited(msg.sender, amount);
    }

    function redeem(uint256 amount) external notPaused nonReentrant {
        require(amount > 0, 'ZERO_AMOUNT');
        token.burn(msg.sender, amount);
        // Approve pool just in case pool pulls funds on withdraw implementation
        usdc.safeApprove(address(aavePool), amount);
        uint256 withdrawn = aavePool.withdraw(usdc, amount, msg.sender);
        require(withdrawn >= amount, 'REDEEM_LT_PRINCIPAL');
        totalPrincipal -= amount;
        emit Redeemed(msg.sender, amount);
    }

    function harvestYield() external onlyBrandOwner notPaused nonReentrant {
        uint256 yieldAmt = availableYield();
        require(yieldAmt > 0, 'NO_YIELD');
        // Approve pool to pull yield funds from this vault
        usdc.safeApprove(address(aavePool), yieldAmt);
        uint256 withdrawn = aavePool.withdraw(usdc, yieldAmt, treasury);
        require(withdrawn >= yieldAmt, 'WITHDRAW_FAIL');
        emit Harvested(treasury, withdrawn);
    }
}


