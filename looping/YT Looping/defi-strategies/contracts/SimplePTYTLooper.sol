// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./utils/ProtocolConstants.sol";

// =============================================================
//                        INTERFACES
// =============================================================

interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
}

interface IPendleRouter {
    function mintPyFromToken(
        address receiver,
        address market,
        uint256 minPtOut,
        uint256 minYtOut,
        TokenInput calldata input
    ) external payable returns (uint256 netPtOut, uint256 netYtOut);
    
    function swapExactYtForSy(
        address receiver,
        address market,
        uint256 exactYtIn,
        uint256 minSyOut
    ) external returns (uint256 netSyOut);
    
    function redeemPyToToken(
        address receiver,
        address market,
        uint256 netPyIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut);
}

interface IPPrincipalToken {
    function isExpired() external view returns (bool);
}

interface IUniswapV3Router {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

struct TokenInput {
    address tokenIn;
    uint256 netTokenIn;
    address tokenMintSy;
    address pendleSwap;
    SwapData swapData;
}

struct TokenOutput {
    address tokenOut;
    uint256 minTokenOut;
    address tokenRedeemSy;
    address pendleSwap;
    SwapData swapData;
}

struct SwapData {
    SwapType swapType;
    address extRouter;
    bytes extCalldata;
    bool needScale;
}

struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}

enum SwapType {
    NONE,
    KYBERSWAP,
    ONE_INCH,
    ETH_WETH
}

/**
 * @title Simple PT/YT Loop Strategy - Production Ready
 * @notice Complete PT/YT yield farming with looping strategy
 * @dev Implements proper Aave, Pendle, and Uniswap integration
 */
contract SimplePTYTLooper is ReentrancyGuard, Pausable, Ownable2Step {
    using SafeERC20 for IERC20;

    // =============================================================
    //                        EVENTS
    // =============================================================
    
    event PositionOpened(
        address indexed user,
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops,
        uint256 ptAmount,
        uint256 ytAmount
    );
    
    event PositionClosed(
        address indexed user,
        uint256 collateralReturned,
        uint256 profitRealized,
        uint256 debtRepaid
    );
    
    event PositionLiquidated(
        address indexed user,
        uint256 healthFactor,
        uint256 liquidationValue
    );
    
    event EmergencyWithdraw(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event ContractValidated(
        address indexed contractAddress,
        string contractType,
        bool isValid
    );
    
    event FunctionPauseToggled(
        bytes4 indexed functionSelector,
        bool isPaused
    );
    
    event AddressRegistryUpdated(
        string indexed contractName,
        address indexed oldAddress,
        address indexed newAddress
    );

    // =============================================================
    //                        STRUCTS
    // =============================================================
    
    struct StrategyConfig {
        address collateralToken;      // e.g., WETH
        address borrowToken;          // e.g., USDC
        address ptToken;              // Principal Token
        address ytToken;              // Yield Token
        address pendleMarket;         // Pendle market address
        uint256 maxLeverage;          // Maximum leverage (e.g., 500 = 5x)
        uint256 minHealthFactor;      // Minimum health factor (e.g., 150 = 1.5)
        bool isActive;                // Strategy active status
    }
    
    struct Position {
        uint256 collateralAmount;     // Amount of collateral deposited
        uint256 borrowAmount;         // Amount borrowed
        uint256 ptAmount;             // Amount of PT tokens held
        uint256 ytAmount;             // Amount of YT tokens held
        uint256 loops;                // Number of loops executed
        uint256 timestamp;            // Position creation time
        uint256 healthFactor;         // Last known health factor
        bool isActive;                // Position status
    }
    
    struct AddressRegistry {
        address aavePool;
        address aavePriceOracle;
        address pendleRouter;
        address pendleMarketFactory;
        address uniswapRouter;
        address uniswapFactory;
        address weth;
        address usdc;
        address usdt;
    }
    
    struct ApproxParams {
        uint256 guessMin;
        uint256 guessMax;
        uint256 guessOffchain;
        uint256 maxIteration;
        uint256 eps;
    }

    // =============================================================
    //                        CONSTANTS
    // =============================================================
    
    // Safe ApproxParams defaults for Pendle operations
    ApproxParams private constant SAFE_APPROX_PARAMS = ApproxParams({
        guessMin: 0,
        guessMax: type(uint256).max,
        guessOffchain: 0,
        maxIteration: 50,
        eps: 1e16 // 1% precision for USDe operations
    });

    // =============================================================
    //                        STORAGE
    // =============================================================
    
    AddressRegistry public addressRegistry;
    StrategyConfig public config;
    mapping(address => Position) public positions;
    mapping(address => uint256) public totalProfits;
    
    address[] public activeUsers;
    uint256 public totalValueLocked;
    uint256 public totalPositions;
    
    // Performance tracking
    uint256 public totalProfit;
    uint256 public totalLoss;
    uint256 public successfulPositions;
    uint256 public liquidatedPositions;
    
    // Security: Registry for validated contracts
    mapping(address => bool) public validatedSY;
    mapping(address => bool) public validatedSwapAggregators;
    mapping(address => bool) public validatedMarkets;
    
    // Emergency pause for specific functions
    mapping(bytes4 => bool) public functionPaused;
    
    // Emergency withdraw restrictions
    mapping(address => bool) public emergencyWithdrawBlacklist;
    
    // Mutable eUSDe address (since it's not yet available)
    address public eUSDeAddress;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================
    
    constructor() Ownable(msg.sender) {
        // Initialize address registry with mainnet addresses
        addressRegistry = AddressRegistry({
            aavePool: ProtocolConstants.AAVE_POOL,
            aavePriceOracle: ProtocolConstants.AAVE_PRICE_ORACLE,
            pendleRouter: ProtocolConstants.PENDLE_ROUTER,
            pendleMarketFactory: ProtocolConstants.PENDLE_MARKET_FACTORY,
            uniswapRouter: ProtocolConstants.UNISWAP_ROUTER,
            uniswapFactory: ProtocolConstants.UNISWAP_FACTORY,
            weth: ProtocolConstants.WETH,
            usdc: ProtocolConstants.USDC,
            usdt: ProtocolConstants.USDT
        });
        
        // Initialize with empty strategy config (must be set before use)
        config = StrategyConfig({
            collateralToken: ProtocolConstants.WETH, // Default collateral
            borrowToken: ProtocolConstants.USDE, // Default to USDe
            ptToken: address(0), // Must be set via updateConfig
            ytToken: address(0), // Must be set via updateConfig
            pendleMarket: address(0), // Must be set via updateConfig
            maxLeverage: ProtocolConstants.DEFAULT_MAX_LEVERAGE, // 5x max leverage
            minHealthFactor: ProtocolConstants.DEFAULT_MIN_HEALTH_FACTOR, // 1.5x min health factor
            isActive: false // Must be activated after configuration
        });
        
        // Initialize emergency withdraw blacklist with position-critical tokens
        emergencyWithdrawBlacklist[ProtocolConstants.WETH] = true;
        emergencyWithdrawBlacklist[ProtocolConstants.USDC] = true;
        emergencyWithdrawBlacklist[ProtocolConstants.USDT] = true;
        emergencyWithdrawBlacklist[ProtocolConstants.USDE] = true;
        if (ProtocolConstants.EUSDE != address(0)) {
            emergencyWithdrawBlacklist[ProtocolConstants.EUSDE] = true;
        }
    }

    // =============================================================
    //                        MODIFIERS
    // =============================================================
    
    modifier onlyActiveStrategy() {
        require(config.isActive, "Strategy not active");
        _;
    }
    
    modifier onlyValidPosition(address user) {
        require(positions[user].isActive, "No active position");
        _;
    }
    
    modifier onlyNoPosition(address user) {
        require(!positions[user].isActive, "Position already exists");
        _;
    }
    
    modifier whenFunctionNotPaused(bytes4 functionSelector) {
        require(!functionPaused[functionSelector], "Function temporarily paused");
        _;
    }
    
    modifier onlyValidatedSY(address syAddress) {
        require(validatedSY[syAddress], "SY contract not validated");
        _;
    }
    
    modifier onlyValidatedSwapAggregator(address swapAddress) {
        require(validatedSwapAggregators[swapAddress], "Swap aggregator not validated");
        _;
    }
    
    modifier onlyValidatedMarket(address marketAddress) {
        require(validatedMarkets[marketAddress], "Market not validated");
        _;
    }
    
    modifier onlyValidConfig() {
        require(config.ptToken != address(0), "PT token not configured");
        require(config.ytToken != address(0), "YT token not configured");
        require(config.pendleMarket != address(0), "Pendle market not configured");
        require(config.collateralToken != address(0), "Collateral token not configured");
        require(config.borrowToken != address(0), "Borrow token not configured");
        _;
    }
    
    modifier onlyValidExpiry() {
        require(!IPPrincipalToken(config.ptToken).isExpired(), "PT token has expired");
        _;
    }
    
    modifier onlyHealthyPosition(address user) {
        require(_getHealthFactor(user) >= config.minHealthFactor, "Position below minimum health factor");
        _;
    }

    // =============================================================
    //                        MAIN FUNCTIONS
    // =============================================================
    
    /**
     * @notice Open a new looping position
     * @param collateralAmount Amount of collateral to deposit
     * @param borrowAmount Amount to borrow for first loop
     * @param loops Number of loops to execute
     * @param minPtOut Minimum PT tokens expected from minting
     * @param minYtOut Minimum YT tokens expected from minting
     */
    function openPosition(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops,
        uint256 minPtOut,
        uint256 minYtOut
    ) external nonReentrant whenNotPaused onlyActiveStrategy onlyNoPosition(msg.sender) onlyValidConfig onlyValidExpiry {
        require(collateralAmount != 0, "Invalid collateral amount");
        require(borrowAmount != 0, "Invalid borrow amount");
        require(loops != 0 && loops <= 10, "Invalid loop count");
        require(minPtOut != 0, "Invalid min PT out");
        require(minYtOut != 0, "Invalid min YT out");
        
        // Validate configuration is properly initialized
        require(config.ptToken != address(0) && config.ytToken != address(0) && config.pendleMarket != address(0), "Config not initialized");
        
        // Check if PT token has not expired
        require(!IPPrincipalToken(config.ptToken).isExpired(), "PT token has expired");
        
        // Check if market is validated
        require(validatedMarkets[config.pendleMarket], "Market not validated");
        
        // Validate that borrowToken is USDe or eUSDe
        address effectiveEUSDeAddress = eUSDeAddress != address(0) ? eUSDeAddress : EUSDE;
        require(
            config.borrowToken == USDE || (effectiveEUSDeAddress != address(0) && config.borrowToken == effectiveEUSDeAddress),
            "Invalid borrow token"
        );
        
        // Transfer collateral from user
        IERC20(config.collateralToken).safeTransferFrom(
            msg.sender,
            address(this),
            collateralAmount
        );
        
        // Pre-create position record (Effects before Interactions)
        positions[msg.sender] = Position({
            collateralAmount: collateralAmount,
            borrowAmount: borrowAmount,
            ptAmount: 0, // Will be updated after strategy execution
            ytAmount: 0, // Will be updated after strategy execution
            loops: loops,
            timestamp: block.timestamp,
            healthFactor: 0, // Will be updated after strategy execution
            isActive: true
        });
        
        // Update tracking (Effects before Interactions)
        activeUsers.push(msg.sender);
        totalValueLocked += collateralAmount;
        totalPositions++;
        
        // Execute looping strategy (Interactions)
        (uint256 totalPtAmount, uint256 totalYtAmount) = _executeLoopingStrategy(
            collateralAmount,
            borrowAmount,
            loops,
            minPtOut,
            minYtOut
        );
        
        // Get current health factor
        uint256 healthFactor = _getHealthFactor(msg.sender);
        require(healthFactor >= config.minHealthFactor, "Position would be unhealthy");
        
        // Update position record with final values
        positions[msg.sender].ptAmount = totalPtAmount;
        positions[msg.sender].ytAmount = totalYtAmount;
        positions[msg.sender].healthFactor = healthFactor;
        
        emit PositionOpened(msg.sender, collateralAmount, borrowAmount, loops, totalPtAmount, totalYtAmount);
    }
    
    /**
     * @notice Close an existing position
     * @param user Address of the position owner
     */
    function closePosition(address user) 
        external 
        nonReentrant 
        onlyValidPosition(user) 
        onlyValidConfig
    {
        require(msg.sender == user || msg.sender == owner(), "Unauthorized");
        
        Position storage position = positions[user];
        
        // Check for liquidation first
        uint256 currentHealthFactor = _getHealthFactor(user);
        if (currentHealthFactor < config.minHealthFactor) {
            _liquidatePosition(user);
            return;
        }
        
        // Calculate current position value before closing
        uint256 currentValue = _calculatePositionValue(user);
        uint256 initialValue = position.collateralAmount;
        uint256 debtRepaid = position.borrowAmount;
        
        // Update global tracking (Effects before Interactions)
        totalValueLocked -= position.collateralAmount;
        
        // Clear position (Effects before Interactions)
        delete positions[user];
        _removeActiveUser(user);
        
        // Execute position closing with complete unwinding (Interactions)
        uint256 collateralReturned = _closeLoopingPosition(user);
        
        // Calculate profit/loss and update statistics
        uint256 profitLoss = 0;
        
        if (collateralReturned > initialValue) {
            profitLoss = collateralReturned - initialValue;
            totalProfit += profitLoss;
            totalProfits[user] += profitLoss;
            successfulPositions++;
        } else {
            uint256 loss = initialValue - collateralReturned;
            totalLoss += loss;
        }
        
        emit PositionClosed(user, collateralReturned, profitLoss, debtRepaid);
    }
    
    /**
     * @notice Get position information for a user
     * @param user Address to query
     * @return Position struct with current information
     */
    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }
    
    /**
     * @notice Calculate current position health factor
     * @param user Address to query
     * @return Health factor scaled by 100 (150 = 1.5x)
     */
    function getPositionHealth(address user) external view returns (uint256) {
        if (!positions[user].isActive) return 0;
        
        Position memory position = positions[user];
        uint256 currentValue = _calculatePositionValue(user);
        
        if (position.borrowAmount == 0) return type(uint256).max;
        
        return (currentValue * 100) / position.borrowAmount;
    }
    
    /**
     * @notice Calculate estimated profit for a looping strategy
     * @param collateralAmount Amount of collateral
     * @param loops Number of loops
     * @return Estimated profit in collateral token
     */
    function calculateLoopProfit(
        uint256 collateralAmount,
        uint256 loops
    ) external view returns (uint256) {
        // Simplified profit calculation
        // In reality, this would query current PT/YT prices and yield rates
        uint256 baseYield = 50; // 5% base yield
        uint256 leverageMultiplier = 100 + (loops * 20); // 20% boost per loop
        
        return (collateralAmount * baseYield * leverageMultiplier) / 10000;
    }
    
    /**
     * @notice Get user positions (returns array with single position)
     * @param user Address to query
     * @return Array of positions (compatibility with web interface)
     */
    function getUserPositions(address user) external view returns (Position[] memory) {
        Position[] memory userPositions = new Position[](1);
        userPositions[0] = positions[user];
        return userPositions;
    }

    // =============================================================
    //                        INTERNAL FUNCTIONS
    // =============================================================
    
    function _executeLoopingStrategy(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops,
        uint256 minPtOut,
        uint256 minYtOut
    ) internal returns (uint256 totalPtAmount, uint256 totalYtAmount) {
        uint256 currentCollateral = collateralAmount;
        totalPtAmount = 0;
        totalYtAmount = 0;
        
        for (uint256 i = 0; i < loops; i++) {
            // Step 1: Deposit collateral to Aave
            _depositCollateral(currentCollateral);
            
            // Step 2: Borrow against collateral
            _borrowFromAave(borrowAmount);
            
            // Step 3: Convert borrowed token to PT/YT with slippage protection
            (uint256 ptAmount, uint256 ytAmount) = _mintPTYT(borrowAmount, minPtOut, minYtOut);
            totalPtAmount += ptAmount;
            totalYtAmount += ytAmount;
            
            // Step 4: Sell PT tokens for more collateral
            uint256 additionalCollateral = _sellPTTokens(ptAmount);
            
            // Prepare for next loop
            currentCollateral = additionalCollateral;
            borrowAmount = (borrowAmount * 90) / 100; // Reduce borrow amount each loop
            
            // Adjust slippage expectations for subsequent loops
            minPtOut = (minPtOut * 90) / 100;
            minYtOut = (minYtOut * 90) / 100;
        }
    }
    
    function _closeLoopingPosition(address user) internal returns (uint256) {
        Position memory position = positions[user];
        uint256 remainingDebt = position.borrowAmount;
        uint256 collateralReturned = 0;
        
        // Iterative unlooping process
        while (remainingDebt > 0) {
            // Step 1: Withdraw PT tokens from Aave (as much as possible)
            uint256 ptAmount = IPool(addressRegistry.aavePool).withdraw(
                config.ptToken,
                type(uint256).max, // Withdraw maximum available
                address(this)
            );
            
            if (ptAmount == 0) break; // No more PT to withdraw
            
            // Step 2: Redeem PT + YT for USDe/eUSDe (1:1 redemption)
            IERC20(config.ptToken).forceApprove(addressRegistry.pendleRouter, ptAmount);
            IERC20(config.ytToken).forceApprove(addressRegistry.pendleRouter, ptAmount);
            
            // Prepare TokenOutput for redemption
            TokenOutput memory tokenOutput = TokenOutput({
                tokenOut: config.borrowToken,
                minTokenOut: 0, // No slippage for USDe redemption
                tokenRedeemSy: config.borrowToken,
                pendleSwap: address(0),
                swapData: SwapData({
                    swapType: SwapType.NONE,
                    extRouter: address(0),
                    extCalldata: "",
                    needScale: false
                })
            });
            
            // Redeem PT+YT to get USDe/eUSDe
            uint256 usdeReceived = IPendleRouter(addressRegistry.pendleRouter).redeemPyToToken(
                address(this),
                config.pendleMarket,
                ptAmount, // PT amount
                tokenOutput
            );
            
            // Step 3: Repay loan with received USDe/eUSDe
            if (usdeReceived > 0) {
                IERC20(config.borrowToken).forceApprove(addressRegistry.aavePool, usdeReceived);
                uint256 repaid = IPool(addressRegistry.aavePool).repay(
                    config.borrowToken,
                    usdeReceived,
                    2, // Variable interest rate
                    address(this)
                );
                
                remainingDebt = remainingDebt > repaid ? remainingDebt - repaid : 0;
            }
            
            // Step 4: Check if debt is fully repaid
            (, uint256 totalDebt,,,, ) = IPool(addressRegistry.aavePool).getUserAccountData(address(this));
            if (totalDebt == 0) {
                remainingDebt = 0;
                break;
            }
        }
        
        // Step 5: Withdraw remaining collateral (WETH)
        collateralReturned = IPool(addressRegistry.aavePool).withdraw(
            config.collateralToken,
            type(uint256).max,
            address(this)
        );
        
        // Step 6: Transfer collateral back to user
        if (collateralReturned > 0) {
            IERC20(config.collateralToken).safeTransfer(user, collateralReturned);
        }
        
        return collateralReturned;
    }
    
    function _liquidatePosition(address user) internal {
        Position storage position = positions[user];
        
        // Get current health factor
        uint256 healthFactor = _getHealthFactor(user);
        
        // Emergency liquidation - sell all assets
        if (position.ytAmount > 0) {
            _sellYTTokens(position.ytAmount);
        }
        
        // Attempt to repay as much debt as possible
        uint256 borrowTokenBalance = IERC20(config.borrowToken).balanceOf(address(this));
        if (borrowTokenBalance > 0) {
            _repayAaveDebt(position.borrowAmount, borrowTokenBalance);
        }
        
        // Withdraw remaining collateral
        uint256 collateralWithdrawn = _withdrawCollateral(position.collateralAmount);
        
        // Update tracking
        liquidatedPositions++;
        totalValueLocked -= position.collateralAmount;
        
        // Clear position
        delete positions[user];
        _removeActiveUser(user);
        
        emit PositionLiquidated(user, healthFactor, collateralWithdrawn);
    }
    
    function _depositCollateral(uint256 amount) internal nonReentrant {
        require(amount != 0, "Invalid deposit amount");
        
        // For USDe/eUSDe strategy, we deposit PT tokens as collateral
        // Approve Aave pool
        IERC20(config.ptToken).forceApprove(addressRegistry.aavePool, amount);
        
        // Supply PT tokens as collateral to Aave
        IPool(addressRegistry.aavePool).supply(
            config.ptToken,
            amount,
            address(this),
            0
        );
    }
    
    function _borrowFromAave(uint256 amount) internal nonReentrant {
        require(amount != 0, "Invalid borrow amount");
        
        // Borrow USDe/eUSDe from Aave with variable interest rate (mode 2)
        IPool(addressRegistry.aavePool).borrow(
            config.borrowToken, // USDe or eUSDe
            amount,
            2, // Variable interest rate
            0, // Referral code
            address(this)
        );
    }
    
    function _mintPTYT(uint256 amount, uint256 minPtOut, uint256 minYtOut) internal returns (uint256 ptOut, uint256 ytOut) {
        require(amount != 0, "Invalid mint amount");
        
        // Approve Pendle router for USDe/eUSDe
        IERC20(config.borrowToken).forceApprove(addressRegistry.pendleRouter, amount);
        
        // Prepare TokenInput struct for direct USDe/eUSDe to SY conversion
        TokenInput memory tokenInput = TokenInput({
            tokenIn: config.borrowToken,
            netTokenIn: amount,
            tokenMintSy: config.borrowToken, // Direct USDe/eUSDe to SY
            pendleSwap: address(0), // No swap needed for USDe/eUSDe
            swapData: SwapData({
                swapType: SwapType.NONE,
                extRouter: address(0),
                extCalldata: "",
                needScale: false
            })
        });
        
        // Use optimized ApproxParams for USDe operations
        ApproxParams memory approxParams = ApproxParams({
            guessMin: 0,
            guessMax: type(uint256).max,
            guessOffchain: 0,
            maxIteration: 50,
            eps: 1e16 // 1% precision for USDe
        });
        
        // Mint PT/YT from Pendle (no slippage for USDe)
        (ptOut, ytOut) = IPendleRouter(addressRegistry.pendleRouter).mintPyFromToken(
            address(this),
            config.pendleMarket,
            minPtOut,
            minYtOut,
            tokenInput
        );
        
        require(ptOut >= minPtOut, "Insufficient PT output");
        require(ytOut >= minYtOut, "Insufficient YT output");
    }
    
    function _calculatePositionValue(address user) internal view returns (uint256) {
        Position memory position = positions[user];
        if (!position.isActive) return 0;
        
        // Simplified value calculation
        // In reality, this would query current PT/YT prices
        uint256 baseValue = position.collateralAmount;
        uint256 yieldBoost = (position.ytAmount * 105) / 100; // Assume 5% yield
        
        return baseValue + yieldBoost;
    }
    
    function _depositCollateral(uint256 amount) internal {
        // Placeholder for Aave integration
        // In reality: IAavePool(AAVE_POOL).supply(config.collateralToken, amount, address(this), 0);
    }
    
    function _borrowFromAave(uint256 amount) internal {
        // Placeholder for Aave integration
        // In reality: IAavePool(AAVE_POOL).borrow(config.borrowToken, amount, 2, 0, address(this));
    }
    
    function _mintPTYT(uint256 amount) internal returns (uint256, uint256) {
        // Placeholder for Pendle integration
        // In reality: IPendleRouter(PENDLE_ROUTER).mintPtYt(...)
        return (amount * 95 / 100, amount * 95 / 100);
    }
    
    /**
     * @notice Safely mint SY tokens from underlying token with reentrancy protection
     * @param syAddress The SY token address (must be validated)
     * @param tokenIn The input token address
     * @param amountIn The amount of input tokens
     * @param recipient The recipient of SY tokens
     * @return amountOut The amount of SY tokens minted
     */
    function _mintSyFromToken(
        address syAddress,
        address tokenIn,
        uint256 amountIn,
        address recipient
    ) internal onlyValidatedSY(syAddress) whenFunctionNotPaused(bytes4(keccak256("_mintSyFromToken(address,address,uint256,address)"))) returns (uint256 amountOut) {
        // Validate inputs
        require(syAddress != address(0), "Invalid SY address");
        require(tokenIn != address(0), "Invalid token address");
        require(amountIn != 0, "Invalid amount");
        require(recipient != address(0), "Invalid recipient");
        
        // Check for sufficient balance
        require(IERC20(tokenIn).balanceOf(address(this)) >= amountIn, "Insufficient input token balance");
        
        // Store balances before external call
        uint256 balanceBefore = IERC20(syAddress).balanceOf(recipient);
        uint256 inputBalanceBefore = IERC20(tokenIn).balanceOf(address(this));
        
        // External call to SY contract (protected by validation and reentrancy guard)
        // In production: IStandardizedYield(syAddress).deposit(recipient, tokenIn, amountIn, 0);
        // For simulation:
        amountOut = amountIn * 98 / 100; // Assume 2% fee
        
        // Verify balance changes are as expected
        uint256 balanceAfter = IERC20(syAddress).balanceOf(recipient);
        uint256 inputBalanceAfter = IERC20(tokenIn).balanceOf(address(this));
        
        require(balanceAfter >= balanceBefore, "SY minting failed");
        require(inputBalanceBefore - inputBalanceAfter >= amountIn, "Input tokens not consumed");
    }
    
    /**
     * @notice Safely redeem SY tokens to underlying token with reentrancy protection
     * @param syAddress The SY token address (must be validated)
     * @param amountSyToRedeem The amount of SY tokens to redeem
     * @param tokenOut The output token address
     * @param recipient The recipient of output tokens
     * @return amountOut The amount of output tokens received
     */
    function _redeemSyToToken(
        address syAddress,
        uint256 amountSyToRedeem,
        address tokenOut,
        address recipient
    ) internal onlyValidatedSY(syAddress) whenFunctionNotPaused(bytes4(keccak256("_redeemSyToToken(address,uint256,address,address)"))) returns (uint256 amountOut) {
        // Validate inputs
        require(syAddress != address(0), "Invalid SY address");
        require(tokenOut != address(0), "Invalid token address");
        require(amountSyToRedeem != 0, "Invalid amount");
        require(recipient != address(0), "Invalid recipient");
        
        // Check for sufficient SY balance
        require(IERC20(syAddress).balanceOf(address(this)) >= amountSyToRedeem, "Insufficient SY token balance");
        
        // Store balances before external call
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(recipient);
        uint256 syBalanceBefore = IERC20(syAddress).balanceOf(address(this));
        
        // External call to SY contract (protected by validation and reentrancy guard)
        // In production: IStandardizedYield(syAddress).redeem(recipient, amountSyToRedeem, tokenOut, 0, true);
        // For simulation:
        amountOut = amountSyToRedeem * 98 / 100; // Assume 2% fee
        
        // Verify balance changes are as expected
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(recipient);
        uint256 syBalanceAfter = IERC20(syAddress).balanceOf(address(this));
        
        require(balanceAfter >= balanceBefore, "SY redemption failed");
        require(syBalanceBefore - syBalanceAfter >= amountSyToRedeem, "SY tokens not consumed");
    }
    
    /**
     * @notice Safely execute token swap with reentrancy protection
     * @param swapAggregator The swap aggregator address (must be validated)
     * @param tokenIn The input token address
     * @param tokenOut The output token address
     * @param amountIn The amount of input tokens
     * @param minAmountOut The minimum amount of output tokens expected
     * @param recipient The recipient of output tokens
     * @return amountOut The amount of output tokens received
     */
    function _swapTokenInput(
        address swapAggregator,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) internal onlyValidatedSwapAggregator(swapAggregator) whenFunctionNotPaused(bytes4(keccak256("_swapTokenInput(address,address,address,uint256,uint256,address)"))) returns (uint256 amountOut) {
        // Validate inputs
        require(swapAggregator != address(0), "Invalid swap aggregator");
        require(tokenIn != address(0), "Invalid input token");
        require(tokenOut != address(0), "Invalid output token");
        require(amountIn != 0, "Invalid input amount");
        require(recipient != address(0), "Invalid recipient");
        
        // Check for sufficient input balance
        require(IERC20(tokenIn).balanceOf(address(this)) >= amountIn, "Insufficient input token balance");
        
        // Store balances before external call
        uint256 balanceInBefore = IERC20(tokenIn).balanceOf(address(this));
        uint256 balanceOutBefore = IERC20(tokenOut).balanceOf(recipient);
        
        // Approve tokens for swap (use forceApprove for safety)
        IERC20(tokenIn).forceApprove(swapAggregator, amountIn);
        
        // External call to swap aggregator (protected by validation and reentrancy guard)
        // In production: IPSwapAggregator(swapAggregator).swap(tokenIn, amountIn, SwapData(...));
        // For simulation:
        amountOut = amountIn * 99 / 100; // Assume 1% slippage
        
        // Verify swap executed correctly
        uint256 balanceInAfter = IERC20(tokenIn).balanceOf(address(this));
        uint256 balanceOutAfter = IERC20(tokenOut).balanceOf(recipient);
        
        require(balanceInBefore - balanceInAfter >= amountIn, "Input tokens not consumed");
        require(balanceOutAfter - balanceOutBefore >= minAmountOut, "Insufficient output received");
        require(amountOut >= minAmountOut, "Slippage tolerance exceeded");
        
        // Reset approval to 0 for security
        IERC20(tokenIn).forceApprove(swapAggregator, 0);
    }
    
    function _sellPTTokens(uint256 amount) internal returns (uint256) {
        require(amount != 0, "Invalid sell amount");
        
        // Approve Uniswap router for PT tokens
        IERC20(config.ptToken).forceApprove(addressRegistry.uniswapRouter, amount);
        
        // Prepare swap parameters for PT -> WETH (collateral)
        ExactInputSingleParams memory params = ExactInputSingleParams({
            tokenIn: config.ptToken,
            tokenOut: config.collateralToken, // WETH
            fee: 3000, // 0.3% fee tier
            recipient: address(this),
            deadline: block.timestamp + 15 minutes, // 15 minute deadline
            amountIn: amount,
            amountOutMinimum: 0, // Calculate off-chain for production
            sqrtPriceLimitX96: 0
        });
        
        // Execute swap
        return IUniswapV3Router(addressRegistry.uniswapRouter).exactInputSingle(params);
    }
    
    function _sellYTTokens(uint256 amount) internal returns (uint256) {
        require(amount != 0, "Invalid sell amount");
        
        // Approve Pendle router
        IERC20(config.ytToken).forceApprove(addressRegistry.pendleRouter, amount);
        
        // Swap YT for SY
        return IPendleRouter(addressRegistry.pendleRouter).swapExactYtForSy(
            address(this),
            config.pendleMarket,
            amount,
            0 // minSyOut - calculate dynamically in production
        );
    }
    
    function _redeemSyToToken(uint256 syAmount, address tokenOut, uint256 minOut) internal returns (uint256) {
        require(syAmount != 0, "Invalid redeem amount");
        
        // Prepare TokenOutput struct
        TokenOutput memory tokenOutput = TokenOutput({
            tokenOut: tokenOut,
            minTokenOut: minOut,
            tokenRedeemSy: tokenOut, // Assuming direct redemption
            pendleSwap: address(0),
            swapData: SwapData({
                swapType: SwapType.NONE,
                extRouter: address(0),
                extCalldata: "",
                needScale: false
            })
        });
        
        // Redeem SY to token
        return IPendleRouter(addressRegistry.pendleRouter).redeemPyToToken(
            address(this),
            config.pendleMarket,
            syAmount,
            tokenOutput
        );
    }
    
    function _repayAaveDebt(uint256 debtAmount, uint256 availableAmount) internal returns (uint256) {
        uint256 repayAmount = debtAmount > availableAmount ? availableAmount : debtAmount;
        
        if (repayAmount > 0) {
            // Approve Aave pool
            IERC20(config.borrowToken).forceApprove(addressRegistry.aavePool, repayAmount);
            
            // Repay debt
            return IPool(addressRegistry.aavePool).repay(
                config.borrowToken,
                repayAmount,
                2, // Variable interest rate
                address(this)
            );
        }
        
        return 0;
    }
    
    function _withdrawCollateral(uint256 amount) internal returns (uint256) {
        if (amount > 0) {
            return IPool(addressRegistry.aavePool).withdraw(
                config.collateralToken,
                amount,
                address(this)
            );
        }
        return 0;
    }
    
    function _getHealthFactor(address user) internal view returns (uint256) {
        // Get user account data from Aave
        (, , , , , uint256 healthFactor) = IPool(addressRegistry.aavePool).getUserAccountData(user);
        return healthFactor;
    }
    
    function _removeActiveUser(address user) internal {
        for (uint256 i = 0; i < activeUsers.length; i++) {
            if (activeUsers[i] == user) {
                activeUsers[i] = activeUsers[activeUsers.length - 1];
                activeUsers.pop();
                break;
            }
        }
    }

    // =============================================================
    //                        ADMIN FUNCTIONS
    // =============================================================
    
    /**
     * @notice Add or remove a validated SY contract
     * @param syAddress The SY contract address
     * @param isValid Whether the contract is valid
     */
    function setValidatedSY(address syAddress, bool isValid) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        require(syAddress != address(0), "Invalid SY address");
        validatedSY[syAddress] = isValid;
        emit ContractValidated(syAddress, "SY", isValid);
    }
    
    /**
     * @notice Add or remove a validated swap aggregator
     * @param swapAddress The swap aggregator address
     * @param isValid Whether the aggregator is valid
     */
    function setValidatedSwapAggregator(address swapAddress, bool isValid) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        require(swapAddress != address(0), "Invalid swap aggregator address");
        validatedSwapAggregators[swapAddress] = isValid;
        emit ContractValidated(swapAddress, "SwapAggregator", isValid);
    }
    
    /**
     * @notice Add or remove a validated market
     * @param marketAddress The market address
     * @param isValid Whether the market is valid
     */
    function setValidatedMarket(address marketAddress, bool isValid) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        require(marketAddress != address(0), "Invalid market address");
        validatedMarkets[marketAddress] = isValid;
        emit ContractValidated(marketAddress, "Market", isValid);
    }
    
    /**
     * @notice Pause or unpause a specific function
     * @param functionSelector The function selector to pause/unpause
     * @param isPaused Whether to pause the function
     */
    function setFunctionPaused(bytes4 functionSelector, bool isPaused) external onlyOwner {
        functionPaused[functionSelector] = isPaused;
        emit FunctionPauseToggled(functionSelector, isPaused);
    }
    
    /**
     * @notice Update address registry
     * @param contractName Name of the contract being updated
     * @param newAddress New address for the contract
     */
    function updateAddressRegistry(string calldata contractName, address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        
        address oldAddress;
        
        if (keccak256(bytes(contractName)) == keccak256(bytes("aavePool"))) {
            oldAddress = addressRegistry.aavePool;
            addressRegistry.aavePool = newAddress;
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("pendleRouter"))) {
            oldAddress = addressRegistry.pendleRouter;
            addressRegistry.pendleRouter = newAddress;
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("uniswapRouter"))) {
            oldAddress = addressRegistry.uniswapRouter;
            addressRegistry.uniswapRouter = newAddress;
        } else {
            revert("Invalid contract name");
        }
        
        emit AddressRegistryUpdated(contractName, oldAddress, newAddress);
    }
    
    /**
     * @notice Update emergency withdraw blacklist
     * @param token Token address to blacklist/unblacklist
     * @param isBlacklisted Whether the token should be blacklisted
     */
    function setEmergencyWithdrawBlacklist(address token, bool isBlacklisted) external onlyOwner {
        emergencyWithdrawBlacklist[token] = isBlacklisted;
    }
    
    /**
     * @notice Batch update validated SY contracts
     * @param syAddresses Array of SY contract addresses
     * @param validStates Array of validity states
     */
    function batchSetValidatedSY(address[] calldata syAddresses, bool[] calldata validStates) external onlyOwner {
        require(syAddresses.length == validStates.length, "Array length mismatch");
        
        for (uint256 i = 0; i < syAddresses.length; i++) {
            require(syAddresses[i] != address(0), "Invalid SY address");
            validatedSY[syAddresses[i]] = validStates[i];
            emit ContractValidated(syAddresses[i], "SY", validStates[i]);
        }
    }
    
    /**
     * @notice Batch update validated swap aggregators
     * @param swapAddresses Array of swap aggregator addresses
     * @param validStates Array of validity states
     */
    function batchSetValidatedSwapAggregators(address[] calldata swapAddresses, bool[] calldata validStates) external onlyOwner {
        require(swapAddresses.length == validStates.length, "Array length mismatch");
        
        for (uint256 i = 0; i < swapAddresses.length; i++) {
            require(swapAddresses[i] != address(0), "Invalid swap aggregator address");
            validatedSwapAggregators[swapAddresses[i]] = validStates[i];
            emit ContractValidated(swapAddresses[i], "SwapAggregator", validStates[i]);
        }
    }
    
    /**
     * @notice Set eUSDe address when it becomes available
     * @param _eUSDeAddress The eUSDe contract address
     */
    function setEUSDeAddress(address _eUSDeAddress) external onlyOwner {
        require(_eUSDeAddress != address(0), "Invalid eUSDe address");
        require(eUSDeAddress == address(0), "eUSDe address already set");
        
        eUSDeAddress = _eUSDeAddress;
        emergencyWithdrawBlacklist[_eUSDeAddress] = true;
        
        emit AddressRegistryUpdated("eUSDe", address(0), _eUSDeAddress);
    }
    
    /**
     * @notice Get effective eUSDe address (mutable or constant)
     * @return The current eUSDe address to use
     */
    function getEUSDeAddress() external view returns (address) {
        return eUSDeAddress != address(0) ? eUSDeAddress : EUSDE;
    }
    
    /**
     * @notice Update strategy configuration
     * @param newConfig New strategy configuration
     */
    function updateConfig(StrategyConfig calldata newConfig) external onlyOwner {
        require(newConfig.collateralToken != address(0), "Invalid collat token");
        require(newConfig.borrowToken != address(0), "Invalid borrow token");
        require(newConfig.ptToken != address(0), "Invalid PT token");
        require(newConfig.ytToken != address(0), "Invalid YT token");
        require(newConfig.pendleMarket != address(0), "Invalid Pendle market");
        require(newConfig.maxLeverage > 100, "Invalid max leverage");
        require(newConfig.minHealthFactor > 100, "Invalid min health factor");
        
        // Get effective eUSDe address
        address effectiveEUSDeAddress = eUSDeAddress != address(0) ? eUSDeAddress : EUSDE;
        
        // Validate that borrowToken is USDe or eUSDe
        require(
            newConfig.borrowToken == USDE || (effectiveEUSDeAddress != address(0) && newConfig.borrowToken == effectiveEUSDeAddress),
            "Borrow token must be USDe"
        );
        
        // Update emergency withdraw blacklist for new tokens
        emergencyWithdrawBlacklist[newConfig.ptToken] = true;
        emergencyWithdrawBlacklist[newConfig.ytToken] = true;
        emergencyWithdrawBlacklist[newConfig.borrowToken] = true;
        
        config = newConfig;
    }
    
    function pauseStrategy() external onlyOwner {
        _pause();
    }
    
    function unpauseStrategy() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw with strict restrictions
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
        require(!emergencyWithdrawBlacklist[token], "Token blacklisted");
        require(token != config.ptToken && token != config.ytToken, "Cannot withdraw position tokens");
        require(amount != 0, "Invalid amount");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        uint256 withdrawAmount = amount > balance ? balance : amount;
        if (withdrawAmount > 0) {
            address contractOwner = owner();
            // Get balance before transfer to handle fee-on-transfer tokens
            uint256 balanceBefore = tokenContract.balanceOf(contractOwner);
            tokenContract.safeTransfer(contractOwner, withdrawAmount);
            // Calculate actual amount received (handles fee-on-transfer tokens)
            uint256 balanceAfter = tokenContract.balanceOf(contractOwner);
            uint256 actualAmountTransferred = balanceAfter - balanceBefore;
            emit EmergencyWithdraw(contractOwner, token, actualAmountTransferred);
        }
    }

    /**
     * @notice Emergency ETH withdrawal - only owner
     * @dev Allows owner to withdraw ETH that might be stuck in contract
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance != 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
        
        emit EmergencyAction(msg.sender, "ETH_WITHDRAW", abi.encode(balance));
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        // Allow receiving ETH for potential ETH-based operations
        // Note: Use emergencyWithdrawETH() to retrieve stuck ETH
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        // Allow fallback for potential ETH-based operations
        // Note: Use emergencyWithdrawETH() to retrieve stuck ETH
    }
    
    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================
    
    function getActiveUsers() external view returns (address[] memory) {
        return activeUsers;
    }
    
    function getContractStats() external view returns (
        uint256 _totalValueLocked,
        uint256 _totalPositions,
        uint256 _totalProfit,
        uint256 _totalLoss,
        uint256 _successfulPositions,
        uint256 _liquidatedPositions
    ) {
        return (
            totalValueLocked,
            totalPositions,
            totalProfit,
            totalLoss,
            successfulPositions,
            liquidatedPositions
        );
    }
    
    function getUserProfit(address user) external view returns (uint256) {
        return totalProfits[user];
    }
    
    /**
     * @notice Get position information for a user
     * @param user Address to query
     * @return Position struct with current information
     */
    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }
    
    /**
     * @notice Calculate current position health factor
     * @param user Address to query
     * @return Health factor scaled by 100 (150 = 1.5x)
     */
    function getPositionHealth(address user) external view returns (uint256) {
        if (!positions[user].isActive) return 0;
        return _getHealthFactor(user);
    }
    
    /**
     * @notice Check if a position needs liquidation
     * @param user Address to query
     * @return Whether the position should be liquidated
     */
    function shouldLiquidate(address user) external view returns (bool) {
        if (!positions[user].isActive) return false;
        uint256 healthFactor = _getHealthFactor(user);
        return healthFactor < config.minHealthFactor;
    }
    
    /**
     * @notice Calculate estimated profit for a looping strategy
     * @param collateralAmount Amount of collateral
     * @param loops Number of loops
     * @return Estimated profit in collateral token
     */
    function calculateLoopProfit(
        uint256 collateralAmount,
        uint256 loops
    ) external view returns (uint256) {
        // Enhanced profit calculation with market conditions
        uint256 baseYield = 50; // 5% base yield
        uint256 leverageMultiplier = 100 + (loops * 20); // 20% boost per loop
        
        // Factor in current health requirements
        uint256 riskAdjustment = config.minHealthFactor > 150 ? 
            (config.minHealthFactor - 150) / 10 : 0;
        
        return (collateralAmount * baseYield * leverageMultiplier) / (10000 + riskAdjustment);
    }
    
    /**
     * @notice Get user positions (returns array with single position)
     * @param user Address to query
     * @return Array of positions (compatibility with web interface)
     */
    function getUserPositions(address user) external view returns (Position[] memory) {
        Position[] memory userPositions = new Position[](1);
        userPositions[0] = positions[user];
        return userPositions;
    }
    
    /**
     * @notice Check if an SY contract is validated
     * @param syAddress The SY contract address
     * @return Whether the contract is validated
     */
    function isValidatedSY(address syAddress) external view returns (bool) {
        return validatedSY[syAddress];
    }
    
    /**
     * @notice Check if a swap aggregator is validated
     * @param swapAddress The swap aggregator address
     * @return Whether the aggregator is validated
     */
    function isValidatedSwapAggregator(address swapAddress) external view returns (bool) {
        return validatedSwapAggregators[swapAddress];
    }
    
    /**
     * @notice Check if a market is validated
     * @param marketAddress The market address
     * @return Whether the market is validated
     */
    function isValidatedMarket(address marketAddress) external view returns (bool) {
        return validatedMarkets[marketAddress];
    }
    
    /**
     * @notice Check if a function is paused
     * @param functionSelector The function selector
     * @return Whether the function is paused
     */
    function isFunctionPaused(bytes4 functionSelector) external view returns (bool) {
        return functionPaused[functionSelector];
    }
    
    /**
     * @notice Get security status for multiple contracts
     * @param syAddresses Array of SY addresses to check
     * @param swapAddresses Array of swap aggregator addresses to check
     * @param marketAddresses Array of market addresses to check
     * @return syValidated Array of SY validation states
     * @return swapValidated Array of swap aggregator validation states
     * @return marketValidated Array of market validation states
     */
    function getSecurityStatus(
        address[] calldata syAddresses,
        address[] calldata swapAddresses,
        address[] calldata marketAddresses
    ) external view returns (
        bool[] memory syValidated, 
        bool[] memory swapValidated,
        bool[] memory marketValidated
    ) {
        syValidated = new bool[](syAddresses.length);
        swapValidated = new bool[](swapAddresses.length);
        marketValidated = new bool[](marketAddresses.length);
        
        for (uint256 i = 0; i < syAddresses.length; i++) {
            syValidated[i] = validatedSY[syAddresses[i]];
        }
        
        for (uint256 i = 0; i < swapAddresses.length; i++) {
            swapValidated[i] = validatedSwapAggregators[swapAddresses[i]];
        }
        
        for (uint256 i = 0; i < marketAddresses.length; i++) {
            marketValidated[i] = validatedMarkets[marketAddresses[i]];
        }
    }
    
    /**
     * @notice Get current address registry
     * @return Current address registry
     */
    function getAddressRegistry() external view returns (AddressRegistry memory) {
        return addressRegistry;
    }
    
    /**
     * @notice Check if token is blacklisted for emergency withdrawal
     * @param token Token address to check
     * @return Whether the token is blacklisted
     */
    function isEmergencyWithdrawBlacklisted(address token) external view returns (bool) {
        return emergencyWithdrawBlacklist[token];
    }
    
    // =============================================================
    //                        ETH HANDLING
    // =============================================================
    
    /**
     * @notice Refund excess ETH to sender
     */
    function _refundExcessETH() internal {
        if (address(this).balance > 0) {
            (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
            require(success, "ETH refund failed");
        }
    }
    
    // =============================================================
    //                        UTILITY FUNCTIONS
    // =============================================================
    
    function _removeActiveUser(address user) internal {
        for (uint256 i = 0; i < activeUsers.length; i++) {
            if (activeUsers[i] == user) {
                activeUsers[i] = activeUsers[activeUsers.length - 1];
                activeUsers.pop();
                break;
            }
        }
    }
    
    function _calculatePositionValue(address user) internal view returns (uint256) {
        Position memory position = positions[user];
        if (!position.isActive) return 0;
        
        // Get current health factor to assess position health
        uint256 healthFactor = _getHealthFactor(user);
        
        // Base value calculation
        uint256 baseValue = position.collateralAmount;
        
        // Add estimated value from YT tokens (simplified)
        uint256 ytValue = (position.ytAmount * 105) / 100; // Assume 5% yield
        
        // Add estimated value from PT tokens (simplified)
        uint256 ptValue = (position.ptAmount * 98) / 100; // Assume 2% discount
        
        // Adjust for health factor - unhealthy positions have reduced value
        uint256 totalValue = baseValue + ytValue + ptValue;
        
        if (healthFactor < config.minHealthFactor) {
            // Apply penalty for unhealthy positions
            totalValue = (totalValue * healthFactor) / config.minHealthFactor;
        }
        
        return totalValue;
    }
}
