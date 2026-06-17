// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import 'forge-std/Test.sol';
import {Factory} from '../src/Factory.sol';
import {BrandVault} from '../src/BrandVault.sol';
import {BrandToken} from '../src/BrandToken.sol';
import {IAavePool} from '../src/Interfaces.sol';

interface IERC20Min {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

/// @notice Fork tests against the real Aave V3 market on Base Sepolia.
/// Skipped automatically unless BASE_SEPOLIA_RPC_URL is set, e.g.:
///   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org forge test --match-contract BrandForkTest -vv
contract BrandForkTest is Test {
    // Verified Base Sepolia addresses (aave-address-book + on-chain getReserveData).
    address constant POOL  = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;
    address constant USDC  = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant AUSDC = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;

    Factory factory;
    address creator = address(0xC0FFEE);
    address fan = address(0xF00D);
    bool active;

    function setUp() public {
        string memory rpc = vm.envOr('BASE_SEPOLIA_RPC_URL', string(''));
        if (bytes(rpc).length == 0) { active = false; return; }
        vm.createSelectFork(rpc);
        active = true;
        factory = new Factory(USDC, POOL, address(this));
    }

    function testFork_AutoWire_MatchesAaveReserveData() public {
        if (!active) { vm.skip(true); return; }
        vm.prank(creator);
        (address va, ) = factory.createBrand('Vibe', 'VIBE', creator, 0);
        BrandVault v = BrandVault(va);
        address expected = IAavePool(POOL).getReserveData(USDC).aTokenAddress;
        assertEq(v.aToken(), expected, 'auto-wired aToken should match Aave reserve data');
        assertEq(v.aToken(), AUSDC, 'and the known aUSDC address');
    }

    function testFork_Deposit_CreditsRealAToken() public {
        if (!active) { vm.skip(true); return; }
        vm.prank(creator);
        (address va, address to) = factory.createBrand('Vibe', 'VIBE', creator, 0);
        BrandVault v = BrandVault(va);
        BrandToken t = BrandToken(to);

        uint256 amt = 1_000e6;
        deal(USDC, fan, amt);
        vm.startPrank(fan);
        IERC20Min(USDC).approve(va, amt);
        v.deposit(amt);
        vm.stopPrank();

        // Shares == aTokens actually credited (== deposit minus at most a wei or two of Aave dust).
        uint256 shares = t.balanceOf(fan);
        assertApproxEqAbs(shares, amt, 3, 'shares ~= deposit');
        assertEq(v.totalPrincipal(), shares, 'principal == shares');
        assertEq(t.totalSupply(), v.totalPrincipal(), 'supply == principal');
        // The vault is strictly solvent immediately after deposit (the bug we fixed).
        assertTrue(v.isSolvent(), 'solvent right after deposit');
        assertEq(v.solvencyDeficit(), 0);
    }

    function testFork_RedeemFull_ReturnsShares() public {
        if (!active) { vm.skip(true); return; }
        vm.prank(creator);
        (address va, address to) = factory.createBrand('Vibe', 'VIBE', creator, 0);
        BrandVault v = BrandVault(va);
        BrandToken t = BrandToken(to);

        uint256 amt = 500e6;
        deal(USDC, fan, amt);
        vm.startPrank(fan);
        IERC20Min(USDC).approve(va, amt);
        v.deposit(amt);
        uint256 shares = t.balanceOf(fan);
        uint256 before = IERC20Min(USDC).balanceOf(fan);
        v.redeem(shares); // full redeem of credited shares never reverts
        vm.stopPrank();

        assertEq(IERC20Min(USDC).balanceOf(fan), before + shares);
        assertEq(v.totalPrincipal(), 0);
        assertEq(t.balanceOf(fan), 0);
    }
}
