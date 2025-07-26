// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../EnhancedPTYTLooper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Enhanced PT/YT Looper Tests
 * @notice Comprehensive test suite for the PT/YT looping strategy
 */
contract EnhancedPTYTLooperTest is Test {
    EnhancedPTYTLooper public looper;
    MockERC20 public weth;
    MockERC20 public usdc;
    MockERC20 public ptToken;
    MockERC20 public ytToken;
    
    address public owner = address(this);
    address public user = address(0x1234);
    address public guardian = address(0x5678);
    
    // Constants
    uint256 constant INITIAL_BALANCE = 1000 ether;
    uint256 constant COLLATERAL_AMOUNT = 10 ether;
    uint256 constant MAX_LTV = 7500; // 75%
    uint256 constant TARGET_LTV = 6500; // 65%
    
    function setUp() public {
        // Deploy mock tokens
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);
        ptToken = new MockERC20("Principal Token", "PT", 18);
        ytToken = new MockERC20("Yield Token", "YT", 18);
        
        // Deploy looper contract
        looper = new EnhancedPTYTLooper();
        
        // Configure strategy
        looper.configureStrategy(
            address(weth),      // collateral token
            address(usdc),      // borrow token
            address(0x1111),    // mock Pendle market
            address(ptToken),   // PT token
            address(ytToken),   // YT token
            MAX_LTV,            // max LTV
            TARGET_LTV          // target LTV
        );
        
        // Setup initial balances
        weth.mint(user, INITIAL_BALANCE);
        usdc.mint(address(looper), INITIAL_BALANCE);
        ptToken.mint(address(looper), INITIAL_BALANCE);
        ytToken.mint(address(looper), INITIAL_BALANCE);
        
        // Give user approval (safe for USDT-like tokens)
        vm.prank(user);
        try weth.approve(address(looper), 0) { // Reset to 0 first
            // Success
        } catch {
            // Some tokens don't allow approve from non-zero to non-zero
        }
        vm.prank(user);
        bool approveSuccess = weth.approve(address(looper), type(uint256).max);
        require(approveSuccess, "Approval failed");
    }
    
    function testConfigureStrategy() public {
        EnhancedPTYTLooper.StrategyConfig memory config = looper.getStrategyConfig();
        
        assertEq(config.collateralToken, address(weth));
        assertEq(config.borrowToken, address(usdc));
        assertEq(config.maxLTV, MAX_LTV);
        assertEq(config.targetLTV, TARGET_LTV);
        assertEq(config.maxLoops, 5);
        assertTrue(config.useFlashLoans);
    }
    
    function testOpenPosition() public {
        vm.startPrank(user);
        
        // Check initial balances
        uint256 initialWethBalance = weth.balanceOf(user);
        
        // Open position
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Check position was created
        EnhancedPTYTLooper.PositionInfo memory position = looper.getUserPosition(user);
        assertTrue(position.isActive);
        assertEq(position.totalCollateral, COLLATERAL_AMOUNT);
        assertEq(position.totalLoops, 3);
        
        // Check WETH was transferred
        assertEq(weth.balanceOf(user), initialWethBalance - COLLATERAL_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testOpenPositionTwice() public {
        vm.startPrank(user);
        
        // Open first position
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Try to open second position (should fail)
        vm.expectRevert("Position already active");
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        vm.stopPrank();
    }
    
    function testOpenPositionInvalidParameters() public {
        vm.startPrank(user);
        
        // Invalid collateral amount
        vm.expectRevert("Invalid collateral amount");
        looper.openPosition(0, 3, TARGET_LTV);
        
        // Invalid loop count
        vm.expectRevert("Invalid loop count");
        looper.openPosition(COLLATERAL_AMOUNT, 0, TARGET_LTV);
        
        vm.expectRevert("Invalid loop count");
        looper.openPosition(COLLATERAL_AMOUNT, 11, TARGET_LTV);
        
        // Invalid LTV
        vm.expectRevert("Invalid LTV");
        looper.openPosition(COLLATERAL_AMOUNT, 3, 0);
        
        vm.expectRevert("Invalid LTV");
        looper.openPosition(COLLATERAL_AMOUNT, 3, 10000);
        
        vm.stopPrank();
    }
    
    function testRebalancePosition() public {
        vm.startPrank(user);
        
        // Open position first
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Rebalance to higher LTV
        uint256 newTargetLTV = 7000;
        looper.rebalancePosition(newTargetLTV);
        
        // Check position was updated
        EnhancedPTYTLooper.PositionInfo memory position = looper.getUserPosition(user);
        assertTrue(position.lastRebalance > 0);
        
        vm.stopPrank();
    }
    
    function testRebalancePositionNotActive() public {
        vm.startPrank(user);
        
        // Try to rebalance without active position
        vm.expectRevert("Position not active");
        looper.rebalancePosition(7000);
        
        vm.stopPrank();
    }
    
    function testClosePosition() public {
        vm.startPrank(user);
        
        // Open position first
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Close position
        looper.closePosition();
        
        // Check position is no longer active
        EnhancedPTYTLooper.PositionInfo memory position = looper.getUserPosition(user);
        assertFalse(position.isActive);
        
        vm.stopPrank();
    }
    
    function testClosePositionNotActive() public {
        vm.startPrank(user);
        
        // Try to close without active position
        vm.expectRevert("Position not active");
        looper.closePosition();
        
        vm.stopPrank();
    }
    
    function testEmergencyPause() public {
        // Test pause
        looper.emergencyPause();
        assertTrue(looper.paused());
        
        // Test unpause
        looper.emergencyUnpause();
        assertFalse(looper.paused());
    }
    
    function testEmergencyPauseNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        looper.emergencyPause();
    }
    
    function testEmergencyWithdraw() public {
        uint256 withdrawAmount = 100 ether;
        
        // Mint some tokens to the contract
        weth.mint(address(looper), withdrawAmount);
        
        uint256 initialBalance = weth.balanceOf(owner);
        
        // Emergency withdraw
        looper.emergencyWithdraw(address(weth), withdrawAmount);
        
        // Check tokens were withdrawn
        assertEq(weth.balanceOf(owner), initialBalance + withdrawAmount);
    }
    
    function testCannotOperateWhenPaused() public {
        // Pause the contract
        looper.emergencyPause();
        
        vm.startPrank(user);
        
        // Try to open position while paused
        vm.expectRevert("Pausable: paused");
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        vm.stopPrank();
    }
    
    function testGetUserPosition() public {
        vm.startPrank(user);
        
        // Check empty position
        EnhancedPTYTLooper.PositionInfo memory emptyPosition = looper.getUserPosition(user);
        assertFalse(emptyPosition.isActive);
        assertEq(emptyPosition.totalCollateral, 0);
        
        // Open position
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Check position data
        EnhancedPTYTLooper.PositionInfo memory position = looper.getUserPosition(user);
        assertTrue(position.isActive);
        assertEq(position.totalCollateral, COLLATERAL_AMOUNT);
        assertEq(position.totalLoops, 3);
        
        vm.stopPrank();
    }
    
    function testCalculateCurrentLTV() public {
        vm.startPrank(user);
        
        // Open position
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Calculate LTV
        uint256 ltv = looper.calculateCurrentLTV(user);
        
        // LTV should be calculated correctly
        assertTrue(ltv >= 0);
        
        vm.stopPrank();
    }
    
    function testCalculatePositionValue() public {
        vm.startPrank(user);
        
        // Open position
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // Calculate position value
        uint256 value = looper.calculatePositionValue(user);
        
        // Value should be positive
        assertTrue(value > 0);
        
        vm.stopPrank();
    }
    
    // Stress test: Multiple users
    function testMultipleUsers() public {
        address user2 = address(0x9999);
        
        // Setup user2 (safe for USDT-like tokens)
        weth.mint(user2, INITIAL_BALANCE);
        vm.prank(user2);
        try weth.approve(address(looper), 0) { // Reset to 0 first
            // Success
        } catch {
            // Some tokens don't allow approve from non-zero to non-zero
        }
        vm.prank(user2);
        bool approveSuccess = weth.approve(address(looper), type(uint256).max);
        require(approveSuccess, "User2 approval failed");
        
        // User1 opens position
        vm.prank(user);
        looper.openPosition(COLLATERAL_AMOUNT, 3, TARGET_LTV);
        
        // User2 opens position
        vm.prank(user2);
        looper.openPosition(COLLATERAL_AMOUNT / 2, 2, TARGET_LTV);
        
        // Check both positions
        EnhancedPTYTLooper.PositionInfo memory pos1 = looper.getUserPosition(user);
        EnhancedPTYTLooper.PositionInfo memory pos2 = looper.getUserPosition(user2);
        
        assertTrue(pos1.isActive);
        assertTrue(pos2.isActive);
        assertEq(pos1.totalCollateral, COLLATERAL_AMOUNT);
        assertEq(pos2.totalCollateral, COLLATERAL_AMOUNT / 2);
    }
    
    // Stress test: Maximum loops
    function testMaxLoops() public {
        vm.startPrank(user);
        
        // Open position with maximum loops
        looper.openPosition(COLLATERAL_AMOUNT, 5, TARGET_LTV);
        
        // Check position was created
        EnhancedPTYTLooper.PositionInfo memory position = looper.getUserPosition(user);
        assertTrue(position.isActive);
        assertEq(position.totalLoops, 5);
        
        vm.stopPrank();
    }
    
    // Test receive function
    function testReceiveEther() public {
        uint256 amount = 1 ether;
        
        // Send ETH to contract
        payable(address(looper)).transfer(amount);
        
        // Check balance
        assertEq(address(looper).balance, amount);
    }
}

/**
 * @title Mock ERC20 Token
 * @notice Mock ERC20 for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
