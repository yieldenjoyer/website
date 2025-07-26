// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IPriceAdapterStable
 * @author Aave
 * @notice Interface for Price Adapter for stable assets with price capping functionality
 * @dev This adapter provides price feeds with optional price caps for stable assets
 */
interface IPriceAdapterStable {
    
    /**
     * @dev Emitted when the price cap is updated
     * @param priceCap The new price cap value
     */
    event PriceCapUpdated(int256 priceCap);

    /**
     * @notice Returns the ACL Manager address
     * @return The address of the ACL Manager contract
     */
    function ACL_MANAGER() external view returns (address);

    /**
     * @notice Returns the asset to USD aggregator address
     * @return The address of the underlying Chainlink aggregator
     */
    function ASSET_TO_USD_AGGREGATOR() external view returns (address);

    /**
     * @notice Returns the number of decimals for the price feed
     * @return The number of decimals (typically 8 for USD price feeds)
     */
    function decimals() external view returns (uint8);

    /**
     * @notice Returns the description of the price feed
     * @return The description string for this adapter
     */
    function description() external view returns (string memory);

    /**
     * @notice Returns whether the price feed has a cap enabled
     * @return True if price capping is enabled, false otherwise
     */
    function isCapped() external view returns (bool);

    /**
     * @notice Returns the latest price from the aggregator
     * @dev If capped, returns the minimum of the actual price and the price cap
     * @return The latest price in the aggregator's native decimals
     */
    function latestAnswer() external view returns (int256);

    /**
     * @notice Sets a new price cap for the adapter
     * @dev Only callable by authorized addresses (ACL Manager)
     * @param priceCap The new price cap value
     */
    function setPriceCap(int256 priceCap) external;
}

/**
 * @title IPriceAdapterStableExtended
 * @notice Extended interface that might include additional Chainlink aggregator functions
 * @dev This interface extends the basic adapter with standard Chainlink functions
 */
interface IPriceAdapterStableExtended is IPriceAdapterStable {
    
    /**
     * @notice Returns the latest round data (if supported)
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt When the round started
     * @return updatedAt When the round was last updated
     * @return answeredInRound The round ID when the answer was computed
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );

    /**
     * @notice Returns the version of the aggregator
     * @return The aggregator version
     */
    function version() external view returns (uint256);

    /**
     * @notice Returns historical round data
     * @param roundId The round ID to query
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt When the round started
     * @return updatedAt When the round was last updated
     * @return answeredInRound The round ID when the answer was computed
     */
    function getRoundData(uint80 roundId) external view returns (
        uint80,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
