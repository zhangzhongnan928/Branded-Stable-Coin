// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BrandVault} from './BrandVault.sol';
import {BrandToken} from './BrandToken.sol';
import {Clones} from './utils/Clones.sol';

contract Factory {
    address public immutable usdc;
    address public immutable aavePool;
    address public protocolAdmin;
    address public immutable vaultImpl;
    address public immutable tokenImpl;

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

    modifier onlyAdmin() { require(msg.sender == protocolAdmin, 'NOT_ADMIN'); _; }

    constructor(address _usdc, address _aavePool, address _admin) {
        require(_usdc != address(0) && _aavePool != address(0) && _admin != address(0), 'ZERO_ADDR');
        usdc = _usdc; aavePool = _aavePool; protocolAdmin = _admin;
        vaultImpl = address(new BrandVault(_usdc, _aavePool));
        tokenImpl = address(new BrandToken());
    }

    function _isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function setAdmin(address _admin) external onlyAdmin { require(_admin != address(0), 'ZERO_ADDR'); protocolAdmin = _admin; }

    function createBrand(string calldata name, string calldata symbol, address treasury, uint256 cap) external returns (address vault, address token) {
        require(treasury != address(0), 'ZERO_TREASURY');
        address v = Clones.clone(vaultImpl);
        if (!_isContract(v)) {
            v = address(new BrandVault(usdc, aavePool));
        }
        address t = Clones.clone(tokenImpl);
        if (!_isContract(t)) {
            t = address(new BrandToken());
        }
        BrandVault(v).initialize(msg.sender, treasury, t, cap);
        BrandToken(t).initialize(name, symbol, v);
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

    function getBrands() external view returns (BrandInfo[] memory brands) {
        return _brands;
    }
}


