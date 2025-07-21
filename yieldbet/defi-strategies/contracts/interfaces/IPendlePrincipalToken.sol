// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title IPendlePrincipalToken
 * @dev Interface for Pendle Principal Token (PT) contracts
 * @notice Principal Tokens represent the principal component of yield-bearing assets
 * in Pendle's yield tokenization system. They can be redeemed 1:1 for the underlying
 * asset after expiry.
 */
interface IPendlePrincipalToken is IERC20 {
    // Events
    event Initialized(uint8 version);

    // Core PT functions
    
    /**
     * @notice Returns the Standardized Yield (SY) token address
     * @return The address of the SY token that this PT is derived from
     */
    function SY() external view returns (address);

    /**
     * @notice Returns the Yield Token (YT) address
     * @return The address of the corresponding YT token
     */
    function YT() external view returns (address);

    /**
     * @notice Returns the factory address that created this PT
     * @return The factory contract address
     */
    function factory() external view returns (address);

    /**
     * @notice Returns the expiry timestamp of this PT
     * @return The Unix timestamp when this PT expires
     */
    function expiry() external view returns (uint256);

    /**
     * @notice Checks if the PT has expired
     * @return True if current time is past expiry, false otherwise
     */
    function isExpired() external view returns (bool);

    /**
     * @notice Initializes the PT with the YT address
     * @param _YT The address of the corresponding Yield Token
     * @dev This function should only be called once during deployment
     */
    function initialize(address _YT) external;

    /**
     * @notice Mints PT tokens to a user (called by YT contract)
     * @param user The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @dev This function should only be callable by the YT contract
     */
    function mintByYT(address user, uint256 amount) external;

    /**
     * @notice Burns PT tokens from a user (called by YT contract)
     * @param user The address to burn tokens from
     * @param amount The amount of tokens to burn
     * @dev This function should only be callable by the YT contract
     */
    function burnByYT(address user, uint256 amount) external;

    /**
     * @notice Returns the number of decimals for the token
     * @return The number of decimals
     */
    function decimals() external view returns (uint8);

    /**
     * @notice Returns the name of the token
     * @return The token name
     */
    function name() external view returns (string memory);

    /**
     * @notice Returns the symbol of the token
     * @return The token symbol
     */
    function symbol() external view returns (string memory);
}
