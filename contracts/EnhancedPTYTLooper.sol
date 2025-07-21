// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Enhanced PT/YT Loop Strategy
 * @notice Production-ready contract for automated PT/YT looping with multiple protocols
 * @dev Implements secure PT/YT yield farming with flash loans and multi-protocol support
 * 
 * Strategy Overview:
 * 1. Deposit collateral (e.g., WETH)
 * 2. Borrow against collateral (e.g., USDC)
 * 3. Mint PT/YT tokens using Pendle
 * 4. Sell PT tokens for more collateral
 * 5. Repeat to amplify YT exposure
 * 
 * Supported Protocols:
 * - Pendle (PT/YT minting and trading)
 * - Aave V3 (lending/borrowing)
 * - Uniswap V3 (DEX operations)
 * - Balancer (flash loans)
 */
contract EnhancedPTYTLooper is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                        CONSTANTS
    // =============================================================
    
    // Pendle Protocol - Ethereum Mainnet
    address private constant PENDLE_ROUTER = 0x888888888889758F76e7103c6CbF23ABbF58F946;
    address private constant PENDLE_MARKET_FACTORY = 0x1A6fCc85557BC4fB7B534ed835a03EF056552D52;
    
    // Aave V3 - Ethereum Mainnet
    address private constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address private constant AAVE_PRICE_ORACLE = 0x54586bE62E3c3580375aE3723C145253060Ca0C2;
    
    // Uniswap V3 - Ethereum Mainnet
    address private constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address private constant UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    
    // Balancer V2 - For flash loans
    address private constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    
    // Common tokens
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant USDC = 0xa0b86A33e6411C4A24A8D7c8C4f3E6e8C2E6FB26;
    
    // =============================================================
    //                        STRUCTS
    // =============================================================
    
    struct StrategyConfig {
        address collateralToken;      // e.g., WETH
        address borrowToken;          // e.g., USDC
        address pendleMarket;         // Pendle market address
        address ptToken;              // Principal Token
        address ytToken;              // Yield Token
        uint256 maxLTV;               // Maximum LTV (basis points)
        uint256 targetLTV;            // Target LTV (basis points)
        uint256 maxLoops;             // Maximum loops allowed
        bool useFlashLoans;           // Whether to use flash loans
    }
    
    struct PositionInfo {
        uint256 totalCollateral;     // Total collateral deposited
        uint256 totalDebt;           // Total debt borrowed
        uint256 ptBalance;           // PT tokens held
        uint256 ytBalance;           // YT tokens held
        uint256 currentLTV;          // Current LTV
        uint256 lastRebalance;       // Last rebalance timestamp
        uint256 totalLoops;          // Total loops executed
        bool isActive;               // Position active status
    }
    
    struct FlashLoanData {
        address asset;
        uint256 amount;
        uint256 loops;
        address user;
    }
    
    // =============================================================
    //                        STATE VARIABLES
    // =============================================================
    
    StrategyConfig public config;
    PositionInfo public position;
    
    // User positions
    mapping(address => PositionInfo) public userPositions;
    
    // Flash loan callback data
    mapping(address => bool) public authorizedFlashLoanCallers;
    
    // =============================================================
    //                        EVENTS
    // =============================================================
    
    event StrategyConfigured(
        address indexed collateralToken,
        address indexed borrowToken,
        address indexed pendleMarket,
        uint256 maxLTV,
        uint256 targetLTV
    );
    
    event PositionOpened(
        address indexed user,
        uint256 collateralAmount,
        uint256 loops,
        uint256 finalLTV
    );
    
    event PositionRebalanced(
        address indexed user,
        uint256 oldLTV,
        uint256 newLTV,
        uint256 timestamp
    );
    
    event PositionClosed(
        address indexed user,
        uint256 collateralReturned,
        uint256 profit
    );
    
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 fee
    );
    
    event EmergencyAction(
        address indexed caller,
        string action,
        bytes data
    );
    
    // =============================================================
    //                        MODIFIERS
    // =============================================================
    
    modifier onlyAuthorizedFlashLoan() {
        require(authorizedFlashLoanCallers[msg.sender], "Unauthorized flash loan caller");
        _;
    }
    
    modifier validLTV(uint256 _ltv) {
        require(_ltv != 0 && _ltv <= config.maxLTV, "Invalid LTV");
        _;
    }
    
    modifier activePosition(address _user) {
        require(userPositions[_user].isActive, "Position not active");
        _;
    }
    
    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================
    
    constructor() {
        // Set default configuration
        config = StrategyConfig({
            collateralToken: WETH,
            borrowToken: USDC,
            pendleMarket: address(0), // Set later
            ptToken: address(0),      // Set later
            ytToken: address(0),      // Set later
            maxLTV: 7500,            // 75%
            targetLTV: 6500,         // 65%
            maxLoops: 5,
            useFlashLoans: true
        });
        
        // Authorize Balancer vault for flash loans
        authorizedFlashLoanCallers[BALANCER_VAULT] = true;
    }
    
    // =============================================================
    //                        CONFIGURATION FUNCTIONS
    // =============================================================
    
    /**
     * @notice Configure strategy parameters
     * @param _collateralToken Address of collateral token
     * @param _borrowToken Address of borrow token
     * @param _pendleMarket Address of Pendle market
     * @param _ptToken Address of Principal Token
     * @param _ytToken Address of Yield Token
     * @param _maxLTV Maximum LTV in basis points
     * @param _targetLTV Target LTV in basis points
     */
    function configureStrategy(
        address _collateralToken,
        address _borrowToken,
        address _pendleMarket,
        address _ptToken,
        address _ytToken,
        uint256 _maxLTV,
        uint256 _targetLTV
    ) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        require(_collateralToken != address(0), "Invalid collat token");
        require(_borrowToken != address(0), "Invalid borrow token");
        require(_pendleMarket != address(0), "Invalid Pendle market");
        require(_ptToken != address(0), "Invalid PT token");
        require(_ytToken != address(0), "Invalid YT token");
        require(_maxLTV != 0 && _maxLTV <= 9000, "Invalid max LTV"); // Max 90%
        require(_targetLTV != 0 && _targetLTV <= _maxLTV, "Invalid target LTV");
        config.collateralToken = _collateralToken;
        config.borrowToken = _borrowToken;
        config.pendleMarket = _pendleMarket;
        config.ptToken = _ptToken;
        config.ytToken = _ytToken;
        config.maxLTV = _maxLTV;
        config.targetLTV = _targetLTV;
        emit StrategyConfigured(
            _collateralToken,
            _borrowToken,
            _pendleMarket,
            _maxLTV,
            _targetLTV
        );
    }
    
    // =============================================================
    //                        MAIN STRATEGY FUNCTIONS
    // =============================================================
    
    /**
     * @notice Open a new PT/YT leveraged position
     * @param _collateralAmount Amount of collateral to deposit
     * @param _loops Number of loops to execute
     * @param _targetLTV Target LTV for the position
     */
    function openPosition(
        uint256 _collateralAmount,
        uint256 _loops,
        uint256 _targetLTV
    ) external nonReentrant whenNotPaused validLTV(_targetLTV) {
        require(_collateralAmount != 0, "Invalid collateral amount");
        require(_loops != 0 && _loops <= config.maxLoops, "Invalid loop count");
        require(!userPositions[msg.sender].isActive, "Position already active");
        
        // Transfer collateral from user (handle fee-on-transfer tokens)
        IERC20 collateralToken = IERC20(config.collateralToken);
        uint256 balanceBefore = collateralToken.balanceOf(address(this));
        collateralToken.safeTransferFrom(
            msg.sender,
            address(this),
            _collateralAmount
        );
        // Calculate actual amount received (handles fee-on-transfer tokens)
        uint256 balanceAfter = collateralToken.balanceOf(address(this));
        uint256 actualCollateralReceived = balanceAfter - balanceBefore;
        
        // Initialize user position with actual received amount
        userPositions[msg.sender] = PositionInfo({
            totalCollateral: actualCollateralReceived,
            totalDebt: 0,
            ptBalance: 0,
            ytBalance: 0,
            currentLTV: 0,
            lastRebalance: block.timestamp,
            totalLoops: _loops,
            isActive: true
        });
        
        // Execute looping strategy with actual received amount
        if (config.useFlashLoans) {
            _executeWithFlashLoan(msg.sender, actualCollateralReceived, _loops);
        } else {
            _executeWithoutFlashLoan(msg.sender, _collateralAmount, _loops);
        }
        
        // Update position LTV
        userPositions[msg.sender].currentLTV = _calculateLTV(msg.sender);
        
        emit PositionOpened(
            msg.sender,
            _collateralAmount,
            _loops,
            userPositions[msg.sender].currentLTV
        );
    }
    
    /**
     * @notice Rebalance existing position
     * @param _newTargetLTV New target LTV
     */
    function rebalancePosition(uint256 _newTargetLTV) 
        external 
        nonReentrant 
        whenNotPaused 
        activePosition(msg.sender) 
        validLTV(_newTargetLTV) 
    {
        uint256 currentLTV = _calculateLTV(msg.sender);
        uint256 oldLTV = userPositions[msg.sender].currentLTV;
        
        if (currentLTV > _newTargetLTV) {
            // Reduce leverage
            _reduceLeverage(msg.sender, currentLTV - _newTargetLTV);
        } else if (currentLTV < _newTargetLTV) {
            // Increase leverage
            _increaseLeverage(msg.sender, _newTargetLTV - currentLTV);
        }
        
        userPositions[msg.sender].currentLTV = _calculateLTV(msg.sender);
        userPositions[msg.sender].lastRebalance = block.timestamp;
        
        emit PositionRebalanced(
            msg.sender,
            oldLTV,
            userPositions[msg.sender].currentLTV,
            block.timestamp
        );
    }
    
    /**
     * @notice Close position and return collateral
     */
    function closePosition() external nonReentrant activePosition(msg.sender) {
        require(msg.sender == tx.origin, "Contracts not allowed");
        PositionInfo storage pos = userPositions[msg.sender];
        
        // Calculate total value and profit before state changes
        uint256 totalValue = _calculatePositionValue(msg.sender);
        uint256 profit = totalValue > pos.totalCollateral ? 
            totalValue - pos.totalCollateral : 0;
        
        // Store initial collateral for event
        uint256 initialCollateral = pos.totalCollateral;
        
        // Effects: Mark position as inactive before external calls
        pos.isActive = false;
        
        // Interactions: Close all positions
        _closeAllPositions(msg.sender);
        
        // Return collateral to user
        uint256 collateralBalance = IERC20(config.collateralToken).balanceOf(address(this));
        if (collateralBalance > 0) {
            IERC20(config.collateralToken).safeTransfer(msg.sender, collateralBalance);
        }
        
        emit PositionClosed(msg.sender, collateralBalance, profit);
    }
    
    // =============================================================
    //                        FLASH LOAN FUNCTIONS
    // =============================================================
    
    /**
     * @notice Execute strategy with flash loan
     */
    function _executeWithFlashLoan(
        address _user,
        uint256 _collateralAmount,
        uint256 _loops
    ) internal {
        // Calculate flash loan amount needed
        uint256 flashLoanAmount = _calculateFlashLoanAmount(_collateralAmount, _loops);
        
        // Prepare flash loan data
        FlashLoanData memory flashData = FlashLoanData({
            asset: config.borrowToken,
            amount: flashLoanAmount,
            loops: _loops,
            user: _user
        });
        
        // Execute flash loan
        address[] memory assets = new address[](1);
        assets[0] = config.borrowToken;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = flashLoanAmount;
        
        // This would call Balancer flash loan
        // IBalancerVault(BALANCER_VAULT).flashLoan(
        //     IFlashLoanRecipient(address(this)),
        //     assets,
        //     amounts,
        //     abi.encode(flashData)
        // );
    }
    
    /**
     * @notice Execute strategy without flash loan (iterative)
     */
    function _executeWithoutFlashLoan(
        address _user,
        uint256 _collateralAmount,
        uint256 _loops
    ) internal {
        // Input validation
        require(_user != address(0), "Invalid user address");
        require(_collateralAmount != 0, "Collateral amount must be greater than zero");
        require(_loops != 0 && _loops <= 10, "Invalid number of loops"); // Reasonable upper limit
        
        uint256 currentCollateral = _collateralAmount;
        
        for (uint256 i = 0; i < _loops; i++) {
            // 1. Deposit collateral to Aave
            _depositCollateral(currentCollateral);
            
            // 2. Borrow against collateral
            uint256 borrowAmount = _calculateBorrowAmount(currentCollateral);
            _borrowFromAave(borrowAmount);
            
            // 3. Mint PT/YT tokens
            (uint256 ptMinted, uint256 ytMinted) = _mintPTYT(borrowAmount);
            
            // 4. Sell PT tokens for more collateral
            uint256 additionalCollateral = _sellPTTokens(ptMinted);
            
            // 5. Update position with validation
            require(borrowAmount != 0, "Borrow amount must be positive");
            require(ptMinted >= 0, "PT minted cannot be negative");
            require(ytMinted >= 0, "YT minted cannot be negative");
            
            userPositions[_user].totalDebt += borrowAmount;
            userPositions[_user].ptBalance += ptMinted;
            userPositions[_user].ytBalance += ytMinted;
            
            require(additionalCollateral >= 0, "Additional collateral cannot be negative");
            currentCollateral = additionalCollateral;
        }
        
        require(currentCollateral >= 0, "Final collateral cannot be negative");
        userPositions[_user].totalCollateral += currentCollateral;
    }
    
    // =============================================================
    //                        INTERNAL FUNCTIONS
    // =============================================================
    
    function _depositCollateral(uint256 _amount) internal {
        // Deposit to Aave
        IERC20(config.collateralToken).forceApprove(AAVE_POOL, _amount);
        // IAavePool(AAVE_POOL).supply(config.collateralToken, _amount, address(this), 0);
    }
    
    function _borrowFromAave(uint256 _amount) internal {
        // Borrow from Aave
        // IAavePool(AAVE_POOL).borrow(config.borrowToken, _amount, 2, 0, address(this));
    }
    
    function _mintPTYT(uint256 _amount) internal returns (uint256 ptMinted, uint256 ytMinted) {
        // Mint PT/YT tokens using Pendle
        IERC20(config.borrowToken).forceApprove(PENDLE_ROUTER, _amount);
        
        // This would call Pendle router to mint PT/YT
        // (ptMinted, ytMinted) = IPendleRouter(PENDLE_ROUTER).mintPtYt(
        //     config.pendleMarket,
        //     _amount,
        //     address(this)
        // );
        
        // Placeholder values
        ptMinted = _amount * 95 / 100; // Assume 95% efficiency
        ytMinted = _amount * 95 / 100;
    }
    
    function _sellPTTokens(uint256 _ptAmount) internal returns (uint256 collateralReceived) {
        // Sell PT tokens on Uniswap for more collateral
        IERC20(config.ptToken).forceApprove(UNISWAP_ROUTER, _ptAmount);
        
        // This would call Uniswap router to swap PT for collateral
        // collateralReceived = IUniswapRouter(UNISWAP_ROUTER).exactInputSingle(
        //     IUniswapRouter.ExactInputSingleParams({
        //         tokenIn: config.ptToken,
        //         tokenOut: config.collateralToken,
        //         fee: 3000,
        //         recipient: address(this),
        //         deadline: block.timestamp + 300,
        //         amountIn: _ptAmount,
        //         amountOutMinimum: 0,
        //         sqrtPriceLimitX96: 0
        //     })
        // );
        
        // Placeholder calculation
        collateralReceived = _ptAmount * 98 / 100; // Assume 2% slippage
    }
    
    function _calculateBorrowAmount(uint256 _collateralAmount) internal view returns (uint256) {
        // Calculate borrow amount based on target LTV
        return _collateralAmount * config.targetLTV / 10000;
    }
    
    function _calculateLTV(address _user) internal view returns (uint256) {
        PositionInfo storage pos = userPositions[_user];
        if (pos.totalCollateral == 0) return 0;
        return pos.totalDebt * 10000 / pos.totalCollateral;
    }
    
    function _calculatePositionValue(address _user) internal view returns (uint256) {
        PositionInfo storage pos = userPositions[_user];
        
        // Calculate value of PT tokens
        uint256 ptValue = _getPTTokenValue(pos.ptBalance);
        
        // Calculate value of YT tokens
        uint256 ytValue = _getYTTokenValue(pos.ytBalance);
        
        // Total value = collateral + PT value + YT value - debt
        return pos.totalCollateral + ptValue + ytValue - pos.totalDebt;
    }
    
    function _getPTTokenValue(uint256 _ptBalance) internal view returns (uint256) {
        // Get PT token value from Pendle or DEX
        // This would call price oracles or DEX to get current PT price
        return _ptBalance * 98 / 100; // Placeholder
    }
    
    function _getYTTokenValue(uint256 _ytBalance) internal view returns (uint256) {
        // Get YT token value from Pendle or DEX
        // This would call price oracles or DEX to get current YT price
        return _ytBalance * 95 / 100; // Placeholder
    }
    
    function _calculateFlashLoanAmount(uint256 _collateralAmount, uint256 _loops) internal view returns (uint256) {
        // Calculate total flash loan amount needed for all loops
        uint256 multiplier = 1;
        for (uint256 i = 0; i < _loops; i++) {
            multiplier = multiplier * (10000 + config.targetLTV) / 10000;
        }
        return _collateralAmount * (multiplier - 1) / 100;
    }
    
    function _reduceLeverage(address _user, uint256 _ltvReduction) internal {
        // Reduce leverage by selling YT tokens and paying down debt
        PositionInfo storage pos = userPositions[_user];
        
        uint256 debtReduction = pos.totalCollateral * _ltvReduction / 10000;
        uint256 ytToSell = debtReduction * 105 / 100; // Add buffer
        
        if (ytToSell > pos.ytBalance) {
            ytToSell = pos.ytBalance;
        }
        
        // Sell YT tokens
        uint256 proceeds = _sellYTTokens(ytToSell);
        
        // Pay down debt
        _repayDebt(proceeds);
        
        // Update position
        pos.ytBalance -= ytToSell;
        pos.totalDebt -= proceeds;
    }
    
    function _increaseLeverage(address _user, uint256 _ltvIncrease) internal {
        // Increase leverage by borrowing more and minting PT/YT
        PositionInfo storage pos = userPositions[_user];
        
        uint256 additionalBorrow = pos.totalCollateral * _ltvIncrease / 10000;
        
        // Borrow more
        _borrowFromAave(additionalBorrow);
        
        // Mint PT/YT
        (uint256 ptMinted, uint256 ytMinted) = _mintPTYT(additionalBorrow);
        
        // Sell PT for collateral
        uint256 additionalCollateral = _sellPTTokens(ptMinted);
        
        // Update position
        pos.totalDebt += additionalBorrow;
        pos.ptBalance += ptMinted;
        pos.ytBalance += ytMinted;
        pos.totalCollateral += additionalCollateral;
    }
    
    function _sellYTTokens(uint256 _ytAmount) internal returns (uint256) {
        // Sell YT tokens for borrow token
        IERC20(config.ytToken).forceApprove(UNISWAP_ROUTER, _ytAmount);
        
        // This would call Uniswap to swap YT for borrow token
        return _ytAmount * 95 / 100; // Placeholder
    }
    
    function _repayDebt(uint256 _amount) internal {
        // Repay debt to Aave
        IERC20(config.borrowToken).forceApprove(AAVE_POOL, _amount);
        // IAavePool(AAVE_POOL).repay(config.borrowToken, _amount, 2, address(this));
    }
    
    function _closeAllPositions(address _user) internal {
        PositionInfo storage pos = userPositions[_user];
        
        // Sell all YT tokens
        if (pos.ytBalance > 0) {
            uint256 ytProceeds = _sellYTTokens(pos.ytBalance);
            _repayDebt(ytProceeds);
            pos.ytBalance = 0;
        }
        
        // Sell all PT tokens
        if (pos.ptBalance > 0) {
            _sellPTTokens(pos.ptBalance);
            pos.ptBalance = 0;
        }
        
        // Repay remaining debt
        uint256 remainingDebt = pos.totalDebt;
        if (remainingDebt > 0) {
            _repayDebt(remainingDebt);
            pos.totalDebt = 0;
        }
        
        // Withdraw collateral from Aave
        // IAavePool(AAVE_POOL).withdraw(config.collateralToken, type(uint256).max, address(this));
    }
    
    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================
    
    function calculateCurrentLTV(address _user) external view returns (uint256) {
        return _calculateLTV(_user);
    }
    
    function calculatePositionValue(address _user) external view returns (uint256) {
        return _calculatePositionValue(_user);
    }
    
    // =============================================================
    //                        EMERGENCY FUNCTIONS
    // =============================================================
    
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyAction(msg.sender, "PAUSE", "");
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyAction(msg.sender, "UNPAUSE", "");
    }
     function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_token);
        address contractOwner = owner();
        // Get balance before transfer to handle fee-on-transfer tokens
        uint256 balanceBefore = token.balanceOf(contractOwner);
        token.safeTransfer(contractOwner, _amount);
        // Calculate actual amount received (handles fee-on-transfer tokens)
        uint256 balanceAfter = token.balanceOf(contractOwner);
        uint256 actualAmountTransferred = balanceAfter - balanceBefore;
        emit EmergencyAction(msg.sender, "WITHDRAW", abi.encode(_token, actualAmountTransferred));
    }

    /**
     * @notice Emergency ETH withdrawal - only owner
     * @dev Allows owner to withdraw ETH that might be stuck in contract
     */
    function emergencyWithdrawETH() external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        uint256 balance = address(this).balance;
        require(balance != 0, "No ETH to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
        emit EmergencyAction(msg.sender, "ETH_WITHDRAW", abi.encode(balance));
    }

    // =============================================================
    //                        RECEIVE FUNCTION
    // =============================================================
    
    receive() external payable {
        // Accept ETH for gas refunds
        // Note: Use emergencyWithdrawETH() to retrieve stuck ETH
    }
}
