// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IInitializableImmutableAdminProxy
 * @dev Interface for InitializableImmutableAdminProxy contract
 * @notice This contract manages reward distribution and claiming for Aave-like protocols
 * with upgradeability support and admin controls.
 */
interface IInitializableImmutableAdminProxy {
    
    // Structs
    struct RewardsConfigInput {
        uint88 emissionPerSecond;
        uint256 totalSupply;
        uint32 distributionEnd;
        address asset;
        address reward;
        address transferStrategy;
        address rewardOracle;
    }
    
    // Events
    event ClaimerSet(address indexed user, address indexed claimer);
    event RewardOracleUpdated(address indexed reward, address indexed rewardOracle);
    event RewardsClaimed(
        address indexed user,
        address indexed reward,
        address indexed to,
        address claimer,
        uint256 amount
    );
    event Upgraded(address indexed implementation);
    event TransferStrategyInstalled(address indexed reward, address indexed transferStrategy);
    event Accrued(
        address indexed asset,
        address indexed reward,
        address indexed user,
        uint256 assetIndex,
        uint256 userIndex,
        uint256 rewardsAccrued
    );
    event AssetConfigUpdated(
        address indexed asset,
        address indexed reward,
        uint256 oldEmission,
        uint256 newEmission,
        uint256 oldDistributionEnd,
        uint256 newDistributionEnd,
        uint256 assetIndex
    );
    
    // Core functions
    
    /**
     * @notice Initializes the contract
     * @param emissionManager The emission manager address
     */
    function initialize(address emissionManager) external;
    
    /**
     * @notice Returns the contract revision
     * @return The revision number
     */
    function REVISION() external view returns (uint256);
    
    /**
     * @notice Returns the emission manager address
     * @return The emission manager address
     */
    function EMISSION_MANAGER() external view returns (address);
    
    /**
     * @notice Returns the emission manager address
     * @return The emission manager address
     */
    function getEmissionManager() external view returns (address);
    
    /**
     * @notice Returns the admin address
     * @return The admin address
     */
    function admin() external returns (address);
    
    /**
     * @notice Returns the current implementation address
     * @return The implementation address
     */
    function implementation() external returns (address);
    
    /**
     * @notice Upgrades the contract to a new implementation
     * @param newImplementation The new implementation address
     */
    function upgradeTo(address newImplementation) external;
    
    /**
     * @notice Upgrades the contract and calls a function on the new implementation
     * @param newImplementation The new implementation address
     * @param data The call data for the new implementation
     */
    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable;
    
    // Reward configuration
    
    /**
     * @notice Configures assets for reward distribution
     * @param config Array of reward configuration parameters
     */
    function configureAssets(RewardsConfigInput[] calldata config) external;
    
    /**
     * @notice Sets emission per second for an asset
     * @param asset The asset address
     * @param rewards Array of reward token addresses
     * @param newEmissionsPerSecond Array of new emission rates
     */
    function setEmissionPerSecond(
        address asset,
        address[] calldata rewards,
        uint88[] calldata newEmissionsPerSecond
    ) external;
    
    /**
     * @notice Sets the distribution end time for an asset-reward pair
     * @param asset The asset address
     * @param reward The reward token address
     * @param newDistributionEnd The new distribution end timestamp
     */
    function setDistributionEnd(
        address asset,
        address reward,
        uint32 newDistributionEnd
    ) external;
    
    /**
     * @notice Sets the transfer strategy for a reward
     * @param reward The reward token address
     * @param transferStrategy The transfer strategy address
     */
    function setTransferStrategy(address reward, address transferStrategy) external;
    
    /**
     * @notice Sets the reward oracle for a reward
     * @param reward The reward token address
     * @param rewardOracle The reward oracle address
     */
    function setRewardOracle(address reward, address rewardOracle) external;
    
    // Reward claiming
    
    /**
     * @notice Sets a claimer for a user
     * @param user The user address
     * @param caller The claimer address
     */
    function setClaimer(address user, address caller) external;
    
    /**
     * @notice Gets the claimer for a user
     * @param user The user address
     * @return The claimer address
     */
    function getClaimer(address user) external view returns (address);
    
    /**
     * @notice Claims rewards for a user
     * @param assets Array of asset addresses
     * @param amount Amount of rewards to claim
     * @param to Address to send rewards to
     * @param reward Reward token address
     * @return Amount of rewards claimed
     */
    function claimRewards(
        address[] calldata assets,
        uint256 amount,
        address to,
        address reward
    ) external returns (uint256);
    
    /**
     * @notice Claims rewards to self
     * @param assets Array of asset addresses
     * @param amount Amount of rewards to claim
     * @param reward Reward token address
     * @return Amount of rewards claimed
     */
    function claimRewardsToSelf(
        address[] calldata assets,
        uint256 amount,
        address reward
    ) external returns (uint256);
    
    /**
     * @notice Claims rewards on behalf of another user
     * @param assets Array of asset addresses
     * @param amount Amount of rewards to claim
     * @param user User address to claim for
     * @param to Address to send rewards to
     * @param reward Reward token address
     * @return Amount of rewards claimed
     */
    function claimRewardsOnBehalf(
        address[] calldata assets,
        uint256 amount,
        address user,
        address to,
        address reward
    ) external returns (uint256);
    
    /**
     * @notice Claims all rewards for a user
     * @param assets Array of asset addresses
     * @param to Address to send rewards to
     * @return rewardsList Array of reward token addresses
     * @return claimedAmounts Array of claimed amounts
     */
    function claimAllRewards(
        address[] calldata assets,
        address to
    ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);
    
    /**
     * @notice Claims all rewards to self
     * @param assets Array of asset addresses
     * @return rewardsList Array of reward token addresses
     * @return claimedAmounts Array of claimed amounts
     */
    function claimAllRewardsToSelf(
        address[] calldata assets
    ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);
    
    /**
     * @notice Claims all rewards on behalf of another user
     * @param assets Array of asset addresses
     * @param user User address to claim for
     * @param to Address to send rewards to
     * @return rewardsList Array of reward token addresses
     * @return claimedAmounts Array of claimed amounts
     */
    function claimAllRewardsOnBehalf(
        address[] calldata assets,
        address user,
        address to
    ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);
    
    // View functions
    
    /**
     * @notice Gets reward data for an asset-reward pair
     * @param asset The asset address
     * @param reward The reward token address
     * @return index The reward index
     * @return emissionPerSecond The emission per second
     * @return lastUpdateTimestamp The last update timestamp
     * @return distributionEnd The distribution end timestamp
     */
    function getRewardsData(
        address asset,
        address reward
    ) external view returns (uint256, uint256, uint256, uint256);
    
    /**
     * @notice Gets the asset index for an asset-reward pair
     * @param asset The asset address
     * @param reward The reward token address
     * @return index The asset index
     * @return lastUpdateTimestamp The last update timestamp
     */
    function getAssetIndex(
        address asset,
        address reward
    ) external view returns (uint256 index, uint256 lastUpdateTimestamp);
    
    /**
     * @notice Gets the user asset index
     * @param user The user address
     * @param asset The asset address
     * @param reward The reward token address
     * @return The user asset index
     */
    function getUserAssetIndex(
        address user,
        address asset,
        address reward
    ) external view returns (uint256);
    
    /**
     * @notice Gets user's accrued rewards
     * @param user The user address
     * @param reward The reward token address
     * @return The accrued rewards amount
     */
    function getUserAccruedRewards(address user, address reward) external view returns (uint256);
    
    /**
     * @notice Gets user's rewards for specific assets
     * @param assets Array of asset addresses
     * @param user The user address
     * @param reward The reward token address
     * @return The total rewards amount
     */
    function getUserRewards(
        address[] calldata assets,
        address user,
        address reward
    ) external view returns (uint256);
    
    /**
     * @notice Gets all user's rewards
     * @param assets Array of asset addresses
     * @param user The user address
     * @return rewardsList Array of reward token addresses
     * @return unclaimedAmounts Array of unclaimed amounts
     */
    function getAllUserRewards(
        address[] calldata assets,
        address user
    ) external view returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts);
    
    /**
     * @notice Gets rewards by asset
     * @param asset The asset address
     * @return Array of reward token addresses
     */
    function getRewardsByAsset(address asset) external view returns (address[] memory);
    
    /**
     * @notice Gets all reward tokens
     * @return Array of reward token addresses
     */
    function getRewardsList() external view returns (address[] memory);
    
    /**
     * @notice Gets the distribution end time for an asset-reward pair
     * @param asset The asset address
     * @param reward The reward token address
     * @return The distribution end timestamp
     */
    function getDistributionEnd(address asset, address reward) external view returns (uint256);
    
    /**
     * @notice Gets the reward oracle for a reward
     * @param reward The reward token address
     * @return The reward oracle address
     */
    function getRewardOracle(address reward) external view returns (address);
    
    /**
     * @notice Gets the transfer strategy for a reward
     * @param reward The reward token address
     * @return The transfer strategy address
     */
    function getTransferStrategy(address reward) external view returns (address);
    
    /**
     * @notice Gets the asset decimals
     * @param asset The asset address
     * @return The asset decimals
     */
    function getAssetDecimals(address asset) external view returns (uint8);
    
    /**
     * @notice Handles user action (called by asset contracts)
     * @param user The user address
     * @param totalSupply The total supply of the asset
     * @param userBalance The user's balance
     */
    function handleAction(address user, uint256 totalSupply, uint256 userBalance) external;
}
