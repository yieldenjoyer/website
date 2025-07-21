// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IMorphoFlashLoanCallback
 * @notice Interface for Morpho Flash Loan Callback
 * @dev Callback interface for flash loan functionality in Morpho
 */
interface IMorphoFlashLoanCallback {
    /**
     * @dev Called after receiving flash loan assets
     * @param assets The amount of assets received
     * @param data The callback data
     */
    function onMorphoFlashLoan(uint256 assets, bytes calldata data) external;
}

/**
 * @title IMorphoSupplyCallback
 * @notice Interface for Morpho Supply Callback
 * @dev Callback interface for supply functionality in Morpho
 */
interface IMorphoSupplyCallback {
    /**
     * @dev Called after supply operation
     * @param assets The amount of assets supplied
     * @param data The callback data
     */
    function onMorphoSupply(uint256 assets, bytes calldata data) external;
}

/**
 * @title IMorphoRepayCallback
 * @notice Interface for Morpho Repay Callback
 * @dev Callback interface for repay functionality in Morpho
 */
interface IMorphoRepayCallback {
    /**
     * @dev Called after repay operation
     * @param assets The amount of assets repaid
     * @param data The callback data
     */
    function onMorphoRepay(uint256 assets, bytes calldata data) external;
}

/**
 * @title IMorphoLiquidateCallback
 * @notice Interface for Morpho Liquidate Callback
 * @dev Callback interface for liquidation functionality in Morpho
 */
interface IMorphoLiquidateCallback {
    /**
     * @dev Called after liquidation operation
     * @param repaidAssets The amount of assets repaid
     * @param data The callback data
     */
    function onMorphoLiquidate(uint256 repaidAssets, bytes calldata data) external;
}

/**
 * @title IMorphoCallbacks
 * @notice Combined interface for all Morpho callbacks
 * @dev Aggregates all callback interfaces for convenience
 */
interface IMorphoCallbacks is 
    IMorphoFlashLoanCallback,
    IMorphoSupplyCallback,
    IMorphoRepayCallback,
    IMorphoLiquidateCallback
{
    // This interface combines all callback interfaces
}
