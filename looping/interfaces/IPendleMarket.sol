// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IPendleMarket
 * @dev Interface for Pendle Market contract
 * @notice Pendle Markets are AMM pools that allow trading between PT and SY tokens
 * They use a custom AMM curve optimized for yield tokens with time decay.
 */
interface IPendleMarket {
    
    // Structs
    struct MarketState {
        int256 totalPt;
        int256 totalSy;
        int256 totalLp;
        address treasury;
        int256 scalarRoot;
        uint256 expiry;
        uint256 lnFeeRateRoot;
        uint256 reserveFeePercent;
        uint256 lastLnImpliedRate;
    }
    
    struct ApproxParams {
        uint256 guessMin;
        uint256 guessMax;
        uint256 guessOffchain;
        uint256 maxIteration;
        uint256 eps;
    }
    
    // Events
    event Swap(
        address indexed caller,
        address indexed receiver,
        int256 netPtOut,
        int256 netSyOut,
        uint256 netSyFee,
        uint256 netSyToReserve
    );
    
    event Mint(
        address indexed caller,
        address indexed receiver,
        uint256 netLpMinted,
        uint256 netSyUsed,
        uint256 netPtUsed
    );
    
    event Burn(
        address indexed caller,
        address indexed receiver,
        uint256 netLpBurned,
        uint256 netSyOut,
        uint256 netPtOut
    );
    
    event RedeemRewards(address indexed user, uint256[] rewardsOut);
    
    event NewTreasury(address indexed oldTreasury, address indexed newTreasury);
    
    event SetNewRewardTokens(address[] rewardTokens);
    
    // Core trading functions
    
    /**
     * @notice Swaps exact PT for SY tokens
     * @param receiver The address to receive SY tokens
     * @param exactPtIn The exact amount of PT tokens to swap
     * @param minSyOut The minimum amount of SY tokens to receive
     * @return netSyOut The amount of SY tokens received
     * @return netSyFee The fee charged in SY tokens
     */
    function swapExactPtForSy(
        address receiver,
        uint256 exactPtIn,
        uint256 minSyOut
    ) external returns (uint256 netSyOut, uint256 netSyFee);
    
    /**
     * @notice Swaps exact SY for PT tokens
     * @param receiver The address to receive PT tokens
     * @param exactSyIn The exact amount of SY tokens to swap
     * @param minPtOut The minimum amount of PT tokens to receive
     * @return netPtOut The amount of PT tokens received
     * @return netSyFee The fee charged in SY tokens
     */
    function swapExactSyForPt(
        address receiver,
        uint256 exactSyIn,
        uint256 minPtOut
    ) external returns (uint256 netPtOut, uint256 netSyFee);
    
    /**
     * @notice Swaps SY for exact PT tokens
     * @param receiver The address to receive PT tokens
     * @param exactPtOut The exact amount of PT tokens to receive
     * @param maxSyIn The maximum amount of SY tokens to use
     * @return netSyIn The amount of SY tokens used
     * @return netSyFee The fee charged in SY tokens
     */
    function swapSyForExactPt(
        address receiver,
        uint256 exactPtOut,
        uint256 maxSyIn
    ) external returns (uint256 netSyIn, uint256 netSyFee);
    
    /**
     * @notice Swaps PT for exact SY tokens
     * @param receiver The address to receive SY tokens
     * @param exactSyOut The exact amount of SY tokens to receive
     * @param maxPtIn The maximum amount of PT tokens to use
     * @return netPtIn The amount of PT tokens used
     * @return netSyFee The fee charged in SY tokens
     */
    function swapPtForExactSy(
        address receiver,
        uint256 exactSyOut,
        uint256 maxPtIn
    ) external returns (uint256 netPtIn, uint256 netSyFee);
    
    // Liquidity functions
    
    /**
     * @notice Adds liquidity to the market
     * @param receiver The address to receive LP tokens
     * @param netSyDesired The desired amount of SY tokens to add
     * @param netPtDesired The desired amount of PT tokens to add
     * @param minLpOut The minimum amount of LP tokens to receive
     * @return netLpOut The amount of LP tokens minted
     * @return netSyUsed The amount of SY tokens used
     * @return netPtUsed The amount of PT tokens used
     */
    function mint(
        address receiver,
        uint256 netSyDesired,
        uint256 netPtDesired,
        uint256 minLpOut
    ) external returns (uint256 netLpOut, uint256 netSyUsed, uint256 netPtUsed);
    
    /**
     * @notice Removes liquidity from the market
     * @param receiver The address to receive the underlying tokens
     * @param netLpToBurn The amount of LP tokens to burn
     * @param minSyOut The minimum amount of SY tokens to receive
     * @param minPtOut The minimum amount of PT tokens to receive
     * @return netSyOut The amount of SY tokens received
     * @return netPtOut The amount of PT tokens received
     */
    function burn(
        address receiver,
        uint256 netLpToBurn,
        uint256 minSyOut,
        uint256 minPtOut
    ) external returns (uint256 netSyOut, uint256 netPtOut);
    
    // View functions
    
    /**
     * @notice Returns the current market state
     * @return The market state struct
     */
    function readState() external view returns (MarketState memory);
    
    /**
     * @notice Returns the addresses of PT and SY tokens
     * @return pt The PT token address
     * @return sy The SY token address
     */
    function readTokens() external view returns (address pt, address sy);
    
    /**
     * @notice Returns the market expiry timestamp
     * @return The expiry timestamp
     */
    function expiry() external view returns (uint256);
    
    /**
     * @notice Returns the factory address
     * @return The factory address
     */
    function factory() external view returns (address);
    
    /**
     * @notice Returns the scalar root value
     * @return The scalar root
     */
    function scalarRoot() external view returns (int256);
    
    /**
     * @notice Returns the initial anchor value
     * @return The initial anchor
     */
    function initialAnchor() external view returns (int256);
    
    /**
     * @notice Returns the current anchor value
     * @return The current anchor
     */
    function currentAnchor() external view returns (int256);
    
    /**
     * @notice Returns the current implied rate
     * @return The implied rate
     */
    function getImpliedRate() external view returns (uint256);
    
    /**
     * @notice Returns the current exchange rate
     * @return The exchange rate
     */
    function getExchangeRate() external view returns (uint256);
    
    /**
     * @notice Returns the time to expiry
     * @return The time to expiry in seconds
     */
    function timeToExpiry() external view returns (uint256);
    
    /**
     * @notice Checks if the market is expired
     * @return True if expired, false otherwise
     */
    function isExpired() external view returns (bool);
    
    /**
     * @notice Returns the active balance of a user
     * @param user The user address
     * @return The active balance
     */
    function activeBalance(address user) external view returns (uint256);
    
    /**
     * @notice Returns the reward share global data
     * @return The reward share global data
     */
    function rewardSharesGlobal() external view returns (uint256);
    
    /**
     * @notice Returns the reward share of a user
     * @param user The user address
     * @return The reward share
     */
    function rewardShares(address user) external view returns (uint256);
    
    /**
     * @notice Returns the reward state data
     * @return The reward state data
     */
    function rewardState() external view returns (uint256);
    
    /**
     * @notice Returns the treasury address
     * @return The treasury address
     */
    function treasury() external view returns (address);
    
    /**
     * @notice Returns the reserve fee percentage
     * @return The reserve fee percentage
     */
    function reserveFeePercent() external view returns (uint256);
    
    /**
     * @notice Returns the ln of the fee rate root
     * @return The ln fee rate root
     */
    function lnFeeRateRoot() external view returns (uint256);
    
    // Reward functions
    
    /**
     * @notice Returns the list of reward tokens
     * @return The array of reward token addresses
     */
    function getRewardTokens() external view returns (address[] memory);
    
    /**
     * @notice Returns the user's reward info
     * @param user The user address
     * @param rewardTokens The array of reward token addresses
     * @return The array of reward amounts
     */
    function userReward(
        address user,
        address[] calldata rewardTokens
    ) external view returns (uint256[] memory);
    
    /**
     * @notice Redeems rewards for a user
     * @param user The user address
     * @return The array of reward amounts redeemed
     */
    function redeemRewards(address user) external returns (uint256[] memory);
    
    // Admin functions
    
    /**
     * @notice Sets the new treasury address
     * @param newTreasury The new treasury address
     */
    function setNewTreasury(address newTreasury) external;
    
    /**
     * @notice Sets the new reward tokens
     * @param rewardTokens The array of new reward token addresses
     */
    function setRewardTokens(address[] calldata rewardTokens) external;
    
    // Oracle functions
    
    /**
     * @notice Returns the observation data for a given timestamp
     * @param timestamp The timestamp to get observation for
     * @return The observation data
     */
    function observations(uint256 timestamp) external view returns (uint256);
    
    /**
     * @notice Returns the oracle cardinality
     * @return The oracle cardinality
     */
    function oracleCardinality() external view returns (uint256);
    
    /**
     * @notice Returns the oracle cardinality next
     * @return The oracle cardinality next
     */
    function oracleCardinalityNext() external view returns (uint256);
    
    /**
     * @notice Increases the oracle cardinality
     * @param cardinalityNext The new cardinality
     */
    function increaseOracleCardinality(uint256 cardinalityNext) external;
    
    /**
     * @notice Observes the oracle at given timestamps
     * @param timestamps The array of timestamps to observe
     * @return The array of observation data
     */
    function observe(uint256[] calldata timestamps) external view returns (uint256[] memory);
}
