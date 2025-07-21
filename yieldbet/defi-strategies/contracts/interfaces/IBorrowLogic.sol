// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IBorrowLogic
 * @dev Interface for Aave V3 Borrow Logic contract
 * @notice This library contains the logic for borrowing and repaying operations
 */
interface IBorrowLogic {
    
    // Events
    event Borrow(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint8 interestRateMode,
        uint256 borrowRate,
        uint16 indexed referralCode
    );
    
    event Repay(
        address indexed reserve,
        address indexed user,
        address indexed repayer,
        uint256 amount,
        bool useATokens
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
    
    event IsolationModeTotalDebtUpdated(
        address indexed asset,
        uint256 totalDebt
    );
    
    // Note: This is a library contract, so it doesn't have callable functions
    // The functions are used internally by the Pool contract
    // This interface is mainly for event definitions and type safety
}
