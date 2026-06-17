// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC165 { function supportsInterface(bytes4 interfaceId) external view returns (bool); }

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IERC20MintBurn is IERC20 {
    function mint(address to, uint256 value) external;
    function burn(address from, uint256 value) external;
}

/// @dev ERC-5169 minimal interface
interface IERC5169 is IERC165 {
    function scriptURI() external view returns (string[] memory);
    event ScriptUpdate(string[] newScriptURI);
}

/// @dev Aave V3 reserve configuration bitmask wrapper.
struct ReserveConfigurationMap { uint256 data; }

/// @dev Aave V3 `IPool.getReserveData(asset)` return type (ReserveDataLegacy).
/// Field order/layout VERIFIED on-chain against the live Base Sepolia Pool
/// (getReserveData(USDC).aTokenAddress == 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC).
/// `aTokenAddress` is field index 8. Do NOT substitute the newer DataTypes.ReserveData
/// struct here — it has a different field order and would mis-read the aToken slot.
struct ReserveDataLegacy {
    ReserveConfigurationMap configuration;
    uint128 liquidityIndex;
    uint128 currentLiquidityRate;
    uint128 variableBorrowIndex;
    uint128 currentVariableBorrowRate;
    uint128 currentStableBorrowRate;
    uint40  lastUpdateTimestamp;
    uint16  id;
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    uint128 accruedToTreasury;
    uint128 unbacked;
    uint128 isolationModeTotalDebt;
}

/// @dev Aave V3 IPool subset used by BrandVault.
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (ReserveDataLegacy memory);
}

/// @dev Read interface a BrandVault uses to fetch protocol fee config live from its Factory.
interface IBrandFactory {
    function protocolFeeBps() external view returns (uint16);
    function protocolFeeRecipient() external view returns (address);
}

interface IBrandToken is IERC20MintBurn, IERC5169 {}
