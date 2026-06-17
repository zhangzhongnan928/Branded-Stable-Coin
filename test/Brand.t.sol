// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import 'forge-std/Test.sol';
import {Factory} from '../src/Factory.sol';
import {BrandVault} from '../src/BrandVault.sol';
import {BrandToken} from '../src/BrandToken.sol';
import {ReserveDataLegacy} from '../src/Interfaces.sol';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

/// @dev Rebasing aToken: only the pool may mint/burn (mirrors Aave aToken behavior).
contract ATokenMock {
    string public name = 'aUSDC'; string public symbol = 'aUSDC'; uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    address public pool;
    constructor(address _pool){ pool = _pool; }
    modifier onlyPool(){ require(msg.sender == pool, 'ONLY_POOL'); _; }
    function mint(address to, uint256 a) external onlyPool { balanceOf[to] += a; }
    function burn(address from, uint256 a) external onlyPool { balanceOf[from] -= a; }
}

/// @dev Aave V3 Pool mock that actually holds the underlying and credits/burns aTokens,
///      so auto-wire + aToken-based aBalance() are genuinely exercised.
contract AavePoolMock {
    USDCMock public usdc;
    ATokenMock public aToken;
    bool public withdrawAlwaysExact = true;
    bool public reportReserveData = true;

    constructor(USDCMock _usdc){ usdc = _usdc; aToken = new ATokenMock(address(this)); }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        require(asset == address(usdc), 'ASSET');
        require(usdc.transferFrom(msg.sender, address(this), amount), 'PULL'); // pool holds underlying
        aToken.mint(onBehalfOf, amount);                                       // vault credited aTokens
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256){
        require(asset == address(usdc), 'ASSET');
        uint256 pay = withdrawAlwaysExact ? amount : amount - 1; // simulate rounding shortfall
        aToken.burn(msg.sender, amount);                        // burn caller(vault) aTokens
        require(usdc.transfer(to, pay), 'PAY');
        return pay;
    }

    function getReserveData(address asset) external view returns (ReserveDataLegacy memory rd){
        require(reportReserveData, 'NO_RESERVE'); // toggle off to simulate a non-conforming pool
        require(asset == address(usdc), 'ASSET');
        rd.aTokenAddress = address(aToken);
    }

    /// @dev Simulate Aave yield: credit vault aTokens AND back them with underlying in the pool.
    function accrueYield(address vault, uint256 amt) external {
        aToken.mint(vault, amt);
        usdc.mint(address(this), amt);
    }

    function setWithdrawAlwaysExact(bool v) external { withdrawAlwaysExact = v; }
    function setReportReserveData(bool v) external { reportReserveData = v; }
}

/// @dev Pool that re-enters the vault during supply/withdraw to test the reentrancy guard.
contract ReentrantPool {
    USDCMock public usdc;
    ATokenMock public aToken;
    address public target;
    bool public attackRedeem;
    bool public attackDeposit;
    constructor(USDCMock _usdc){ usdc = _usdc; aToken = new ATokenMock(address(this)); }
    function setTarget(address t) external { target = t; }
    function setAttackRedeem(bool a) external { attackRedeem = a; }
    function setAttackDeposit(bool a) external { attackDeposit = a; }
    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        if (attackDeposit && target != address(0)) { BrandVault(target).deposit(1); }
        require(usdc.transferFrom(msg.sender, address(this), amount), 'PULL');
        aToken.mint(onBehalfOf, amount);
    }
    function withdraw(address, uint256 amount, address to) external returns (uint256){
        if (attackRedeem && target != address(0)) { BrandVault(target).redeem(1); }
        aToken.burn(msg.sender, amount);
        require(usdc.transfer(to, amount), 'PAY');
        return amount;
    }
    function getReserveData(address) external view returns (ReserveDataLegacy memory rd){ rd.aTokenAddress = address(aToken); }
}

interface IAavePoolMock {
    function setWithdrawAlwaysExact(bool v) external;
    function setReportReserveData(bool v) external;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

contract BrandTest is Test {
    USDCMock usdc;
    AavePoolMock pool;
    Factory factory;

    address user = address(0x111);
    address treasury = address(0x222);
    address feeRecipient = address(0x333);
    // brandOwner & protocolAdmin == address(this)

    event Deposited(address indexed user, uint256 amount);
    event Harvested(address indexed to, uint256 amount);
    event ProtocolFeeTaken(address indexed recipient, uint256 amount);
    event ProfileUpdated(string logoURI, string description, string benefitsURI);

    function setUp() public {
        usdc = new USDCMock();
        pool = new AavePoolMock(usdc);
        factory = new Factory(address(usdc), address(pool), address(this));
        factory.setProtocolFee(500, feeRecipient); // 5% of yield to a dedicated recipient
        usdc.mint(user, 10_000_000e6);
    }

    function _create() internal returns (BrandVault v, BrandToken t) {
        (address va, address to) = factory.createBrand('ACMEUSD','ACMEUSD', treasury, 0);
        v = BrandVault(va); t = BrandToken(to);
    }

    function _createCap(uint256 cap) internal returns (BrandVault v, BrandToken t) {
        (address va, address to) = factory.createBrand('ACMEUSD','ACMEUSD', treasury, cap);
        v = BrandVault(va); t = BrandToken(to);
    }

    function _userDeposit(BrandVault v, uint256 amt) internal {
        vm.prank(user); usdc.approve(address(v), type(uint256).max);
        vm.prank(user); v.deposit(amt);
    }

    // ---- Auto-wire ----
    function test_AutoWireAToken_OnCreate() public {
        (BrandVault v, ) = _create();
        assertEq(v.aToken(), address(pool.aToken()));
        assertTrue(v.aToken() != address(0));
    }

    function test_AutoWire_FallbackWhenPoolNonConforming() public {
        IAavePoolMock(address(pool)).setReportReserveData(false);
        (BrandVault v, ) = _create(); // must not revert even if the pool can't report
        assertEq(v.aToken(), address(0));
        // A mis-wired vault must REFUSE deposits rather than silently mis-account.
        vm.prank(user); usdc.approve(address(v), type(uint256).max);
        vm.prank(user);
        vm.expectRevert(bytes('ATOKEN_UNSET'));
        v.deposit(10e6);
        IAavePoolMock(address(pool)).setReportReserveData(true);
    }

    function test_RewireAToken_StaysCanonical() public {
        (BrandVault v, ) = _create();
        assertEq(v.aToken(), address(pool.aToken()));
        v.rewireAToken(); // owner can only ever (re)pull the canonical Aave aToken
        assertEq(v.aToken(), address(pool.aToken()));
    }

    // ---- Core deposit/redeem/harvest ----
    function test_DepositMintAndRedeem() public {
        (BrandVault v, BrandToken t) = _create();
        _userDeposit(v, 100e6);
        assertEq(t.balanceOf(user), 100e6);
        assertEq(v.totalPrincipal(), 100e6);
        assertEq(v.aBalance(), 100e6);

        // simulate yield, harvest (5% fee)
        pool.accrueYield(address(v), 10e6);
        assertEq(v.availableYield(), 10e6);
        v.harvestYield();
        assertEq(usdc.balanceOf(feeRecipient), 0.5e6);
        assertEq(usdc.balanceOf(treasury), 9.5e6);
        assertEq(v.availableYield(), 0);

        uint256 before = usdc.balanceOf(user);
        vm.prank(user); v.redeem(100e6);
        assertEq(t.balanceOf(user), 0);
        assertEq(v.totalPrincipal(), 0);
        assertEq(usdc.balanceOf(user), before + 100e6);
    }

    function test_AccountingInvariant_AfterEachOp() public {
        (BrandVault v, BrandToken t) = _create();
        _userDeposit(v, 300e6);
        assertEq(t.totalSupply(), v.totalPrincipal());
        vm.prank(user); v.redeem(100e6);
        assertEq(t.totalSupply(), v.totalPrincipal());
        pool.accrueYield(address(v), 5e6);
        v.harvestYield();
        assertEq(t.totalSupply(), v.totalPrincipal()); // harvest never touches principal
        vm.prank(user); v.redeem(200e6);
        assertEq(t.totalSupply(), v.totalPrincipal());
        assertEq(t.totalSupply(), 0);
    }

    // ---- Fees ----
    function test_FeeSplit_Correctness() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 1_000e6);
        pool.accrueYield(address(v), 1_000e6);
        vm.expectEmit(true, false, false, true, address(v));
        emit ProtocolFeeTaken(feeRecipient, 50e6);
        vm.expectEmit(true, false, false, true, address(v));
        emit Harvested(treasury, 950e6);
        v.harvestYield();
        assertEq(usdc.balanceOf(feeRecipient), 50e6);
        assertEq(usdc.balanceOf(treasury), 950e6);
    }

    function test_FeeCap_Enforced() public {
        vm.expectRevert(bytes('FEE_TOO_HIGH'));
        factory.setProtocolFee(1001, feeRecipient);
        factory.setProtocolFee(1000, feeRecipient); // exactly at cap is ok
        assertEq(factory.protocolFeeBps(), 1000);
    }

    function test_FeeZero_AllToCreator() public {
        factory.setProtocolFee(0, feeRecipient);
        (BrandVault v, ) = _create();
        _userDeposit(v, 100e6);
        pool.accrueYield(address(v), 20e6);
        v.harvestYield();
        assertEq(usdc.balanceOf(feeRecipient), 0);
        assertEq(usdc.balanceOf(treasury), 20e6);
    }

    function test_Fee_LiveUpdate() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 1_000e6);
        pool.accrueYield(address(v), 100e6);
        v.harvestYield(); // 5% -> 5e6 fee
        assertEq(usdc.balanceOf(feeRecipient), 5e6);
        factory.setProtocolFee(1000, feeRecipient); // raise to 10% globally
        pool.accrueYield(address(v), 100e6);
        v.harvestYield(); // 10% -> 10e6 fee
        assertEq(usdc.balanceOf(feeRecipient), 15e6);
    }

    function test_FeeNeverReducesPrincipal() public {
        factory.setProtocolFee(1000, feeRecipient); // max fee
        (BrandVault v, ) = _create();
        _userDeposit(v, 100e6);
        pool.accrueYield(address(v), 10e6);
        v.harvestYield();
        uint256 before = usdc.balanceOf(user);
        vm.prank(user); v.redeem(100e6); // full principal still redeemable
        assertEq(usdc.balanceOf(user), before + 100e6);
        assertEq(v.totalPrincipal(), 0);
    }

    function test_OnlyAdmin_SetProtocolFee() public {
        vm.prank(user);
        vm.expectRevert(bytes('NOT_ADMIN'));
        factory.setProtocolFee(100, feeRecipient);
    }

    // ---- Cap ----
    function test_Cap_Enforcement() public {
        (BrandVault v, ) = _createCap(50e6);
        _userDeposit(v, 50e6);
        vm.prank(user);
        vm.expectRevert(bytes('CAP'));
        v.deposit(1);
    }

    function test_Cap_Zero_Unlimited() public {
        (BrandVault v, ) = _createCap(0);
        _userDeposit(v, 1_000_000e6);
        assertEq(v.totalPrincipal(), 1_000_000e6);
    }

    // ---- Pause ----
    function test_Pause_BlocksDepositAndHarvest_AllowsRedeem() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 100e6);
        pool.accrueYield(address(v), 10e6);
        v.pause();
        vm.prank(user);
        vm.expectRevert(bytes('PAUSED'));
        v.deposit(1);
        vm.expectRevert(bytes('PAUSED'));
        v.harvestYield();
        // redeem still works while paused
        vm.prank(user); v.redeem(100e6);
        assertEq(v.totalPrincipal(), 0);
    }

    function test_Redeem_AllowedWhenPaused() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 40e6);
        v.pause();
        vm.prank(user); v.redeem(40e6);
        assertEq(v.totalPrincipal(), 0);
    }

    function test_RedeemRevertsIfLessThanPrincipal() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 50e6);
        IAavePoolMock(address(pool)).setWithdrawAlwaysExact(false);
        vm.prank(user);
        vm.expectRevert(bytes('REDEEM_LT_PRINCIPAL'));
        v.redeem(50e6);
    }

    // ---- Solvency ----
    function test_IsSolvent_View() public {
        (BrandVault v, ) = _create();
        _userDeposit(v, 100e6);
        assertTrue(v.isSolvent());
        assertEq(v.solvencyDeficit(), 0);
        pool.accrueYield(address(v), 5e6);
        assertTrue(v.isSolvent());
        assertEq(v.solvencyDeficit(), 0);
    }

    // ---- Reentrancy ----
    function test_Reentrancy_Redeem() public {
        ReentrantPool rpool = new ReentrantPool(usdc);
        Factory rf = new Factory(address(usdc), address(rpool), address(this));
        (address va, ) = rf.createBrand('R','R', treasury, 0);
        BrandVault rv = BrandVault(va);
        _userDeposit(rv, 100e6);
        rpool.setTarget(address(rv));
        rpool.setAttackRedeem(true);
        vm.prank(user);
        vm.expectRevert(bytes('REENTRANT'));
        rv.redeem(50e6);
    }

    function test_Reentrancy_Deposit() public {
        ReentrantPool rpool = new ReentrantPool(usdc);
        Factory rf = new Factory(address(usdc), address(rpool), address(this));
        (address va, ) = rf.createBrand('R','R', treasury, 0);
        BrandVault rv = BrandVault(va);
        _userDeposit(rv, 100e6); // succeeds (attack off)
        rpool.setTarget(address(rv));
        rpool.setAttackDeposit(true);
        vm.prank(user);
        vm.expectRevert(bytes('REENTRANT'));
        rv.deposit(10e6);
    }

    // ---- Profile ----
    function test_Profile_SettersAndEvents() public {
        (BrandVault v, ) = _create();
        vm.expectEmit(false, false, false, true, address(v));
        emit ProfileUpdated('logo', 'desc', 'benefits');
        v.setProfile('logo', 'desc', 'benefits');
        assertEq(v.logoURI(), 'logo');
        assertEq(v.description(), 'desc');
        assertEq(v.benefitsURI(), 'benefits');

        vm.prank(user);
        vm.expectRevert(bytes('NOT_BRAND_OWNER'));
        v.setProfile('x', 'y', 'z');
    }

    function test_CreateWithProfile_ReadAggregate() public {
        (address va, ) = factory.createBrandWithProfile(
            'Vibe', 'VIBE', treasury, 1000e6, 'ipfs://logo', 'music + community', '{"benefits":[]}'
        );
        BrandVault v = BrandVault(va);
        (
            string memory name_, string memory symbol_, , address treasury_, uint256 cap_, ,
            string memory logo_, string memory desc_, string memory ben_,
        ) = v.profile();
        assertEq(name_, 'Vibe');
        assertEq(symbol_, 'VIBE');
        assertEq(treasury_, treasury);
        assertEq(cap_, 1000e6);
        assertEq(logo_, 'ipfs://logo');
        assertEq(desc_, 'music + community');
        assertEq(ben_, '{"benefits":[]}');
        assertEq(v.aToken(), address(pool.aToken())); // auto-wired through profile path too
    }

    // ---- Pagination ----
    function test_Pagination() public {
        for (uint256 i = 0; i < 5; ++i) { _create(); }
        assertEq(factory.brandsCount(), 5);
        assertEq(factory.getBrandsRange(0, 2).length, 2);
        assertEq(factory.getBrandsRange(4, 10).length, 1);
        assertEq(factory.getBrandsRange(5, 10).length, 0);
        assertEq(factory.getBrandsRange(0, 0).length, 0);
        assertEq(factory.getBrands().length, 5);
    }

    // ---- Fuzz ----
    function testFuzz_DepositRedeem(uint96 amtRaw) public {
        uint256 amt = bound(uint256(amtRaw), 1, 1_000_000e6);
        (BrandVault v, BrandToken t) = _create();
        vm.prank(user); usdc.approve(address(v), type(uint256).max);
        vm.prank(user); v.deposit(amt);
        assertEq(t.balanceOf(user), amt);
        assertEq(t.totalSupply(), v.totalPrincipal());
        uint256 before = usdc.balanceOf(user);
        vm.prank(user); v.redeem(amt);
        assertEq(t.balanceOf(user), 0);
        assertEq(v.totalPrincipal(), 0);
        assertEq(usdc.balanceOf(user), before + amt);
    }

    function testFuzz_FeeSplit(uint96 yieldRaw, uint16 bpsRaw) public {
        uint256 yieldAmt = bound(uint256(yieldRaw), 1, 1_000_000e6);
        uint16 bps = uint16(bound(uint256(bpsRaw), 0, 1000));
        factory.setProtocolFee(bps, feeRecipient);
        (BrandVault v, ) = _create();
        _userDeposit(v, 100e6);
        pool.accrueYield(address(v), yieldAmt);
        v.harvestYield();
        uint256 expectedFee = (yieldAmt * bps) / 10_000;
        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
        assertEq(usdc.balanceOf(treasury), yieldAmt - expectedFee);
        assertLe(expectedFee, yieldAmt);
    }
}

// ---------------------------------------------------------------------------
// Invariant tests
// ---------------------------------------------------------------------------

contract BrandHandler is Test {
    BrandVault public vault;
    BrandToken public token;
    AavePoolMock public pool;
    USDCMock public usdc;

    constructor(AavePoolMock _p, USDCMock _u){ pool = _p; usdc = _u; }

    function setVault(BrandVault _v, BrandToken _t) external {
        vault = _v; token = _t;
        usdc.approve(address(_v), type(uint256).max);
    }

    function deposit(uint256 amt) external {
        amt = bound(amt, 1, 1_000_000e6);
        usdc.mint(address(this), amt);
        vault.deposit(amt);
    }

    function redeem(uint256 amt) external {
        uint256 bal = token.balanceOf(address(this));
        if (bal == 0) return;
        amt = bound(amt, 1, bal);
        vault.redeem(amt);
    }

    function harvest() external {
        if (vault.availableYield() == 0) return;
        vault.harvestYield();
    }

    function accrue(uint256 amt) external {
        amt = bound(amt, 1, 1_000e6);
        pool.accrueYield(address(vault), amt);
    }
}

contract BrandInvariantTest is Test {
    USDCMock usdc;
    AavePoolMock pool;
    Factory factory;
    BrandHandler handler;
    BrandVault vault;
    BrandToken token;

    function setUp() public {
        usdc = new USDCMock();
        pool = new AavePoolMock(usdc);
        factory = new Factory(address(usdc), address(pool), address(this));
        handler = new BrandHandler(pool, usdc);
        vm.prank(address(handler));
        (address va, address to) = factory.createBrand('INV', 'INV', address(handler), 0);
        vault = BrandVault(va);
        token = BrandToken(to);
        handler.setVault(vault, token);
        // Only fuzz the real actions — never the setVault wiring helper (would clobber state).
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = BrandHandler.deposit.selector;
        selectors[1] = BrandHandler.redeem.selector;
        selectors[2] = BrandHandler.harvest.selector;
        selectors[3] = BrandHandler.accrue.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    function invariant_TotalSupplyEqualsPrincipal() public view {
        assertEq(token.totalSupply(), vault.totalPrincipal());
    }

    function invariant_AvailableYieldConsistent() public view {
        uint256 ab = vault.aBalance();
        uint256 tp = vault.totalPrincipal();
        assertEq(vault.availableYield(), ab >= tp ? ab - tp : 0);
    }

    function invariant_SolventUnderNormalOps() public view {
        assertGe(vault.aBalance(), vault.totalPrincipal());
    }
}
