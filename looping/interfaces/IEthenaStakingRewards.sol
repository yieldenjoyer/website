// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IEthenaStakingRewards
 * @notice Interface for Ethena Staking Rewards Contract
 * @dev Manages staking rewards for Ethena protocol
 */
interface IEthenaStakingRewards {
    /**
     * @dev Emitted when rewards are added
     * @param reward The amount of rewards added
     */
    event RewardAdded(uint256 reward);

    /**
     * @dev Emitted when a user stakes tokens
     * @param user The user address
     * @param amount The amount staked
     */
    event Staked(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user withdraws tokens
     * @param user The user address
     * @param amount The amount withdrawn
     */
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Emitted when rewards are paid to a user
     * @param user The user address
     * @param reward The amount of rewards paid
     */
    event RewardPaid(address indexed user, uint256 reward);

    /**
     * @dev Emitted when the rewards duration is updated
     * @param newDuration The new rewards duration
     */
    event RewardsDurationUpdated(uint256 newDuration);

    /**
     * @dev Emitted when tokens are recovered
     * @param token The token address
     * @param amount The amount recovered
     */
    event Recovered(address token, uint256 amount);

    /**
     * @dev Emitted when the rewards distributor is updated
     * @param newDistributor The new rewards distributor address
     */
    event RewardsDistributorUpdated(address indexed newDistributor);

    /**
     * @dev Stakes tokens for rewards
     * @param amount The amount to stake
     */
    function stake(uint256 amount) external;

    /**
     * @dev Withdraws staked tokens
     * @param amount The amount to withdraw
     */
    function withdraw(uint256 amount) external;

    /**
     * @dev Claims earned rewards
     */
    function getReward() external;

    /**
     * @dev Exits the staking (withdraw all and claim rewards)
     */
    function exit() external;

    /**
     * @dev Returns the total supply of staked tokens
     * @return The total supply
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the staked balance of a user
     * @param account The user address
     * @return The staked balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Returns the last time rewards were applicable
     * @return The timestamp
     */
    function lastTimeRewardApplicable() external view returns (uint256);

    /**
     * @dev Returns the current reward per token
     * @return The reward per token
     */
    function rewardPerToken() external view returns (uint256);

    /**
     * @dev Returns the earned rewards for a user
     * @param account The user address
     * @return The earned rewards
     */
    function earned(address account) external view returns (uint256);

    /**
     * @dev Returns the reward for a given duration
     * @param duration The duration in seconds
     * @return The reward for the duration
     */
    function getRewardForDuration(uint256 duration) external view returns (uint256);

    /**
     * @dev Returns the current reward rate
     * @return The reward rate per second
     */
    function rewardRate() external view returns (uint256);

    /**
     * @dev Returns the rewards duration
     * @return The rewards duration in seconds
     */
    function rewardsDuration() external view returns (uint256);

    /**
     * @dev Returns the period finish timestamp
     * @return The period finish timestamp
     */
    function periodFinish() external view returns (uint256);

    /**
     * @dev Returns the last update time
     * @return The last update time
     */
    function lastUpdateTime() external view returns (uint256);

    /**
     * @dev Returns the stored reward per token
     * @return The stored reward per token
     */
    function rewardPerTokenStored() external view returns (uint256);

    /**
     * @dev Returns the user reward per token paid
     * @param account The user address
     * @return The user reward per token paid
     */
    function userRewardPerTokenPaid(address account) external view returns (uint256);

    /**
     * @dev Returns the user rewards
     * @param account The user address
     * @return The user rewards
     */
    function rewards(address account) external view returns (uint256);

    /**
     * @dev Returns the staking token address
     * @return The staking token address
     */
    function stakingToken() external view returns (address);

    /**
     * @dev Returns the rewards token address
     * @return The rewards token address
     */
    function rewardsToken() external view returns (address);

    /**
     * @dev Returns the rewards distributor address
     * @return The rewards distributor address
     */
    function rewardsDistributor() external view returns (address);

    /**
     * @dev Notifies about reward amount (only callable by distributor)
     * @param reward The reward amount
     */
    function notifyRewardAmount(uint256 reward) external;

    /**
     * @dev Sets the rewards duration (only callable by owner)
     * @param newRewardsDuration The new rewards duration
     */
    function setRewardsDuration(uint256 newRewardsDuration) external;

    /**
     * @dev Sets the rewards distributor (only callable by owner)
     * @param newRewardsDistributor The new rewards distributor address
     */
    function setRewardsDistributor(address newRewardsDistributor) external;

    /**
     * @dev Recovers ERC20 tokens (only callable by owner)
     * @param tokenAddress The token address
     * @param tokenAmount The token amount
     */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external;

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
     * @dev Updates the reward for a user (internal function called by modifiers)
     * @param account The user address
     */
    function updateReward(address account) external;

    /**
     * @dev Returns the minimum staking amount
     * @return The minimum staking amount
     */
    function minimumStake() external view returns (uint256);

    /**
     * @dev Sets the minimum staking amount
     * @param newMinimumStake The new minimum staking amount
     */
    function setMinimumStake(uint256 newMinimumStake) external;

    /**
     * @dev Returns the maximum staking amount
     * @return The maximum staking amount
     */
    function maximumStake() external view returns (uint256);

    /**
     * @dev Sets the maximum staking amount
     * @param newMaximumStake The new maximum staking amount
     */
    function setMaximumStake(uint256 newMaximumStake) external;

    /**
     * @dev Returns the staking fee
     * @return The staking fee in basis points
     */
    function stakingFee() external view returns (uint256);

    /**
     * @dev Sets the staking fee
     * @param newStakingFee The new staking fee in basis points
     */
    function setStakingFee(uint256 newStakingFee) external;

    /**
     * @dev Returns the withdrawal fee
     * @return The withdrawal fee in basis points
     */
    function withdrawalFee() external view returns (uint256);

    /**
     * @dev Sets the withdrawal fee
     * @param newWithdrawalFee The new withdrawal fee in basis points
     */
    function setWithdrawalFee(uint256 newWithdrawalFee) external;

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
}
