// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "./IERC20.sol";

/**
 * @title ISUSDE
 * @notice Interface for Ethena sUSDe (Staked USDe) Token
 * @dev Represents staked USDe tokens in the Ethena protocol
 */
interface ISUSDE is IERC20 {
    /**
     * @dev Emitted when tokens are minted
     * @param to The recipient address
     * @param amount The amount minted
     */
    event Minted(address indexed to, uint256 amount);

    /**
     * @dev Emitted when tokens are burned
     * @param from The holder address
     * @param amount The amount burned
     */
    event Burned(address indexed from, uint256 amount);

    /**
     * @dev Emitted when the vest amount is updated
     * @param newVestAmount The new vest amount
     */
    event VestAmountUpdated(uint256 newVestAmount);

    /**
     * @dev Emitted when rewards are distributed
     * @param amount The amount of rewards distributed
     */
    event RewardsDistributed(uint256 amount);

    /**
     * @dev Emitted when the rewards distributor is updated
     * @param newDistributor The new rewards distributor address
     */
    event RewardsDistributorUpdated(address indexed newDistributor);

    /**
     * @dev Emitted when the vest period is updated
     * @param newVestPeriod The new vest period
     */
    event VestPeriodUpdated(uint256 newVestPeriod);

    /**
     * @dev Emitted when a user starts vesting
     * @param user The user address
     * @param amount The amount being vested
     * @param vestingEnd The vesting end timestamp
     */
    event VestingStarted(address indexed user, uint256 amount, uint256 vestingEnd);

    /**
     * @dev Emitted when a user claims vested tokens
     * @param user The user address
     * @param amount The amount claimed
     */
    event VestingClaimed(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user cancels vesting
     * @param user The user address
     * @param amount The amount cancelled
     */
    event VestingCancelled(address indexed user, uint256 amount);

    /**
     * @dev Mints tokens to a recipient
     * @param to The recipient address
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burns tokens from a holder
     * @param from The holder address
     * @param amount The amount to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @dev Returns the current vest amount
     * @return The vest amount
     */
    function vestAmount() external view returns (uint256);

    /**
     * @dev Returns the vest period
     * @return The vest period in seconds
     */
    function vestPeriod() external view returns (uint256);

    /**
     * @dev Returns the rewards distributor address
     * @return The rewards distributor address
     */
    function rewardsDistributor() external view returns (address);

    /**
     * @dev Returns the underlying USDe token address
     * @return The USDe token address
     */
    function underlying() external view returns (address);

    /**
     * @dev Returns the current exchange rate (sUSDe to USDe)
     * @return The exchange rate
     */
    function exchangeRate() external view returns (uint256);

    /**
     * @dev Converts sUSDe amount to USDe amount
     * @param sUSDeAmount The sUSDe amount
     * @return The USDe amount
     */
    function convertToUSDe(uint256 sUSDeAmount) external view returns (uint256);

    /**
     * @dev Converts USDe amount to sUSDe amount
     * @param uSDeAmount The USDe amount
     * @return The sUSDe amount
     */
    function convertToSUSDe(uint256 uSDeAmount) external view returns (uint256);

    /**
     * @dev Distributes rewards to holders
     * @param amount The amount of rewards to distribute
     */
    function distributeRewards(uint256 amount) external;

    /**
     * @dev Starts vesting for a user
     * @param amount The amount to vest
     */
    function startVesting(uint256 amount) external;

    /**
     * @dev Claims vested tokens
     */
    function claimVested() external;

    /**
     * @dev Cancels vesting and returns tokens
     */
    function cancelVesting() external;

    /**
     * @dev Returns the vesting info for a user
     * @param user The user address
     * @return amount The vesting amount
     * @return vestingEnd The vesting end timestamp
     * @return claimed The amount already claimed
     */
    function getVestingInfo(address user) external view returns (uint256 amount, uint256 vestingEnd, uint256 claimed);

    /**
     * @dev Returns the claimable vested amount for a user
     * @param user The user address
     * @return The claimable amount
     */
    function getClaimableVested(address user) external view returns (uint256);

    /**
     * @dev Returns the total vested amount
     * @return The total vested amount
     */
    function totalVested() external view returns (uint256);

    /**
     * @dev Returns the total claimed amount
     * @return The total claimed amount
     */
    function totalClaimed() external view returns (uint256);

    /**
     * @dev Sets the vest amount (only callable by owner)
     * @param newVestAmount The new vest amount
     */
    function setVestAmount(uint256 newVestAmount) external;

    /**
     * @dev Sets the vest period (only callable by owner)
     * @param newVestPeriod The new vest period
     */
    function setVestPeriod(uint256 newVestPeriod) external;

    /**
     * @dev Sets the rewards distributor (only callable by owner)
     * @param newDistributor The new rewards distributor address
     */
    function setRewardsDistributor(address newDistributor) external;

    /**
     * @dev Returns the maximum vest amount per user
     * @return The maximum vest amount
     */
    function maxVestPerUser() external view returns (uint256);

    /**
     * @dev Sets the maximum vest amount per user
     * @param newMaxVestPerUser The new maximum vest amount
     */
    function setMaxVestPerUser(uint256 newMaxVestPerUser) external;

    /**
     * @dev Returns the minimum vest amount
     * @return The minimum vest amount
     */
    function minVestAmount() external view returns (uint256);

    /**
     * @dev Sets the minimum vest amount
     * @param newMinVestAmount The new minimum vest amount
     */
    function setMinVestAmount(uint256 newMinVestAmount) external;

    /**
     * @dev Returns the vest fee
     * @return The vest fee in basis points
     */
    function vestFee() external view returns (uint256);

    /**
     * @dev Sets the vest fee
     * @param newVestFee The new vest fee in basis points
     */
    function setVestFee(uint256 newVestFee) external;

    /**
     * @dev Returns the fee recipient address
     * @return The fee recipient address
     */
    function feeRecipient() external view returns (address);

    /**
     * @dev Sets the fee recipient address
     * @param newFeeRecipient The new fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external;

    /**
     * @dev Pauses the contract (only callable by owner)
     */
    function pause() external;

    /**
     * @dev Unpauses the contract (only callable by owner)
     */
    function unpause() external;

    /**
     * @dev Returns whether the contract is paused
     * @return Whether the contract is paused
     */
    function paused() external view returns (bool);

    /**
     * @dev Returns the owner of the contract
     * @return The owner address
     */
    function owner() external view returns (address);

    /**
     * @dev Transfers ownership of the contract
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external;

    /**
     * @dev Renounces ownership of the contract
     */
    function renounceOwnership() external;

    /**
     * @dev Returns the accumulated rewards per share
     * @return The accumulated rewards per share
     */
    function accRewardsPerShare() external view returns (uint256);

    /**
     * @dev Returns the total rewards distributed
     * @return The total rewards distributed
     */
    function totalRewardsDistributed() external view returns (uint256);

    /**
     * @dev Returns the pending rewards for a user
     * @param user The user address
     * @return The pending rewards
     */
    function pendingRewards(address user) external view returns (uint256);

    /**
     * @dev Claims pending rewards for a user
     */
    function claimRewards() external;

    /**
     * @dev Returns the last reward distribution timestamp
     * @return The last reward distribution timestamp
     */
    function lastRewardDistribution() external view returns (uint256);

    /**
     * @dev Returns the reward distribution interval
     * @return The reward distribution interval in seconds
     */
    function rewardDistributionInterval() external view returns (uint256);

    /**
     * @dev Sets the reward distribution interval
     * @param newInterval The new reward distribution interval
     */
    function setRewardDistributionInterval(uint256 newInterval) external;
}
