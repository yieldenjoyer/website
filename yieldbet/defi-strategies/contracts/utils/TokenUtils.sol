// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Token Utilities
 * @notice Utility functions for safe token operations including FoT and USDT-like tokens
 * @dev Provides enhanced token handling for DeFi operations
 */
library TokenUtils {
    using SafeERC20 for IERC20;

    /**
     * @notice Safely approve tokens, handling USDT-like tokens that require 0 approval first
     * @param token The token to approve
     * @param spender The address to approve
     * @param amount The amount to approve
     */
    function safeApprove(IERC20 token, address spender, uint256 amount) internal {
        // First try to approve the amount directly
        try token.approve(spender, amount) {
            return;
        } catch {
            // If it fails, reset to 0 first (for USDT-like tokens)
            token.safeApprove(spender, 0);
            token.safeApprove(spender, amount);
        }
    }

    /**
     * @notice Transfer tokens with fee-on-transfer protection
     * @param token The token to transfer
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return actualAmount The actual amount received after fees
     */
    function safeTransferWithFeeProtection(
        IERC20 token,
        address to,
        uint256 amount
    ) internal returns (uint256 actualAmount) {
        uint256 balanceBefore = token.balanceOf(to);
        token.safeTransfer(to, amount);
        uint256 balanceAfter = token.balanceOf(to);
        actualAmount = balanceAfter - balanceBefore;
    }

    /**
     * @notice Transfer tokens from with fee-on-transfer protection
     * @param token The token to transfer
     * @param from The sender address
     * @param to The recipient address  
     * @param amount The amount to transfer
     * @return actualAmount The actual amount received after fees
     */
    function safeTransferFromWithFeeProtection(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) internal returns (uint256 actualAmount) {
        uint256 balanceBefore = token.balanceOf(to);
        token.safeTransferFrom(from, to, amount);
        uint256 balanceAfter = token.balanceOf(to);
        actualAmount = balanceAfter - balanceBefore;
    }

    /**
     * @notice Check if a token has transfer fees
     * @param token The token to check
     * @param testAmount Amount to test with (should be available in contract)
     * @return hasFees True if the token has transfer fees
     * @dev This function transfers tokens to itself to test for fees
     */
    function hasTransferFees(IERC20 token, uint256 testAmount) internal returns (bool hasFees) {
        if (testAmount == 0) return false;
        
        uint256 balanceBefore = token.balanceOf(address(this));
        if (balanceBefore < testAmount) return false;
        
        // Transfer to self and check if full amount is received
        token.safeTransfer(address(this), testAmount);
        uint256 balanceAfter = token.balanceOf(address(this));
        
        hasFees = (balanceAfter != balanceBefore);
    }

    /**
     * @notice Get the actual transferable balance (accounting for potential fees)
     * @param token The token to check
     * @param holder The address holding the tokens
     * @return balance The balance that can actually be transferred
     */
    function getTransferableBalance(IERC20 token, address holder) internal view returns (uint256 balance) {
        balance = token.balanceOf(holder);
        // For simplicity, return full balance - in practice could implement fee estimation
    }
}
