// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IDefaultReserveInterestRateStrategyV2
 * @author Aave
 * @notice Interface for the Aave V3 Default Reserve Interest Rate Strategy V2
 * @dev Defines the interface for interest rate calculation strategies
 */
interface IDefaultReserveInterestRateStrategyV2 {
    
    /**
     * @dev Struct to hold interest rate data in basis points
     */
    struct InterestRateDataBps {
        uint16 optimalUsageRatio;
        uint32 baseVariableBorrowRate;
        uint32 variableRateSlope1;
        uint32 variableRateSlope2;
    }

    /**
     * @dev Struct to hold interest rate data in standard units
     */
    struct InterestRateData {
        uint256 optimalUsageRatio;
        uint256 baseVariableBorrowRate;
        uint256 variableRateSlope1;
        uint256 variableRateSlope2;
    }

    /**
     * @dev Struct to hold calculation parameters
     */
    struct CalculateInterestRatesParams {
        uint256 unbacked;
        uint256 liquidityAdded;
        uint256 liquidityTaken;
        uint256 totalDebt;
        uint256 reserveFactor;
        address reserve;
        bool usingVirtualBalance;
        uint256 virtualUnderlyingBalance;
    }

    /**
     * @dev Emitted when the interest rate strategy is updated
     * @param reserve The address of the reserve
     * @param optimalUsageRatio The optimal usage ratio
     * @param baseVariableBorrowRate The base variable borrow rate
     * @param variableRateSlope1 The variable rate slope 1
     * @param variableRateSlope2 The variable rate slope 2
     */
    event RateDataUpdate(
        address indexed reserve,
        uint256 optimalUsageRatio,
        uint256 baseVariableBorrowRate,
        uint256 variableRateSlope1,
        uint256 variableRateSlope2
    );

    /**
     * @notice Returns the addresses provider
     * @return The addresses provider
     */
    function ADDRESSES_PROVIDER() external view returns (address);

    /**
     * @notice Returns the minimum optimal usage ratio
     * @return The minimum optimal usage ratio (64 = 0.64%)
     */
    function MIN_OPTIMAL_POINT() external view returns (uint256);

    /**
     * @notice Returns the maximum optimal usage ratio
     * @return The maximum optimal usage ratio (9900 = 99%)
     */
    function MAX_OPTIMAL_POINT() external view returns (uint256);

    /**
     * @notice Returns the maximum borrow rate
     * @return The maximum borrow rate (100000 = 1000%)
     */
    function MAX_BORROW_RATE() external view returns (uint256);

    /**
     * @notice Sets the interest rate parameters for a reserve (bytes version)
     * @param reserve The address of the reserve
     * @param rateData The encoded rate data
     */
    function setInterestRateParams(address reserve, bytes calldata rateData) external;

    /**
     * @notice Sets the interest rate parameters for a reserve (struct version)
     * @param reserve The address of the reserve
     * @param rateData The rate data struct
     */
    function setInterestRateParams(address reserve, InterestRateDataBps calldata rateData) external;

    /**
     * @notice Returns the interest rate data in basis points
     * @param reserve The address of the reserve
     * @return The interest rate data in basis points
     */
    function getInterestRateDataBps(address reserve) external view returns (InterestRateDataBps memory);

    /**
     * @notice Returns the interest rate data in standard units
     * @param reserve The address of the reserve
     * @return The interest rate data in standard units
     */
    function getInterestRateData(address reserve) external view returns (InterestRateData memory);

    /**
     * @notice Returns the optimal usage ratio for a reserve
     * @param reserve The address of the reserve
     * @return The optimal usage ratio
     */
    function getOptimalUsageRatio(address reserve) external view returns (uint256);

    /**
     * @notice Returns the base variable borrow rate for a reserve
     * @param reserve The address of the reserve
     * @return The base variable borrow rate
     */
    function getBaseVariableBorrowRate(address reserve) external view returns (uint256);

    /**
     * @notice Returns the variable rate slope 1 for a reserve
     * @param reserve The address of the reserve
     * @return The variable rate slope 1
     */
    function getVariableRateSlope1(address reserve) external view returns (uint256);

    /**
     * @notice Returns the variable rate slope 2 for a reserve
     * @param reserve The address of the reserve
     * @return The variable rate slope 2
     */
    function getVariableRateSlope2(address reserve) external view returns (uint256);

    /**
     * @notice Returns the maximum variable borrow rate for a reserve
     * @param reserve The address of the reserve
     * @return The maximum variable borrow rate
     */
    function getMaxVariableBorrowRate(address reserve) external view returns (uint256);

    /**
     * @notice Calculates the interest rates for a reserve
     * @param params The calculation parameters
     * @return liquidityRate The current liquidity rate
     * @return variableBorrowRate The current variable borrow rate
     */
    function calculateInterestRates(CalculateInterestRatesParams calldata params) 
        external 
        view 
        returns (uint256 liquidityRate, uint256 variableBorrowRate);
}
