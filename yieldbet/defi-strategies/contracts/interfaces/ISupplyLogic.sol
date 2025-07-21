// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title ISupplyLogic
 * @dev Interface for Aave V3 Supply Logic contract
 * @notice This library contains the logic for supply and withdraw operations
 */
interface ISupplyLogic {
    
    // Events
    event Supply(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint16 indexed referralCode
    );
    
    event Withdraw(
        address indexed reserve,
        address indexed user,
        address indexed to,
        uint256 amount
    );
    
    event ReserveUsedAsCollateralEnabled(
        address indexed reserve,
        address indexed user
    );
    
    event ReserveUsedAsCollateralDisabled(
        address indexed reserve,
        address indexed user
    );
    
    event ReserveDataUpdated(
        address indexed reserve,
        uint256 liquidityRate,
        uint256 stableBorrowRate,
        uint256 variableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex
    );
    
    // Note: This is a library contract, so it doesn't have callable functions
    // The functions are used internally by the Pool contract
    // This interface is mainly for event definitions and type safety
}
