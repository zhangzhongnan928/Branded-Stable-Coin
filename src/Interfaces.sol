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

/// @dev Aave V3 IPool subset used
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IBrandToken is IERC20MintBurn, IERC5169 {}


