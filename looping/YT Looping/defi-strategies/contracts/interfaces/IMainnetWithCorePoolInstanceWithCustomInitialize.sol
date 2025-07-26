// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @title IMainnetWithCorePoolInstanceWithCustomInitialize
 * @dev Interface for Mainnet Pool Instance with Custom Initialize
 * @notice This is an extended Aave V3 Pool contract with additional features
 * and custom initialization for mainnet deployment.
 */
interface IMainnetWithCorePoolInstanceWithCustomInitialize {
    
    // Structs
    struct ReserveConfigurationMap {
        uint256 data;
    }
    
    struct UserConfigurationMap {
        uint256 data;
    }
    
    struct ReserveData {
        ReserveConfigurationMap configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }
    
    struct EModeCategory {
        uint16 ltv;
        uint16 liquidationThreshold;
        uint16 liquidationBonus;
        address priceSource;
        string label;
    }
    
    struct EModeCategoryCollateralConfig {
        uint16 ltv;
        uint16 liquidationThreshold;
        uint16 liquidationBonus;
    }
    
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
    
    event FlashLoan(
        address indexed target,
        address indexed initiator,
        address indexed asset,
        uint256 amount,
        uint8 interestRateMode,
        uint256 premium,
        uint16 indexed referralCode
    );
    
    event LiquidationCall(
        address indexed collateralAsset,
        address indexed debtAsset,
        address indexed user,
        uint256 debtToCover,
        uint256 liquidatedCollateralAmount,
        address liquidator,
        bool receiveAToken
    );
    
    event ReserveDataUpdated(
        address indexed reserve,
        uint256 liquidityRate,
        uint256 stableBorrowRate,
        uint256 variableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex
    );
    
    event ReserveUsedAsCollateralEnabled(
        address indexed reserve,
        address indexed user
    );
    
    event ReserveUsedAsCollateralDisabled(
        address indexed reserve,
        address indexed user
    );
    
    event UserEModeSet(
        address indexed user,
        uint8 categoryId
    );
    
    event MintedToTreasury(
        address indexed reserve,
        uint256 amountMinted
    );
    
    event IsolationModeTotalDebtUpdated(
        address indexed asset,
        uint256 totalDebt
    );
    
    event DeficitCreated(
        address indexed user,
        address indexed debtAsset,
        uint256 amountCreated
    );
    
    event DeficitCovered(
        address indexed reserve,
        address indexed caller,
        uint256 amountCovered
    );
    
    event PositionManagerApproved(
        address indexed user,
        address indexed positionManager
    );
    
    event PositionManagerRevoked(
        address indexed user,
        address indexed positionManager
    );
    
    // Constants
    function ADDRESSES_PROVIDER() external view returns (address);
    function RESERVE_INTEREST_RATE_STRATEGY() external view returns (address);
    function POOL_REVISION() external view returns (uint256);
    function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128);
    function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128);
    function MAX_NUMBER_RESERVES() external view returns (uint16);
    function UMBRELLA() external view returns (bytes32);
    
    // Core functions
    function initialize(address provider) external;
    
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    function supplyWithPermit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external;
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;
    
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);
    
    function repayWithPermit(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external returns (uint256);
    
    function repayWithATokens(
        address asset,
        uint256 amount,
        uint256 interestRateMode
    ) external returns (uint256);
    
    function setUserUseReserveAsCollateral(
        address asset,
        bool useAsCollateral
    ) external;
    
    function setUserUseReserveAsCollateralOnBehalfOf(
        address asset,
        bool useAsCollateral,
        address onBehalfOf
    ) external;
    
    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address borrower,
        uint256 debtToCover,
        bool receiveAToken
    ) external;
    
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
    
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
    
    function multicall(bytes[] calldata data) external returns (bytes[] memory results);
    
    // User configuration
    function setUserEMode(uint8 categoryId) external;
    function setUserEModeOnBehalfOf(uint8 categoryId, address onBehalfOf) external;
    function getUserEMode(address user) external view returns (uint256);
    
    // Position manager functions
    function approvePositionManager(address positionManager, bool approve) external;
    function renouncePositionManagerRole(address user) external;
    function isApprovedPositionManager(address user, address positionManager) external view returns (bool);
    
    // View functions
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
    
    function getUserConfiguration(address user) external view returns (UserConfigurationMap memory);
    function getConfiguration(address asset) external view returns (ReserveConfigurationMap memory);
    function getReserveData(address asset) external view returns (ReserveData memory);
    function getReserveNormalizedIncome(address asset) external view returns (uint256);
    function getReserveNormalizedVariableDebt(address asset) external view returns (uint256);
    function getReservesList() external view returns (address[] memory);
    function getReserveAddressById(uint16 id) external view returns (address);
    function getReservesCount() external view returns (uint256);
    function getReserveAToken(address asset) external view returns (address);
    function getReserveVariableDebtToken(address asset) external view returns (address);
    
    // Admin functions
    function initReserve(
        address asset,
        address aTokenAddress,
        address variableDebtAddress
    ) external;
    
    function dropReserve(address asset) external;
    function setConfiguration(address asset, ReserveConfigurationMap calldata configuration) external;
    function updateFlashloanPremium(uint128 flashLoanPremium) external;
    function mintToTreasury(address[] calldata assets) external;
    function rescueTokens(address token, address to, uint256 amount) external;
    
    // EMode functions
    function configureEModeCategory(uint8 id, EModeCategory calldata category) external;
    function configureEModeCategoryCollateralBitmap(uint8 id, uint128 collateralBitmap) external;
    function configureEModeCategoryBorrowableBitmap(uint8 id, uint128 borrowableBitmap) external;
    function getEModeCategoryData(uint8 id) external view returns (EModeCategory memory);
    function getEModeCategoryCollateralConfig(uint8 id) external view returns (EModeCategoryCollateralConfig memory);
    function getEModeCategoryCollateralBitmap(uint8 id) external view returns (uint128);
    function getEModeCategoryBorrowableBitmap(uint8 id) external view returns (uint128);
    function getEModeCategoryLabel(uint8 id) external view returns (string memory);
    
    // Deficit management
    function getReserveDeficit(address asset) external view returns (uint256);
    function eliminateReserveDeficit(address asset, uint256 amount) external;
    
    // Liquidation grace period
    function setLiquidationGracePeriod(address asset, uint40 until) external;
    function getLiquidationGracePeriod(address asset) external view returns (uint40);
    
    // Virtual balance
    function getVirtualUnderlyingBalance(address asset) external view returns (uint128);
    
    // Isolation mode
    function resetIsolationModeTotalDebt(address asset) external;
    
    // Rate synchronization
    function syncRatesState(address asset) external;
    function syncIndexesState(address asset) external;
    
    // Logic contracts
    function getSupplyLogic() external pure returns (address);
    function getBorrowLogic() external pure returns (address);
    function getLiquidationLogic() external pure returns (address);
    function getEModeLogic() external pure returns (address);
    function getFlashLoanLogic() external pure returns (address);
    function getPoolLogic() external pure returns (address);
    
    // Transfer finalization
    function finalizeTransfer(
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFromBefore,
        uint256 balanceToBefore
    ) external;
}
