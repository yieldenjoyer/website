// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./utils/ProtocolConstants.sol";

/**
 * @title Enhanced PT/YT Loop Strategy - Remix Compatible
 * @notice Simplified version for Remix IDE deployment
 * @dev Implements secure PT/YT yield farming with looping strategy
 */
contract EnhancedPTYTLooperRemix is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                        EVENTS
    // =============================================================
    
    event PositionOpened(
        address indexed user,
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops
    );
    
    event PositionClosed(
        address indexed user,
        uint256 collateralReturned,
        uint256 profitRealized
    );
    
    event EmergencyWithdraw(
        address indexed user,
        address indexed token,
        uint256 amount
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
        uint256 ytAmount;             // Amount of YT tokens held
        uint256 loops;                // Number of loops executed
        uint256 timestamp;            // Position creation time
        bool isActive;                // Position status
    }

    // =============================================================
    //                        STORAGE
    // =============================================================
    
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

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize with default WETH/USDC strategy
        config = StrategyConfig({
            collateralToken: ProtocolConstants.WETH,
            borrowToken: ProtocolConstants.USDC,
            ptToken: address(0), // Will be set later
            ytToken: address(0), // Will be set later
            pendleMarket: address(0), // Will be set later
            maxLeverage: ProtocolConstants.DEFAULT_MAX_LEVERAGE, // 5x max leverage
            minHealthFactor: ProtocolConstants.DEFAULT_MIN_HEALTH_FACTOR, // 1.5x min health factor
            isActive: true
        });
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

    // =============================================================
    //                        MAIN FUNCTIONS
    // =============================================================
    
    /**
     * @notice Open a new looping position
     * @param collateralAmount Amount of collateral to deposit
     * @param borrowAmount Amount to borrow for first loop
     * @param loops Number of loops to execute
     */
    function openPosition(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops
    ) external nonReentrant whenNotPaused onlyActiveStrategy onlyNoPosition(msg.sender) {
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(collateralAmount != 0, "Invalid collateral amount");
        require(borrowAmount != 0, "Invalid borrow amount");
        require(loops != 0 && loops <= ProtocolConstants.MAX_LOOPS, "Invalid loop count");
        
        // Transfer collateral from user (handle fee-on-transfer tokens)
        IERC20 collateralToken = IERC20(config.collateralToken);
        uint256 balanceBefore = collateralToken.balanceOf(address(this));
        
        collateralToken.safeTransferFrom(
            msg.sender,
            address(this),
            collateralAmount
        );
        
        // Calculate actual amount received (handles fee-on-transfer tokens)
        uint256 balanceAfter = collateralToken.balanceOf(address(this));
        uint256 actualCollateralReceived = balanceAfter - balanceBefore;
        
        // Use actual received amount for strategy execution
        uint256 totalYtAmount = _executeLoopingStrategy(
            actualCollateralReceived,
            borrowAmount,
            loops
        );
        
        // Create position record with actual received amount
        positions[msg.sender] = Position({
            collateralAmount: actualCollateralReceived,
            borrowAmount: borrowAmount,
            ytAmount: totalYtAmount,
            loops: loops,
            timestamp: block.timestamp,
            isActive: true
        });
        
        // Update tracking with actual received amount
        activeUsers.push(msg.sender);
        totalValueLocked += actualCollateralReceived;
        totalPositions++;
        
        emit PositionOpened(msg.sender, actualCollateralReceived, borrowAmount, loops);
    }
    
    /**
     * @notice Close an existing position
     * @param user Address of the position owner
     */
    function closePosition(address user) 
        external 
        nonReentrant 
        onlyValidPosition(user) 
    {
        require(msg.sender == user || msg.sender == owner(), "Unauthorized");
        
        Position storage position = positions[user];
        
        // Calculate current position value
        uint256 currentValue = _calculatePositionValue(user);
        uint256 profitLoss = currentValue > position.collateralAmount ? 
            currentValue - position.collateralAmount : 0;
        
        // Execute position closing
        uint256 collateralReturned = _closeLoopingPosition(user);
        
        // Update tracking
        if (profitLoss > 0) {
            totalProfit += profitLoss;
            totalProfits[user] += profitLoss;
            successfulPositions++;
        } else {
            totalLoss += position.collateralAmount - currentValue;
        }
        
        totalValueLocked -= position.collateralAmount;
        
        // Clear position
        delete positions[user];
        _removeActiveUser(user);
        
        emit PositionClosed(user, collateralReturned, profitLoss);
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
        
        return (collateralAmount * baseYield * leverageMultiplier) / ProtocolConstants.PERCENTAGE_DENOMINATOR;
    }

    // =============================================================
    //                        INTERNAL FUNCTIONS
    // =============================================================
    
    function _executeLoopingStrategy(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 loops
    ) internal returns (uint256 totalYtAmount) {
        uint256 currentCollateral = collateralAmount;
        totalYtAmount = 0;
        
        for (uint256 i = 0; i < loops; i++) {
            // Step 1: Deposit collateral to Aave
            _depositCollateral(currentCollateral);
            
            // Step 2: Borrow against collateral
            _borrowFromAave(borrowAmount);
            
            // Step 3: Convert borrowed token to PT/YT
            (uint256 ptAmount, uint256 ytAmount) = _mintPTYT(borrowAmount);
            totalYtAmount += ytAmount;
            
            // Step 4: Sell PT tokens for more collateral
            uint256 additionalCollateral = _sellPTTokens(ptAmount);
            
            // Prepare for next loop
            currentCollateral = additionalCollateral;
            borrowAmount = (borrowAmount * 90) / 100; // Reduce borrow amount each loop
        }
    }
    
    function _closeLoopingPosition(address user) internal returns (uint256) {
        Position memory position = positions[user];
        
        // Simplified closing logic - in reality this would:
        // 1. Sell all YT tokens
        // 2. Repay all debt
        // 3. Withdraw collateral
        // 4. Return remaining collateral to user
        
        uint256 totalValue = _calculatePositionValue(user);
        
        // Transfer collateral back to user (handle fee-on-transfer tokens)
        IERC20 collateralToken = IERC20(config.collateralToken);
        uint256 balanceBefore = collateralToken.balanceOf(user);
        
        collateralToken.safeTransfer(user, totalValue);
        
        // Calculate actual amount received by user (handles fee-on-transfer tokens)
        uint256 balanceAfter = collateralToken.balanceOf(user);
        uint256 actualAmountTransferred = balanceAfter - balanceBefore;
        
        return actualAmountTransferred;
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
        // In reality: IAavePool(ProtocolConstants.AAVE_POOL).supply(config.collateralToken, amount, address(this), 0);
    }
    
    function _borrowFromAave(uint256 amount) internal {
        // Placeholder for Aave integration
        // In reality: IAavePool(ProtocolConstants.AAVE_POOL).borrow(config.borrowToken, amount, 2, 0, address(this));
    }
    
    function _mintPTYT(uint256 amount) internal returns (uint256, uint256) {
        // Placeholder for Pendle integration
        // In reality: IPendleRouter(ProtocolConstants.PENDLE_ROUTER).mintPtYt(...)
        return (amount * 95 / 100, amount * 95 / 100);
    }
    
    function _sellPTTokens(uint256 amount) internal returns (uint256) {
        // Placeholder for Uniswap integration
        // In reality: IUniswapRouter(ProtocolConstants.UNISWAP_ROUTER).exactInputSingle(...)
        return amount * 98 / 100; // Assume 2% slippage
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
    
    function updateConfig(StrategyConfig calldata newConfig) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        config = newConfig;
    }
    
    function pauseStrategy() external onlyOwner {
        _pause();
    }
    
    function unpauseStrategy() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        address ownerAddr = owner();
        // Get balance before transfer to handle fee-on-transfer tokens
        uint256 balanceBefore = tokenContract.balanceOf(ownerAddr);
        tokenContract.safeTransfer(ownerAddr, amount);
        // Calculate actual amount received (handles fee-on-transfer tokens)
        uint256 balanceAfter = tokenContract.balanceOf(ownerAddr);
        uint256 actualAmountTransferred = balanceAfter - balanceBefore;
        emit EmergencyWithdraw(msg.sender, token, actualAmountTransferred);
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
        uint256 _successfulPositions
    ) {
        return (
            totalValueLocked,
            totalPositions,
            totalProfit,
            totalLoss,
            successfulPositions
        );
    }
    
    function getUserProfit(address user) external view returns (uint256) {
        return totalProfits[user];
    }
}
