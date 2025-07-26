// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IMorpho
 * @notice Interface for Morpho Protocol
 * @dev Core lending protocol interface for Morpho
 */
interface IMorpho {
    /**
     * @dev Market configuration structure
     */
    struct MarketConfig {
        address underlying;
        uint256 irm;
        uint256 lltv;
        address oracle;
    }

    /**
     * @dev Market state structure
     */
    struct Market {
        uint256 totalSupplyAssets;
        uint256 totalSupplyShares;
        uint256 totalBorrowAssets;
        uint256 totalBorrowShares;
        uint256 lastUpdate;
        uint256 fee;
    }

    /**
     * @dev User position structure
     */
    struct Position {
        uint256 supplyShares;
        uint256 borrowShares;
        uint256 collateral;
    }

    /**
     * @dev Authorization structure
     */
    struct Authorization {
        address authorized;
        bool isAuthorized;
        uint256 nonce;
    }

    /**
     * @dev Emitted when a market is created
     * @param id The market id
     * @param marketConfig The market configuration
     */
    event CreateMarket(bytes32 indexed id, MarketConfig marketConfig);

    /**
     * @dev Emitted when supply is performed
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param assets The assets amount
     * @param shares The shares amount
     */
    event Supply(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when withdraw is performed
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     * @param assets The assets amount
     * @param shares The shares amount
     */
    event Withdraw(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        address indexed receiver,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when borrow is performed
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     * @param assets The assets amount
     * @param shares The shares amount
     */
    event Borrow(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        address indexed receiver,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when repay is performed
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param assets The assets amount
     * @param shares The shares amount
     */
    event Repay(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when collateral is supplied
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param assets The assets amount
     */
    event SupplyCollateral(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        uint256 assets
    );

    /**
     * @dev Emitted when collateral is withdrawn
     * @param id The market id
     * @param caller The caller address
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     * @param assets The assets amount
     */
    event WithdrawCollateral(
        bytes32 indexed id,
        address indexed caller,
        address indexed onBehalf,
        address indexed receiver,
        uint256 assets
    );

    /**
     * @dev Emitted when liquidation is performed
     * @param id The market id
     * @param caller The caller address
     * @param borrower The borrower address
     * @param repaidAssets The repaid assets amount
     * @param repaidShares The repaid shares amount
     * @param seizedAssets The seized assets amount
     * @param badDebtAssets The bad debt assets amount
     * @param badDebtShares The bad debt shares amount
     */
    event Liquidate(
        bytes32 indexed id,
        address indexed caller,
        address indexed borrower,
        uint256 repaidAssets,
        uint256 repaidShares,
        uint256 seizedAssets,
        uint256 badDebtAssets,
        uint256 badDebtShares
    );

    /**
     * @dev Emitted when flash loan is performed
     * @param caller The caller address
     * @param token The token address
     * @param assets The assets amount
     */
    event FlashLoan(address indexed caller, address indexed token, uint256 assets);

    /**
     * @dev Emitted when authorization is set
     * @param caller The caller address
     * @param authorized The authorized address
     * @param newIsAuthorized The new authorization status
     */
    event SetAuthorization(
        address indexed caller,
        address indexed authorized,
        bool newIsAuthorized
    );

    /**
     * @dev Emitted when authorization is set with signature
     * @param authorizer The authorizer address
     * @param authorized The authorized address
     * @param newIsAuthorized The new authorization status
     * @param nonce The nonce
     */
    event SetAuthorizationWithSig(
        address indexed authorizer,
        address indexed authorized,
        bool newIsAuthorized,
        uint256 nonce
    );

    /**
     * @dev Emitted when accrued interest is realized
     * @param id The market id
     * @param prevBorrowRate The previous borrow rate
     * @param interest The interest amount
     * @param feeShares The fee shares amount
     */
    event AccrueInterest(
        bytes32 indexed id,
        uint256 prevBorrowRate,
        uint256 interest,
        uint256 feeShares
    );

    /**
     * @dev Creates a new market
     * @param marketConfig The market configuration
     * @return id The market id
     */
    function createMarket(MarketConfig calldata marketConfig) external returns (bytes32 id);

    /**
     * @dev Supplies assets to a market
     * @param id The market id
     * @param assets The assets amount
     * @param shares The shares amount
     * @param onBehalf The on behalf address
     * @param data The callback data
     * @return assetsSupplied The assets supplied
     * @return sharesSupplied The shares supplied
     */
    function supply(
        bytes32 id,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256 assetsSupplied, uint256 sharesSupplied);

    /**
     * @dev Withdraws assets from a market
     * @param id The market id
     * @param assets The assets amount
     * @param shares The shares amount
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     * @return assetsWithdrawn The assets withdrawn
     * @return sharesWithdrawn The shares withdrawn
     */
    function withdraw(
        bytes32 id,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256 assetsWithdrawn, uint256 sharesWithdrawn);

    /**
     * @dev Borrows assets from a market
     * @param id The market id
     * @param assets The assets amount
     * @param shares The shares amount
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     * @return assetsBorrowed The assets borrowed
     * @return sharesBorrowed The shares borrowed
     */
    function borrow(
        bytes32 id,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256 assetsBorrowed, uint256 sharesBorrowed);

    /**
     * @dev Repays assets to a market
     * @param id The market id
     * @param assets The assets amount
     * @param shares The shares amount
     * @param onBehalf The on behalf address
     * @param data The callback data
     * @return assetsRepaid The assets repaid
     * @return sharesRepaid The shares repaid
     */
    function repay(
        bytes32 id,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256 assetsRepaid, uint256 sharesRepaid);

    /**
     * @dev Supplies collateral to a market
     * @param id The market id
     * @param assets The assets amount
     * @param onBehalf The on behalf address
     * @param data The callback data
     */
    function supplyCollateral(
        bytes32 id,
        uint256 assets,
        address onBehalf,
        bytes calldata data
    ) external;

    /**
     * @dev Withdraws collateral from a market
     * @param id The market id
     * @param assets The assets amount
     * @param onBehalf The on behalf address
     * @param receiver The receiver address
     */
    function withdrawCollateral(
        bytes32 id,
        uint256 assets,
        address onBehalf,
        address receiver
    ) external;

    /**
     * @dev Liquidates a position
     * @param id The market id
     * @param borrower The borrower address
     * @param seizedAssets The seized assets amount
     * @param repaidShares The repaid shares amount
     * @param data The callback data
     * @return assetsRepaid The assets repaid
     * @return sharesRepaid The shares repaid
     * @return assetsSeized The assets seized
     */
    function liquidate(
        bytes32 id,
        address borrower,
        uint256 seizedAssets,
        uint256 repaidShares,
        bytes calldata data
    ) external returns (uint256 assetsRepaid, uint256 sharesRepaid, uint256 assetsSeized);

    /**
     * @dev Executes a flash loan
     * @param token The token address
     * @param assets The assets amount
     * @param data The callback data
     */
    function flashLoan(address token, uint256 assets, bytes calldata data) external;

    /**
     * @dev Sets authorization for an address
     * @param authorized The authorized address
     * @param newIsAuthorized The new authorization status
     */
    function setAuthorization(address authorized, bool newIsAuthorized) external;

    /**
     * @dev Sets authorization with signature
     * @param authorization The authorization structure
     * @param signature The signature
     */
    function setAuthorizationWithSig(
        Authorization calldata authorization,
        bytes calldata signature
    ) external;

    /**
     * @dev Accrues interest for a market
     * @param id The market id
     */
    function accrueInterest(bytes32 id) external;

    /**
     * @dev Returns the domain separator
     * @return The domain separator
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /**
     * @dev Returns the fee recipient
     * @return The fee recipient address
     */
    function feeRecipient() external view returns (address);

    /**
     * @dev Returns the owner
     * @return The owner address
     */
    function owner() external view returns (address);

    /**
     * @dev Returns the market configuration
     * @param id The market id
     * @return The market configuration
     */
    function idToMarketConfig(bytes32 id) external view returns (MarketConfig memory);

    /**
     * @dev Returns the market state
     * @param id The market id
     * @return The market state
     */
    function market(bytes32 id) external view returns (Market memory);

    /**
     * @dev Returns the position
     * @param id The market id
     * @param user The user address
     * @return The position
     */
    function position(bytes32 id, address user) external view returns (Position memory);

    /**
     * @dev Returns the authorization status
     * @param authorizer The authorizer address
     * @param authorized The authorized address
     * @return The authorization status
     */
    function isAuthorized(address authorizer, address authorized) external view returns (bool);

    /**
     * @dev Returns the nonce
     * @param authorizer The authorizer address
     * @return The nonce
     */
    function nonce(address authorizer) external view returns (uint256);

    /**
     * @dev Returns the expected market id
     * @param marketConfig The market configuration
     * @return The expected market id
     */
    function expectedMarketId(MarketConfig calldata marketConfig) external pure returns (bytes32);

    /**
     * @dev Returns the last update timestamp
     * @param id The market id
     * @return The last update timestamp
     */
    function lastUpdate(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the supply rate
     * @param id The market id
     * @return The supply rate
     */
    function supplyRate(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the borrow rate
     * @param id The market id
     * @return The borrow rate
     */
    function borrowRate(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the fee
     * @param id The market id
     * @return The fee
     */
    function fee(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the utilization rate
     * @param id The market id
     * @return The utilization rate
     */
    function utilization(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the total supply assets
     * @param id The market id
     * @return The total supply assets
     */
    function totalSupplyAssets(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the total supply shares
     * @param id The market id
     * @return The total supply shares
     */
    function totalSupplyShares(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the total borrow assets
     * @param id The market id
     * @return The total borrow assets
     */
    function totalBorrowAssets(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the total borrow shares
     * @param id The market id
     * @return The total borrow shares
     */
    function totalBorrowShares(bytes32 id) external view returns (uint256);

    /**
     * @dev Converts assets to shares
     * @param assets The assets amount
     * @param totalAssets The total assets
     * @param totalShares The total shares
     * @return The shares amount
     */
    function toSharesDown(
        uint256 assets,
        uint256 totalAssets,
        uint256 totalShares
    ) external pure returns (uint256);

    /**
     * @dev Converts assets to shares (rounded up)
     * @param assets The assets amount
     * @param totalAssets The total assets
     * @param totalShares The total shares
     * @return The shares amount
     */
    function toSharesUp(
        uint256 assets,
        uint256 totalAssets,
        uint256 totalShares
    ) external pure returns (uint256);

    /**
     * @dev Converts shares to assets
     * @param shares The shares amount
     * @param totalAssets The total assets
     * @param totalShares The total shares
     * @return The assets amount
     */
    function toAssetsDown(
        uint256 shares,
        uint256 totalAssets,
        uint256 totalShares
    ) external pure returns (uint256);

    /**
     * @dev Converts shares to assets (rounded up)
     * @param shares The shares amount
     * @param totalAssets The total assets
     * @param totalShares The total shares
     * @return The assets amount
     */
    function toAssetsUp(
        uint256 shares,
        uint256 totalAssets,
        uint256 totalShares
    ) external pure returns (uint256);

    /**
     * @dev Returns whether a position is healthy
     * @param id The market id
     * @param user The user address
     * @return Whether the position is healthy
     */
    function isHealthy(bytes32 id, address user) external view returns (bool);

    /**
     * @dev Returns the liquidation incentive factor
     * @param id The market id
     * @return The liquidation incentive factor
     */
    function liquidationIncentiveFactor(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the close factor
     * @param id The market id
     * @return The close factor
     */
    function closeFactor(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the liquidation threshold
     * @param id The market id
     * @return The liquidation threshold
     */
    function lltv(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the oracle address
     * @param id The market id
     * @return The oracle address
     */
    function oracle(bytes32 id) external view returns (address);

    /**
     * @dev Returns the interest rate model
     * @param id The market id
     * @return The interest rate model
     */
    function irm(bytes32 id) external view returns (address);

    /**
     * @dev Returns the underlying asset
     * @param id The market id
     * @return The underlying asset address
     */
    function underlying(bytes32 id) external view returns (address);

    /**
     * @dev Returns the collateral asset
     * @param id The market id
     * @return The collateral asset address
     */
    function collateralToken(bytes32 id) external view returns (address);

    /**
     * @dev Returns the maximum loan-to-value ratio
     * @param id The market id
     * @return The maximum loan-to-value ratio
     */
    function maxLtv(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the health factor
     * @param id The market id
     * @param user The user address
     * @return The health factor
     */
    function healthFactor(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the collateral value
     * @param id The market id
     * @param user The user address
     * @return The collateral value
     */
    function collateralValue(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the borrow value
     * @param id The market id
     * @param user The user address
     * @return The borrow value
     */
    function borrowValue(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the maximum borrowable amount
     * @param id The market id
     * @param user The user address
     * @return The maximum borrowable amount
     */
    function maxBorrow(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the maximum withdrawable amount
     * @param id The market id
     * @param user The user address
     * @return The maximum withdrawable amount
     */
    function maxWithdraw(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the maximum withdrawable collateral amount
     * @param id The market id
     * @param user The user address
     * @return The maximum withdrawable collateral amount
     */
    function maxWithdrawCollateral(bytes32 id, address user) external view returns (uint256);

    /**
     * @dev Returns the price
     * @param id The market id
     * @return The price
     */
    function price(bytes32 id) external view returns (uint256);

    /**
     * @dev Returns the EIP-712 domain
     * @return fields The fields
     * @return name The name
     * @return version The version
     * @return chainId The chain id
     * @return verifyingContract The verifying contract
     * @return salt The salt
     * @return extensions The extensions
     */
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );
}
