// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SimplePTYTLooper.sol";
import "../src/EnhancedPTYTLooper.sol";

/**
 * @title ETH Withdrawal Vulnerability Test
 * @notice Test suite to verify ETH withdrawal functionality
 */
contract ETHWithdrawalTest is Test {
    SimplePTYTLooper public simpleLooper;
    EnhancedPTYTLooper public enhancedLooper;
    
    address public owner = address(0x1);
    address public user = address(0x2);
    
    function setUp() public {
        vm.prank(owner);
        // Deploy contracts (simplified for testing)
        // Note: Real deployment would require proper initialization
    }
    
    function testSimpleLooperETHWithdrawal() public {
        // Send ETH to contract
        vm.deal(address(simpleLooper), 1 ether);
        
        // Verify ETH is in contract
        assertEq(address(simpleLooper).balance, 1 ether);
        
        // Only owner can withdraw
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        simpleLooper.emergencyWithdrawETH();
        
        // Owner can withdraw
        vm.prank(owner);
        uint256 ownerBalanceBefore = owner.balance;
        simpleLooper.emergencyWithdrawETH();
        
        // Verify withdrawal
        assertEq(address(simpleLooper).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + 1 ether);
    }
    
    function testEnhancedLooperETHWithdrawal() public {
        // Send ETH to contract
        vm.deal(address(enhancedLooper), 2 ether);
        
        // Verify ETH is in contract
        assertEq(address(enhancedLooper).balance, 2 ether);
        
        // Only owner can withdraw
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        enhancedLooper.emergencyWithdrawETH();
        
        // Owner can withdraw
        vm.prank(owner);
        uint256 ownerBalanceBefore = owner.balance;
        enhancedLooper.emergencyWithdrawETH();
        
        // Verify withdrawal
        assertEq(address(enhancedLooper).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + 2 ether);
    }
    
    function testCannotWithdrawWhenNoETH() public {
        // Verify no ETH in contract
        assertEq(address(simpleLooper).balance, 0);
        
        // Should revert when no ETH to withdraw
        vm.prank(owner);
        vm.expectRevert("No ETH to withdraw");
        simpleLooper.emergencyWithdrawETH();
    }
    
    function testReceiveFunctionStillWorks() public {
        // Test that receive function still accepts ETH
        vm.deal(user, 1 ether);
        
        vm.prank(user);
        (bool success, ) = address(simpleLooper).call{value: 0.5 ether}("");
        require(success, "ETH transfer failed");
        assertTrue(success);
        
        assertEq(address(simpleLooper).balance, 0.5 ether);
        
        // Owner can withdraw the received ETH
        vm.prank(owner);
        simpleLooper.emergencyWithdrawETH();
        assertEq(address(simpleLooper).balance, 0);
    }
}
