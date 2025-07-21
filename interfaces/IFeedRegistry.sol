// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IFeedRegistry
 * @notice Interface for Chainlink Feed Registry
 * @dev Provides access to price data for various asset pairs
 */
interface IFeedRegistry {
    /**
     * @dev Emitted when a new feed is added
     * @param base The base asset address
     * @param quote The quote asset address
     * @param aggregator The aggregator address
     * @param decimals The decimals of the feed
     */
    event FeedProposed(
        address indexed base,
        address indexed quote,
        address aggregator,
        uint8 decimals
    );

    /**
     * @dev Emitted when a feed is confirmed
     * @param base The base asset address
     * @param quote The quote asset address
     * @param aggregator The aggregator address
     * @param decimals The decimals of the feed
     */
    event FeedConfirmed(
        address indexed base,
        address indexed quote,
        address aggregator,
        uint8 decimals
    );

    /**
     * @dev Returns the decimals for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The decimals of the feed
     */
    function decimals(address base, address quote) external view returns (uint8);

    /**
     * @dev Returns the description for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The description of the feed
     */
    function description(address base, address quote) external view returns (string memory);

    /**
     * @dev Returns the version for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The version of the feed
     */
    function version(address base, address quote) external view returns (uint256);

    /**
     * @dev Returns the latest round data for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function latestRoundData(address base, address quote)
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
     * @dev Returns the round data for a given base/quote pair and round ID
     * @param base The base asset address
     * @param quote The quote asset address
     * @param roundId The round ID
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getRoundData(address base, address quote, uint80 roundId)
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
     * @dev Returns the latest answer for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The latest price answer
     */
    function latestAnswer(address base, address quote) external view returns (int256);

    /**
     * @dev Returns the latest timestamp for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The latest timestamp
     */
    function latestTimestamp(address base, address quote) external view returns (uint256);

    /**
     * @dev Returns the latest round ID for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The latest round ID
     */
    function latestRound(address base, address quote) external view returns (uint256);

    /**
     * @dev Returns the aggregator address for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The aggregator address
     */
    function getFeed(address base, address quote) external view returns (address);

    /**
     * @dev Returns the phase ID for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The phase ID
     */
    function getPhase(address base, address quote) external view returns (uint16);

    /**
     * @dev Returns the round feed for a given base/quote pair and round ID
     * @param base The base asset address
     * @param quote The quote asset address
     * @param roundId The round ID
     * @return The round feed address
     */
    function getRoundFeed(address base, address quote, uint80 roundId) external view returns (address);

    /**
     * @dev Returns the phase range for a given base/quote pair and phase ID
     * @param base The base asset address
     * @param quote The quote asset address
     * @param phaseId The phase ID
     * @return startingRoundId The starting round ID
     * @return endingRoundId The ending round ID
     */
    function getPhaseRange(address base, address quote, uint16 phaseId)
        external
        view
        returns (uint80 startingRoundId, uint80 endingRoundId);

    /**
     * @dev Returns the previous round ID for a given base/quote pair and round ID
     * @param base The base asset address
     * @param quote The quote asset address
     * @param roundId The round ID
     * @return The previous round ID
     */
    function getPreviousRoundId(address base, address quote, uint80 roundId) external view returns (uint80);

    /**
     * @dev Returns the next round ID for a given base/quote pair and round ID
     * @param base The base asset address
     * @param quote The quote asset address
     * @param roundId The round ID
     * @return The next round ID
     */
    function getNextRoundId(address base, address quote, uint80 roundId) external view returns (uint80);

    /**
     * @dev Proposes a feed for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @param aggregator The aggregator address
     */
    function proposeFeed(address base, address quote, address aggregator) external;

    /**
     * @dev Confirms a feed for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @param aggregator The aggregator address
     */
    function confirmFeed(address base, address quote, address aggregator) external;

    /**
     * @dev Returns the proposed aggregator address for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The proposed aggregator address
     */
    function getProposedFeed(address base, address quote) external view returns (address);

    /**
     * @dev Returns whether a feed is currently proposed for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return Whether a feed is proposed
     */
    function proposedGetRoundData(address base, address quote, uint80 roundId)
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
     * @dev Returns the latest round data for a proposed feed
     * @param base The base asset address
     * @param quote The quote asset address
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function proposedLatestRoundData(address base, address quote)
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
     * @dev Returns the current phase ID for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return The current phase ID
     */
    function getCurrentPhaseId(address base, address quote) external view returns (uint16);

    /**
     * @dev Returns whether a feed exists for a given base/quote pair
     * @param base The base asset address
     * @param quote The quote asset address
     * @return Whether the feed exists
     */
    function isFeedEnabled(address base, address quote) external view returns (bool);

    /**
     * @dev Returns the type and version of the contract
     * @return The type and version string
     */
    function typeAndVersion() external pure returns (string memory);
}
