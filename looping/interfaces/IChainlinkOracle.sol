// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IChainlinkOracle
 * @notice Interface for Chainlink Oracle
 * @dev Provides access to price data from Chainlink oracles
 */
interface IChainlinkOracle {
    /**
     * @dev Emitted when a new aggregator is added
     * @param token The token address
     * @param aggregator The aggregator address
     */
    event AggregatorUpdated(address indexed token, address indexed aggregator);

    /**
     * @dev Emitted when the staleness period is updated
     * @param oldStalePeriod The old stale period
     * @param newStalePeriod The new stale period
     */
    event StalePeriodUpdated(uint256 oldStalePeriod, uint256 newStalePeriod);

    /**
     * @dev Returns the latest price for a given asset
     * @param asset The asset address
     * @return The latest price in wei
     */
    function getAssetPrice(address asset) external view returns (uint256);

    /**
     * @dev Returns the latest prices for multiple assets
     * @param assets Array of asset addresses
     * @return Array of prices in wei
     */
    function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory);

    /**
     * @dev Returns the source address for a given asset
     * @param asset The asset address
     * @return The source address (aggregator)
     */
    function getSourceOfAsset(address asset) external view returns (address);

    /**
     * @dev Returns the fallback oracle address
     * @return The fallback oracle address
     */
    function getFallbackOracle() external view returns (address);

    /**
     * @dev Sets the aggregator for a given asset
     * @param asset The asset address
     * @param aggregator The aggregator address
     */
    function setAssetSources(address[] calldata assets, address[] calldata aggregators) external;

    /**
     * @dev Sets the fallback oracle
     * @param fallbackOracle The fallback oracle address
     */
    function setFallbackOracle(address fallbackOracle) external;

    /**
     * @dev Returns the latest round data for a given asset
     * @param asset The asset address
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getLatestRoundData(address asset)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    /**
     * @dev Returns the round data for a given asset and round ID
     * @param asset The asset address
     * @param roundId The round ID
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getRoundData(address asset, uint80 roundId)
        external
        view
        returns (
            uint80,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    /**
     * @dev Returns the decimals for a given asset
     * @param asset The asset address
     * @return The decimals of the asset price feed
     */
    function getDecimals(address asset) external view returns (uint8);

    /**
     * @dev Returns the description for a given asset
     * @param asset The asset address
     * @return The description of the asset price feed
     */
    function getDescription(address asset) external view returns (string memory);

    /**
     * @dev Returns the version for a given asset
     * @param asset The asset address
     * @return The version of the asset price feed
     */
    function getVersion(address asset) external view returns (uint256);

    /**
     * @dev Returns the latest timestamp for a given asset
     * @param asset The asset address
     * @return The latest timestamp
     */
    function getLatestTimestamp(address asset) external view returns (uint256);

    /**
     * @dev Returns the latest round ID for a given asset
     * @param asset The asset address
     * @return The latest round ID
     */
    function getLatestRound(address asset) external view returns (uint256);

    /**
     * @dev Returns the stale period
     * @return The stale period in seconds
     */
    function getStalePeriod() external view returns (uint256);

    /**
     * @dev Sets the stale period
     * @param stalePeriod The new stale period in seconds
     */
    function setStalePeriod(uint256 stalePeriod) external;

    /**
     * @dev Returns whether a price is stale
     * @param asset The asset address
     * @return Whether the price is stale
     */
    function isStale(address asset) external view returns (bool);

    /**
     * @dev Returns the price with staleness check
     * @param asset The asset address
     * @return price The price in wei
     * @return isStale Whether the price is stale
     */
    function getPriceWithStalenessCheck(address asset) external view returns (uint256 price, bool isStale);

    /**
     * @dev Emergency function to pause oracle
     */
    function pause() external;

    /**
     * @dev Emergency function to unpause oracle
     */
    function unpause() external;

    /**
     * @dev Returns whether the oracle is paused
     * @return Whether the oracle is paused
     */
    function paused() external view returns (bool);

    /**
     * @dev Returns the owner of the oracle
     * @return The owner address
     */
    function owner() external view returns (address);

    /**
     * @dev Transfers ownership of the oracle
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external;

    /**
     * @dev Renounces ownership of the oracle
     */
    function renounceOwnership() external;

    /**
     * @dev Returns the type and version of the contract
     * @return The type and version string
     */
    function typeAndVersion() external pure returns (string memory);
}
