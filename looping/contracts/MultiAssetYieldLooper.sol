// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./utils/ProtocolConstants.sol";

/**
 * @title MultiAssetYieldLooper
 * @dev Advanced yield farming contract supporting both USDe and eUSDe with Pendle YT+PT
 * Features:
 * - Support for USDe and eUSDe assets
 * - Mints YT+PT from either USDe or eUSDe
 * - Deposits PT to best lending protocol (Morpho/Aave/Euler)
 * - Borrows underlying asset against PT collateral
 * - Loops multiple times in one transaction
 * - Unwinds entire position in one transaction
 * - Rate comparison for optimal lending
 * - Enhanced yield with eUSDe staking rewards
 */
contract MultiAssetYieldLooper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Asset Types ============
    
    enum AssetType {
        USDE,
        EUSDE
    }
    
    // ============ Constants ============
    
    // Underlying Assets
    IERC20 private constant USDE = IERC20(ProtocolConstants.USDE);
    IERC20 private constant EUSDE = IERC20(ProtocolConstants.EUSDE); // TODO: Add eUSDe address
    
    // ============ State Variables ============
    
    struct Position {
        AssetType assetType;
        uint256 totalPTDeposited;
        uint256 totalAssetBorrowed;
        uint256 loopCount;
        address lendingProtocol;
        bool isActive;
        uint256 lastUpdated;
        uint256 initialDeposit;
    }
    
    struct AssetConfig {
        IERC20 token;
        address market;
        address syToken;
        address ytToken;
        address ptToken;
        address morphoPool;
        address aaveDebtToken;
        address aaveAToken;
        address aavePTDebtToken;
        address eulerVault;
    }
    
    mapping(address => Position) public positions;
    mapping(AssetType => AssetConfig) public assetConfigs;
    
    // Protocol interfaces
    IMorpho public morpho;
    IAave public aave;
    IEuler public euler;
    IPendleRouter public pendleRouter;
    
    // ============ Events ============
    
    event PositionOpened(
        address indexed user,
        AssetType indexed assetType,
        uint256 initialAmount,
        uint256 loops,
        address lendingProtocol
    );
    
    event PositionClosed(
        address indexed user,
        AssetType indexed assetType,
        uint256 totalPTWithdrawn,
        uint256 totalAssetBorrowed,
        int256 netResult
    );
    
    event LoopExecuted(
        address indexed user,
        AssetType indexed assetType,
        uint256 loopNumber,
        uint256 ptMinted,
        uint256 assetDeposited,
        uint256 assetBorrowed
    );
    
    event AssetConfigUpdated(
        AssetType indexed assetType,
        address indexed token,
        address indexed market
    );
    
    // ============ Constructor ============
    
    constructor(
        address _morpho,
        address _aave,
        address _euler
    ) {
        morpho = IMorpho(_morpho);
        aave = IAave(_aave);
        euler = IEuler(_euler);
        pendleRouter = IPendleRouter(ProtocolConstants.PENDLE_ROUTER);
        
        // Initialize asset configurations
        _initializeAssetConfigs();
    }
    
    // ============ Initialization ============
    
    function _initializeAssetConfigs() private {
        // USDe configuration
        assetConfigs[AssetType.USDE] = AssetConfig({
            token: USDE,
            market: ProtocolConstants.USDE_MARKET,
            syToken: ProtocolConstants.USDE_SY,
            ytToken: ProtocolConstants.USDE_YT,
            ptToken: ProtocolConstants.USDE_PT,
            morphoPool: address(0), // TODO: Add Morpho USDe Pool when available
            aaveDebtToken: ProtocolConstants.AAVE_USDE_DEBT_TOKEN,
            aaveAToken: ProtocolConstants.AAVE_USDE_ATOKEN,
            aavePTDebtToken: ProtocolConstants.AAVE_PT_USDE_DEBT_TOKEN,
            eulerVault: ProtocolConstants.EULER_PT_USDE_VAULT
        });
        
        // eUSDe configuration
        assetConfigs[AssetType.EUSDE] = AssetConfig({
            token: EUSDE,
            market: ProtocolConstants.EUSDE_MARKET,
            syToken: ProtocolConstants.EUSDE_SY,
            ytToken: ProtocolConstants.EUSDE_YT,
            ptToken: ProtocolConstants.EUSDE_PT,
            morphoPool: address(0), // TODO: Add Morpho eUSDe Pool when available
            aaveDebtToken: ProtocolConstants.AAVE_EUSDE_DEBT_TOKEN,
            aaveAToken: ProtocolConstants.AAVE_EUSDE_ATOKEN,
            aavePTDebtToken: ProtocolConstants.AAVE_PT_EUSDE_DEBT_TOKEN,
            eulerVault: ProtocolConstants.EULER_PT_EUSDE_VAULT
        });
    }
    
    // ============ Main Functions ============
    
    /**
     * @dev Opens a leveraged yield farming position
     * @param assetType The asset type (USDe or eUSDe)
     * @param initialAmount Initial asset amount to deposit
     * @param loops Number of leverage loops to perform
     * @param lendingProtocol Protocol to use for lending (Morpho/Aave/Euler)
     */
    function openPosition(
        AssetType assetType,
        uint256 initialAmount,
        uint256 loops,
        address lendingProtocol
    ) external nonReentrant {
        require(initialAmount != 0, "Amount must be positive");
        require(loops != 0 && loops <= ProtocolConstants.MAX_LOOPS, "Invalid loop count");
        require(!positions[msg.sender].isActive, "Position already active");
        
        AssetConfig memory config = assetConfigs[assetType];
        require(address(config.token) != address(0), "Asset not configured");
        
        // Transfer initial amount from user
        config.token.safeTransferFrom(msg.sender, address(this), initialAmount);
        
        // Initialize position
        positions[msg.sender] = Position({
            assetType: assetType,
            totalPTDeposited: 0,
            totalAssetBorrowed: 0,
            loopCount: loops,
            lendingProtocol: lendingProtocol,
            isActive: true,
            lastUpdated: block.timestamp,
            initialDeposit: initialAmount
        });
        
        uint256 currentAmount = initialAmount;
        
        // Execute loops
        for (uint256 i = 0; i < loops; i++) {
            currentAmount = _executeLoop(assetType, currentAmount, i + 1);
        }
        
        emit PositionOpened(msg.sender, assetType, initialAmount, loops, lendingProtocol);
    }
    
    /**
     * @dev Closes the entire position and returns assets to user
     */
    function closePosition() external nonReentrant {
        Position storage position = positions[msg.sender];
        require(position.isActive, "No active position");
        
        AssetConfig memory config = assetConfigs[position.assetType];
        
        // Store position data before clearing state
        uint256 totalPTToWithdraw = position.totalPTDeposited;
        uint256 totalDebtToRepay = position.totalAssetBorrowed;
        uint256 initialDeposit = position.initialDeposit;
        AssetType positionAssetType = position.assetType;
        address positionLendingProtocol = position.lendingProtocol;
        
        // Effects: Reset position before external calls
        delete positions[msg.sender];
        
        // Interactions: External calls after state updates
        // Withdraw PT from lending protocol
        uint256 ptWithdrawn = _withdrawFromLendingProtocol(
            positionLendingProtocol,
            config,
            totalPTToWithdraw
        );
        
        // Redeem PT+YT for underlying asset
        uint256 assetReceived = _redeemPendleTokens(config, ptWithdrawn);
        
        // Repay debt
        uint256 assetAfterRepay = assetReceived;
        if (totalDebtToRepay > 0) {
            uint256 repayAmount = totalDebtToRepay > assetReceived ? assetReceived : totalDebtToRepay;
            _repayDebt(positionLendingProtocol, config, repayAmount);
            assetAfterRepay = assetReceived - repayAmount;
        }
        
        // Calculate net result with safe casting
        int256 netResult = SafeCast.toInt256(assetAfterRepay) - SafeCast.toInt256(initialDeposit);
        
        // Transfer remaining assets to user
        if (assetAfterRepay > 0) {
            config.token.safeTransfer(msg.sender, assetAfterRepay);
        }
        
        emit PositionClosed(msg.sender, positionAssetType, ptWithdrawn, totalDebtToRepay, netResult);
    }
    
    /**
     * @dev Executes a single loop iteration
     */
    function _executeLoop(
        AssetType assetType,
        uint256 assetAmount,
        uint256 loopNumber
    ) internal returns (uint256) {
        AssetConfig memory config = assetConfigs[assetType];
        Position storage position = positions[msg.sender];
        
        // 1. Mint PT+YT from underlying asset
        uint256 ptMinted = _mintPendleTokens(config, assetAmount);
        
        // 2. Deposit PT to lending protocol
        _depositToLendingProtocol(position.lendingProtocol, config, ptMinted);
        
        // 3. Borrow underlying asset against PT
        uint256 borrowAmount = _calculateBorrowAmount(ptMinted, assetType);
        uint256 assetBorrowed = _borrowAsset(position.lendingProtocol, config, borrowAmount);
        
        // 4. Update position state
        position.totalPTDeposited += ptMinted;
        position.totalAssetBorrowed += assetBorrowed;
        position.lastUpdated = block.timestamp;
        
        emit LoopExecuted(msg.sender, assetType, loopNumber, ptMinted, assetAmount, assetBorrowed);
        
        return assetBorrowed;
    }
    
    // ============ Pendle Integration ============
    
    function _mintPendleTokens(
        AssetConfig memory config,
        uint256 assetAmount
    ) internal returns (uint256) {
        // Approve Pendle Router
        config.token.safeApprove(PENDLE_ROUTER, assetAmount);
        
        // Mint SY tokens first
        uint256 syAmount = IPendleRouter(PENDLE_ROUTER).mintSY(
            config.syToken,
            address(this),
            assetAmount
        );
        
        // Mint PT+YT from SY
        (uint256 ptAmount, uint256 ytAmount) = IPendleRouter(PENDLE_ROUTER).mintPTYT(
            config.market,
            address(this),
            syAmount
        );
        
        return ptAmount;
    }
    
    function _redeemPendleTokens(
        AssetConfig memory config,
        uint256 ptAmount
    ) internal returns (uint256) {
        // Redeem PT+YT for SY
        uint256 syReceived = IPendleRouter(PENDLE_ROUTER).redeemPTYT(
            config.market,
            address(this),
            ptAmount
        );
        
        // Redeem SY for underlying asset
        uint256 assetReceived = IPendleRouter(PENDLE_ROUTER).redeemSY(
            config.syToken,
            address(this),
            syReceived
        );
        
        return assetReceived;
    }
    
    // ============ Lending Protocol Integration ============
    
    function _depositToLendingProtocol(
        address protocol,
        AssetConfig memory config,
        uint256 ptAmount
    ) internal {
        if (protocol == MORPHO_BLUE) {
            _depositToMorpho(config, ptAmount);
        } else if (protocol == AAVE_V3_POOL) {
            _depositToAave(config, ptAmount);
        } else if (protocol == EULER_MAIN_POOL) {
            _depositToEuler(config, ptAmount);
        } else {
            revert("Unsupported lending protocol");
        }
    }
    
    function _withdrawFromLendingProtocol(
        address protocol,
        AssetConfig memory config,
        uint256 amount
    ) internal returns (uint256) {
        if (protocol == MORPHO_BLUE) {
            return _withdrawFromMorpho(config, amount);
        } else if (protocol == AAVE_V3_POOL) {
            return _withdrawFromAave(config, amount);
        } else if (protocol == EULER_MAIN_POOL) {
            return _withdrawFromEuler(config, amount);
        } else {
            revert("Unsupported lending protocol");
        }
    }
    
    function _borrowAsset(
        address protocol,
        AssetConfig memory config,
        uint256 amount
    ) internal returns (uint256) {
        if (protocol == MORPHO_BLUE) {
            return _borrowFromMorpho(config, amount);
        } else if (protocol == AAVE_V3_POOL) {
            return _borrowFromAave(config, amount);
        } else if (protocol == EULER_MAIN_POOL) {
            return _borrowFromEuler(config, amount);
        } else {
            revert("Unsupported lending protocol");
        }
    }
    
    function _repayDebt(
        address protocol,
        AssetConfig memory config,
        uint256 amount
    ) internal {
        if (protocol == MORPHO_BLUE) {
            _repayToMorpho(config, amount);
        } else if (protocol == AAVE_V3_POOL) {
            _repayToAave(config, amount);
        } else if (protocol == EULER_MAIN_POOL) {
            _repayToEuler(config, amount);
        } else {
            revert("Unsupported lending protocol");
        }
    }
    
    // ============ Morpho Integration ============
    
    function _depositToMorpho(AssetConfig memory config, uint256 amount) internal {
        // TODO: Implement Morpho deposit logic
        // This would require the Morpho pool address and market parameters
    }
    
    function _withdrawFromMorpho(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        // TODO: Implement Morpho withdrawal logic
        return amount;
    }
    
    function _borrowFromMorpho(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        // TODO: Implement Morpho borrowing logic
        return amount;
    }
    
    function _repayToMorpho(AssetConfig memory config, uint256 amount) internal {
        // TODO: Implement Morpho repayment logic
    }
    
    // ============ Aave Integration ============
    
    function _depositToAave(AssetConfig memory config, uint256 amount) internal {
        IERC20 token = IERC20(config.ptToken);
        uint256 currentAllowance = token.allowance(address(this), AAVE_V3_POOL);
        if (currentAllowance < amount) {
            if (currentAllowance > 0) {
                token.safeApprove(AAVE_V3_POOL, 0);
            }
            token.safeIncreaseAllowance(AAVE_V3_POOL, amount - currentAllowance);
        }
        IAave(AAVE_V3_POOL).supply(config.ptToken, amount, address(this), 0);
    }
    
    function _withdrawFromAave(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        return IAave(AAVE_V3_POOL).withdraw(config.ptToken, amount, address(this));
    }
    
    function _borrowFromAave(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        IAave(AAVE_V3_POOL).borrow(address(config.token), amount, 2, 0, address(this));
        return amount;
    }
    
    function _repayToAave(AssetConfig memory config, uint256 amount) internal {
        IERC20 token = IERC20(address(config.token));
        uint256 currentAllowance = token.allowance(address(this), AAVE_V3_POOL);
        if (currentAllowance < amount) {
            if (currentAllowance > 0) {
                token.safeApprove(AAVE_V3_POOL, 0);
            }
            token.safeIncreaseAllowance(AAVE_V3_POOL, amount - currentAllowance);
        }
        IAave(AAVE_V3_POOL).repay(address(config.token), amount, 2, address(this));
    }
    
    // ============ Euler Integration ============
    
    function _depositToEuler(AssetConfig memory config, uint256 amount) internal {
        IERC20 token = IERC20(config.ptToken);
        uint256 currentAllowance = token.allowance(address(this), config.eulerVault);
        if (currentAllowance < amount) {
            if (currentAllowance > 0) {
                token.safeApprove(config.eulerVault, 0);
            }
            token.safeIncreaseAllowance(config.eulerVault, amount - currentAllowance);
        }
        IEuler(config.eulerVault).deposit(amount, address(this));
    }
    
    function _withdrawFromEuler(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        return IEuler(config.eulerVault).withdraw(amount, address(this), address(this));
    }
    
    function _borrowFromEuler(AssetConfig memory config, uint256 amount) internal returns (uint256) {
        IEuler(config.eulerVault).borrow(amount, address(this), address(this));
        return amount;
    }
    
    function _repayToEuler(AssetConfig memory config, uint256 amount) internal {
        config.token.safeApprove(config.eulerVault, amount);
        IEuler(config.eulerVault).repay(amount, address(this));
    }
    
    // ============ Utility Functions ============
    
    function _calculateBorrowAmount(uint256 ptAmount, AssetType assetType) internal view returns (uint256) {
        // Calculate safe borrow amount based on PT value and LTV
        // This is a simplified calculation - in production, use oracle prices
        if (assetType == AssetType.EUSDE) {
            // eUSDe might have different LTV ratios
            return (ptAmount * 75) / 100; // 75% LTV for eUSDe
        } else {
            return (ptAmount * 80) / 100; // 80% LTV for USDe
        }
    }
    
    function getBestLendingRate(AssetType /* assetType */) external view returns (address, uint256) {
        // Compare rates across protocols and return the best one
        // This is a simplified version - implement proper rate comparison
        return (MORPHO_BLUE, 500); // 5% APY example
    }
    
    function getPositionHealth(address user) external view returns (uint256) {
        Position memory position = positions[user];
        if (!position.isActive) return 0;
        
        // Calculate health factor based on PT value vs debt
        // This is simplified - implement proper health calculation
        if (position.totalAssetBorrowed == 0) return type(uint256).max;
        
        return (position.totalPTDeposited * 100) / position.totalAssetBorrowed;
    }
    
    function getEstimatedYield(AssetType assetType, uint256 amount, uint256 loops) external view returns (uint256) {
        // Calculate estimated yield based on current rates
        // This is a simplified calculation
        uint256 baseYield = assetType == AssetType.EUSDE ? 800 : 600; // 8% vs 6% base yield
        uint256 leverageMultiplier = 100 + (loops * 50); // 50% additional per loop
        
        return (amount * baseYield * leverageMultiplier) / (100 * 100);
    }
    
    // ============ Admin Functions ============
    
    function updateAssetConfig(
        AssetType assetType,
        address token,
        address market,
        address syToken,
        address ytToken,
        address ptToken
    ) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        // Input validation
        require(token != address(0), "Token address cannot be zero");
        require(market != address(0), "Market address cannot be zero");
        require(syToken != address(0), "SY Token address cannot be zero");
        require(ytToken != address(0), "YT Token address cannot be zero");
        require(ptToken != address(0), "PT Token address cannot be zero");
        AssetConfig storage config = assetConfigs[assetType];
        config.token = IERC20(token);
        config.market = market;
        config.syToken = syToken;
        config.ytToken = ytToken;
        config.ptToken = ptToken;
        emit AssetConfigUpdated(assetType, token, market);
    }

    function updateProtocolAddresses(
        AssetType assetType,
        address morphoPool,
        address aaveDebtToken,
        address aaveAToken,
        address aavePTDebtToken,
        address eulerVault
    ) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized");
        // Input validation (allow zero addresses for optional protocols)
        require(
            morphoPool != address(0) || 
            aaveDebtToken != address(0) || 
            eulerVault != address(0), 
            "At least one protocol must be configured"
        );
        AssetConfig storage config = assetConfigs[assetType];
        config.morphoPool = morphoPool;
        config.aaveDebtToken = aaveDebtToken;
        config.aaveAToken = aaveAToken;
        config.aavePTDebtToken = aavePTDebtToken;
        config.eulerVault = eulerVault;
    }
    
    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}

// ============ Interfaces ============

interface IMorpho {
    function supply(address market, uint256 amount, address onBehalf) external;
    function withdraw(address market, uint256 amount, address onBehalf, address receiver) external;
    function borrow(address market, uint256 amount, address onBehalf, address receiver) external;
    function repay(address market, uint256 amount, address onBehalf, bytes calldata data) external;
}

interface IAave {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
}

interface IEuler {
    function deposit(uint256 amount, address receiver) external returns (uint256);
    function withdraw(uint256 amount, address receiver, address owner) external returns (uint256);
    function borrow(uint256 amount, address receiver, address owner) external returns (uint256);
    function repay(uint256 amount, address receiver) external returns (uint256);
}

interface IPendleRouter {
    function mintSY(address sy, address receiver, uint256 minSYOut) external returns (uint256);
    function mintPTYT(address market, address receiver, uint256 syAmount) external returns (uint256, uint256);
    function redeemPTYT(address market, address receiver, uint256 ptAmount) external returns (uint256);
    function redeemSY(address sy, address receiver, uint256 syAmount) external returns (uint256);
}
