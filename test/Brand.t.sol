// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import 'forge-std/Test.sol';
import {Factory} from '../src/Factory.sol';
import {BrandVault} from '../src/BrandVault.sol';
import {BrandToken} from '../src/BrandToken.sol';

interface IAavePoolMock {
    function setWithdrawAlwaysExact(bool v) external;
}

contract USDCMock {
    string public name = 'USD Coin';
    string public symbol = 'USDC';
    uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; emit Transfer(address(0), to, amount); }
    function transfer(address to, uint256 amount) external returns (bool){ require(balanceOf[msg.sender] >= amount, 'bal'); balanceOf[msg.sender]-=amount; balanceOf[to]+=amount; emit Transfer(msg.sender,to,amount); return true; }
    function approve(address spender, uint256 amount) external returns (bool){ allowance[msg.sender][spender]=amount; emit Approval(msg.sender,spender,amount); return true; }
    function transferFrom(address from,address to,uint256 amount) external returns (bool){ uint256 a=allowance[from][msg.sender]; require(a>=amount,'allow'); if(a!=type(uint256).max) allowance[from][msg.sender]=a-amount; require(balanceOf[from]>=amount,'bal'); balanceOf[from]-=amount; balanceOf[to]+=amount; emit Transfer(from,to,amount); return true; }
}

contract AavePoolMock {
    USDCMock public usdc;
    bool public withdrawAlwaysExact = true;
    constructor(USDCMock _usdc){ usdc = _usdc; }
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16) external {
        require(asset == address(usdc));
        // funds already transferred to vault; no-op in mock as if aToken credited
    }
    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        require(asset == address(usdc));
        // no-op in mock
    }
    function withdraw(address asset, uint256 amount, address to) external returns (uint256){
        require(asset == address(usdc));
        uint256 pay = withdrawAlwaysExact ? amount : amount - 1; // simulate potential rounding risk
        require(usdc.balanceOf(msg.sender) >= pay, 'insufficient in vault');
        // transfer from vault (msg.sender) to recipient
        require(usdc.transferFrom(msg.sender, to, pay));
        return pay;
    }
    function setWithdrawAlwaysExact(bool v) external { withdrawAlwaysExact = v; }
}

contract BrandTest is Test {
    USDCMock usdc;
    AavePoolMock pool;
    Factory factory;

    address user = address(0x111);
    address brandOwner = address(this);
    address treasury = address(0x222);

    function setUp() public {
        usdc = new USDCMock();
        pool = new AavePoolMock(usdc);
        factory = new Factory(address(usdc), address(pool), address(this));
        usdc.mint(user, 1_000_000e6);
    }

    function _create() internal returns (BrandVault v, BrandToken t) {
        (address va, address to) = factory.createBrand('ACMEUSD','ACMEUSD',treasury, 0);
        v = BrandVault(va); t = BrandToken(to);
    }

    function testDepositMintAndRedeem() public {
        (BrandVault v, BrandToken t) = _create();
        vm.prank(user);
        usdc.approve(address(v), type(uint256).max);
        vm.prank(user);
        v.deposit(100e6);
        assertEq(t.balanceOf(user), 100e6);
        assertEq(v.totalPrincipal(), 100e6);

        // fund vault to simulate yield (mock: keep funds on vault)
        usdc.mint(address(v), 10e6);
        // harvest sends to treasury
        v.harvestYield();
        assertEq(usdc.balanceOf(treasury), 10e6);

        vm.prank(user);
        v.redeem(100e6);
        assertEq(t.balanceOf(user), 0);
        assertEq(v.totalPrincipal(), 0);
    }

    function testRedeemRevertsIfLessThanPrincipal() public {
        (BrandVault v, ) = _create();
        vm.prank(user);
        usdc.approve(address(v), type(uint256).max);
        vm.prank(user);
        v.deposit(50e6);

        IAavePoolMock(address(pool)).setWithdrawAlwaysExact(false);
        vm.prank(user);
        vm.expectRevert(bytes('REDEEM_LT_PRINCIPAL'));
        v.redeem(50e6);
    }
}


