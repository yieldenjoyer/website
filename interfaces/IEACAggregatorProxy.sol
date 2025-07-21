// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IEACAggregatorProxy
 * @dev Interface for Chainlink's EACAggregatorProxy - provides access to price feeds
 * @notice Used for getting price data from Chainlink oracles in DeFi applications
 */
interface IEACAggregatorProxy {
    // Events
    event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);
    event OwnershipTransferRequested(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed from, address indexed to);
    event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);

    // Core price functions
    function latestAnswer() external view returns (int256);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function getAnswer(uint256 _roundId) external view returns (int256);
    function getTimestamp(uint256 _roundId) external view returns (uint256);

    // Round information
    function latestRound() external view returns (uint256);
    function latestTimestamp() external view returns (uint256);
    function phaseId() external view returns (uint16);

    // Metadata
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function decimals() external view returns (uint8);

    // Aggregator management
    function aggregator() external view returns (address);
    function proposeAggregator(address _aggregator) external;
    function confirmAggregator(address _aggregator) external;
    function proposedAggregator() external view returns (address);
    function phaseAggregators(uint16) external view returns (address);

    // Proposed aggregator functions
    function proposedLatestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function proposedGetRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );

    // Access control
    function accessController() external view returns (address);
    function setController(address _accessController) external;

    // Ownership
    function owner() external view returns (address);
    function transferOwnership(address _to) external;
    function acceptOwnership() external;
}
