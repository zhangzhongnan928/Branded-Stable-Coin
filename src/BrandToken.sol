// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165, IERC5169, IERC20MintBurn, IBrandToken} from './Interfaces.sol';

contract BrandToken is IBrandToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6; // fixed 6 decimals per spec

    address public owner; // vault
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string[] private _scriptURI;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() { require(msg.sender == owner, 'NOT_VAULT'); _; }

    function initialize(string memory _name, string memory _symbol, address _owner) external {
        require(owner == address(0), 'ALREADY_INIT');
        require(_owner != address(0), 'ZERO_OWNER');
        name = _name; symbol = _symbol; owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    // ERC-20
    function transfer(address to, uint256 value) external override returns (bool) {
        _transfer(msg.sender, to, value); return true;
    }
    function approve(address spender, uint256 value) external override returns (bool) {
        allowance[msg.sender][spender] = value; emit Approval(msg.sender, spender, value); return true;
    }
    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) { require(allowed >= value, 'ALLOWANCE'); allowance[from][msg.sender] = allowed - value; }
        _transfer(from, to, value); return true;
    }
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), 'ZERO_TO');
        uint256 bal = balanceOf[from]; require(bal >= value, 'BALANCE');
        unchecked { balanceOf[from] = bal - value; balanceOf[to] += value; }
        emit Transfer(from, to, value);
    }

    // Mint/Burn restricted to vault
    function mint(address to, uint256 value) external override onlyOwner { _mint(to, value); }
    function burn(address from, uint256 value) external override onlyOwner { _burn(from, value); }
    function _mint(address to, uint256 value) internal { require(to != address(0), 'ZERO_TO'); totalSupply += value; balanceOf[to] += value; emit Transfer(address(0), to, value); }
    function _burn(address from, uint256 value) internal { uint256 bal = balanceOf[from]; require(bal >= value, 'BALANCE'); unchecked { balanceOf[from] = bal - value; totalSupply -= value; } emit Transfer(from, address(0), value); }

    // ERC-5169 minimal
    function scriptURI() external view override returns (string[] memory) { return _scriptURI; }
    function setScriptURI(string[] calldata newScriptURI) external onlyOwner { _scriptURI = newScriptURI; emit ScriptUpdate(newScriptURI); }

    // ERC-165
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC5169).interfaceId;
    }
}


