// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IPendlePrincipalToken.sol";

/**
 * @title IPendlePrincipalTokenExtended
 * @dev Extended interface for Pendle Principal Token (PT) contracts
 * @notice This interface extends the basic IPendlePrincipalToken with additional
 * functions that may be useful for advanced PT/YT looping strategies and integrations.
 */
interface IPendlePrincipalTokenExtended is IPendlePrincipalToken {
    
    // Additional events that might be emitted
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    // Extended functionality
    
    /**
     * @notice Returns the underlying asset address
     * @return The address of the underlying asset (e.g., USDC, DAI)
     */
    function underlying() external view returns (address);
    
    /**
     * @notice Returns the current exchange rate from PT to underlying
     * @return The exchange rate (typically 1e18 for 1:1 before expiry)
     */
    function exchangeRate() external view returns (uint256);
    
    /**
     * @notice Returns the total supply of PT tokens
     * @return The total supply
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @notice Returns the balance of a specific account
     * @param account The account to check
     * @return The token balance
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Returns the allowance of a spender for an owner
     * @param owner The token owner
     * @param spender The approved spender
     * @return The allowance amount
     */
    function allowance(address owner, address spender) external view returns (uint256);
    
    /**
     * @notice Transfers tokens from caller to recipient
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return True if successful
     */
    function transfer(address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Transfers tokens from sender to recipient (requires approval)
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return True if successful
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Approves a spender to transfer tokens on behalf of caller
     * @param spender The spender address
     * @param amount The amount to approve
     * @return True if successful
     */
    function approve(address spender, uint256 amount) external returns (bool);
    
    /**
     * @notice Returns the market address associated with this PT
     * @return The market contract address
     */
    function market() external view returns (address);
    
    /**
     * @notice Returns the timestamp when PT was created
     * @return The creation timestamp
     */
    function createdAt() external view returns (uint256);
    
    /**
     * @notice Checks if the PT can be redeemed for underlying
     * @return True if redemption is possible (after expiry), false otherwise
     */
    function isRedeemable() external view returns (bool);
    
    /**
     * @notice Redeems PT tokens for underlying assets (post-expiry)
     * @param amount The amount of PT to redeem
     * @return The amount of underlying assets received
     */
    function redeem(uint256 amount) external returns (uint256);
    
    /**
     * @notice Redeems PT tokens for underlying assets on behalf of another user
     * @param user The user whose PT to redeem
     * @param amount The amount of PT to redeem
     * @return The amount of underlying assets received
     */
    function redeemFor(address user, uint256 amount) external returns (uint256);
    
    /**
     * @notice Returns the current rewards available for claiming
     * @param user The user to check rewards for
     * @return The amount of rewards available
     */
    function getRewards(address user) external view returns (uint256);
    
    /**
     * @notice Claims available rewards for the caller
     * @return The amount of rewards claimed
     */
    function claimRewards() external returns (uint256);
    
    /**
     * @notice Returns the yield generated since last interaction
     * @return The yield amount
     */
    function getYield() external view returns (uint256);
    
    /**
     * @notice Returns the annual percentage yield (APY) for this PT
     * @return The APY as a percentage (scaled by 1e18)
     */
    function getAPY() external view returns (uint256);
    
    /**
     * @notice Returns the time remaining until expiry
     * @return The time remaining in seconds
     */
    function timeToExpiry() external view returns (uint256);
    
    /**
     * @notice Returns the discount/premium rate of PT compared to underlying
     * @return The discount rate (negative for discount, positive for premium)
     */
    function getDiscountRate() external view returns (int256);
    
    /**
     * @notice Returns the implied yield rate for this PT
     * @return The implied yield rate (scaled by 1e18)
     */
    function getImpliedYield() external view returns (uint256);
    
    /**
     * @notice Pauses token transfers (admin function)
     * @dev Only callable by authorized addresses
     */
    function pause() external;
    
    /**
     * @notice Unpauses token transfers (admin function)
     * @dev Only callable by authorized addresses
     */
    function unpause() external;
    
    /**
     * @notice Returns whether the contract is paused
     * @return True if paused, false otherwise
     */
    function paused() external view returns (bool);
}
