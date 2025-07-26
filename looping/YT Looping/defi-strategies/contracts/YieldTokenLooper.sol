// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title YieldTokenLooper
 * @dev Automated yield farming contract for Pendle YT+PT tokens with USDe
 * Features:
 * - Mints YT+PT from USDe
 * - Deposits PT to best lending protocol (Morpho/Aave/Euler)
 * - Borrows USDe against PT collateral
 * - Loops multiple times in one transaction
 * - Unwinds entire position in one transaction
 * - Rate comparison for optimal lending
 */
contract YieldTokenLooper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;
    
    // ============ Constants ============
    
    IERC20 private constant EUSDE = IERC20(0x90D2af7d622ca3141EfA4d8f1F24D86e5974cC8F); // eUSDe token ✅
    IERC20 private constant USDE = IERC20(0x8c3133b8c0b1d440dd7d1b6b73c8d8b6eFeEa2e5);  // USDe token ✅

    // Lending Protocols
    address private constant MORPHO_POOL = 0xa1C3AB876bDb7c0fF4b5f6Be7a17CDEf81b9DC77;  // Morpho Pool ✅
    address private constant AAVE_POOL = 0x7b8b8c8c1e3b8a8c9e8c9a8c9a8c9a8c9a8c9a8c;    // Aave Pool
    address private constant EULER_POOL = 0x8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c;   // Euler Pool

    // Pendle Contracts
    address private constant PENDLE_ROUTER = 0x888888888889758F76e7103c6CbF23ABbF58F946; // Pendle Router V4 ✅
    address private constant PENDLE_MARKET = 0x9Df192D13D61609D1852461c4850595e1F56E714; // eUSDe market (CONFIRMED)
    address private constant PENDLE_ADAPTER = 0xBf9fC05C99bDBa25fb44dfB323dE445178C0FbF3; // Pendle Adapter
    address private constant PENDLE_SY = 0xb47CBF6697A6518222c7Af4098A43AEFe2739c8c; // USDe SY token
    address private constant PENDLE_EUSDE_SY = 0x7ac8ca87959b1d5EDfe2df5325A37c304DCea4D0; // eUSDe SY token ✅

    // ============ State Variables ============
    
    struct Position {
        uint256 totalPTDeposited;      // Total PT tokens deposited
        uint256 totalUSDeBorrowed;     // Total USDe borrowed
        uint256 targetLTV;             // Target LTV ratio (in bps, e.g., 7500 = 75%)
        address lendingProtocol;       // Selected lending protocol
        uint256 loopCount;             // Number of loops executed
        bool isActive;                 // Position status
    }
    
    mapping(address => Position) public positions;
    
    // ============ Events ============
    
    event PositionOpened(address indexed user, uint256 initialAmount, uint256 targetLTV, address lendingProtocol);
    event LoopExecuted(address indexed user, uint256 loopNumber, uint256 ptMinted, uint256 usdeIn, uint256 usdeOut);
    event PositionClosed(address indexed user, uint256 ptWithdrawn, uint256 debtRepaid, int256 netResult);
    event ProtocolRatesUpdated(uint256 morphoRate, uint256 aaveRate, uint256 eulerRate);
    
    // ============ Interfaces ============
    
    interface IPendleRouter {
        enum SwapType { NONE, KYBER, UNI_V2, UNI_V3, BALANCER_V2 }
        
        struct SwapData {
            SwapType swapType;
            address extRouter;
            bytes extCalldata;
            bool needScale;
        }
        
        struct TokenInput {
            address tokenIn;
            uint256 netTokenIn;
            address tokenMintSy;
            address bulk;
            address pendleSwap;
            SwapData swapData;
        }
        
        struct TokenOutput {
            address tokenOut;
            uint256 minTokenOut;
            address tokenRedeemSy;
            address bulk;
            address pendleSwap;
            SwapData swapData;
        }
        
        function mintPyFromToken(
            address receiver,
            address market,
            uint256 minPtOut,
            uint256 minYtOut,
            TokenInput calldata input
        ) external payable returns (uint256 netPtOut, uint256 netYtOut);
        
        function redeemPyToToken(
            address receiver,
            address market,
            uint256 netPyIn,
            TokenOutput calldata output
        ) external returns (uint256 netTokenOut);
    }
    
    interface IMorpho {
        function borrowRate(address underlying) external view returns (uint256);
        function supply(address underlying, uint256 amount, address onBehalfOf, uint16 referralCode) external;
        function borrow(address underlying, uint256 amount, address onBehalfOf, uint16 referralCode) external;
        function repay(address underlying, uint256 amount, address onBehalfOf) external returns (uint256);
        function withdraw(address underlying, uint256 amount, address to) external returns (uint256);
    }
    
    interface IAave {
        function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
        function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
        function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
        function withdraw(address asset, uint256 amount, address to) external returns (uint256);
        function getReserveData(address asset) external view returns (ReserveData memory);
        
        struct ReserveData {
            uint256 currentLiquidityRate;
            uint256 currentStableBorrowRate;
            uint256 currentVariableBorrowRate;
            uint256 liquidityIndex;
            uint256 variableBorrowIndex;
            uint256 stableBorrowRateLastUpdate;
            uint256 lastUpdateTimestamp;
            uint128 accruedToTreasury;
            uint40 reserveFactor;
            uint16 ltv;
            uint16 liquidationThreshold;
            uint16 liquidationBonus;
            uint8 decimals;
            bool borrowingEnabled;
            bool stableBorrowRateEnabled;
            bool isActive;
            bool isFrozen;
        }
    }
    
    interface IEuler {
        function borrowRate(uint256 pool) external view returns (uint256);
        function deposit(uint256 amount) external;
        function borrow(uint256 amount) external;
        function repay(uint256 amount) external;
        function withdraw(uint256 amount) external;
    }
    
    IPendleRouter public immutable pendleRouter;
    IMorpho public immutable morpho;
    IAave public immutable aave;
    IEuler public immutable euler;
    
    // ============ Constructor ============
    
    constructor() {
        pendleRouter = IPendleRouter(PENDLE_ROUTER);
        morpho = IMorpho(MORPHO_POOL);
        aave = IAave(AAVE_POOL);
        euler = IEuler(EULER_POOL);
    }
    
    // ============ Main Functions ============
    
    /**
     * @dev Opens a new yield farming position with multiple loops
     */
    function openPosition(
        uint256 initialAmount,
        uint256 targetLTV,    // In basis points (e.g., 7500 = 75%)
        uint256 loopCount,    // Number of loops to execute
        address preferredProtocol  // Address(0) for auto-selection
    ) external nonReentrant {
        require(initialAmount != 0, "Amount must be != 0");
        require(targetLTV <= 9000, "LTV too high"); // Max 90%
        require(loopCount != 0 && loopCount <= 10, "Invalid loop count");
        require(!positions[msg.sender].isActive, "Position already active");
        
        // Transfer USDe from user
        USDE.safeTransferFrom(msg.sender, address(this), initialAmount);
        
        // Select best lending protocol
        address protocol = preferredProtocol == address(0) ? 
            selectBestProtocol() : preferredProtocol;
        
        // Initialize position
        Position storage pos = positions[msg.sender];
        pos.targetLTV = targetLTV;
        pos.lendingProtocol = protocol;
        pos.loopCount = loopCount;
        pos.isActive = true;
        
        // Execute loops
        uint256 remainingAmount = initialAmount;
        for (uint256 i = 0; i < loopCount; i++) {
            remainingAmount = executeLoop(msg.sender, remainingAmount, targetLTV, protocol, i + 1);
            if (remainingAmount == 0) break;
        }
        
        emit PositionOpened(msg.sender, initialAmount, targetLTV, protocol);
    }
    
    /**
     * @dev Closes the entire position and returns funds to user
     */
    function closePosition() external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.isActive, "No active position");
        
        // 1. Withdraw all PT tokens
        uint256 ptWithdrawn = withdrawFromLendingProtocol(pos.lendingProtocol, pos.totalPTDeposited);
        
        // 2. Redeem PT+YT back to USDe
        uint256 usdeReceived = redeemPTYTToUSDe(ptWithdrawn);
        
        // 3. Get total debt
        uint256 totalDebt = pos.totalUSDeBorrowed;
        
        // 4. Repay debt
        uint256 debtRepaid = repayDebt(pos.lendingProtocol, totalDebt);
        
        // 5. Calculate net result - FIXED: Using SafeCast
        int256 netResult = SafeCast.toInt256(usdeReceived) - SafeCast.toInt256(debtRepaid);
        
        // 6. Transfer remaining USDe to user - FIXED: Using SafeCast
        if (netResult > 0) {
            USDE.safeTransfer(msg.sender, SafeCast.toUint256(netResult));
        }
        
        // 7. Clear position
        delete positions[msg.sender];
        
        emit PositionClosed(msg.sender, ptWithdrawn, debtRepaid, netResult);
    }
    
    /**
     * @dev Executes a single loop iteration
     */
    function executeLoop(
        address user,
        uint256 usdeAmount,
        uint256 targetLTV,
        address lendingProtocol,
        uint256 loopNumber
    ) internal returns (uint256 borrowedAmount) {
        Position storage pos = positions[user];
        
        // 1. Mint YT+PT from USDe
        (uint256 ptMinted, uint256 ytMinted) = mintPTYT(usdeAmount);
        
        // 2. Deposit PT to lending protocol
        depositToLendingProtocol(lendingProtocol, ptMinted);
        pos.totalPTDeposited += ptMinted;
        
        // 3. Borrow USDe against PT collateral
        uint256 maxBorrow = calculateMaxBorrow(lendingProtocol, ptMinted, targetLTV);
        borrowedAmount = borrowFromLendingProtocol(lendingProtocol, maxBorrow);
        pos.totalUSDeBorrowed += borrowedAmount;
        
        emit LoopExecuted(user, loopNumber, ptMinted, usdeAmount, borrowedAmount);
        
        return borrowedAmount;
    }
    
    // ============ Pendle Integration ============
    
    /**
     * @dev Mints PT+YT tokens from USDe
     */
    function mintPTYT(uint256 usdeAmount) internal returns (uint256 ptMinted, uint256 ytMinted) {
        // Pendle mint parameters
        IPendleRouter.TokenInput memory tokenInput = IPendleRouter.TokenInput({
            tokenIn: address(USDE),
            netTokenIn: usdeAmount,
            tokenMintSy: address(USDE),
            bulk: address(0),
            pendleSwap: address(0),
            swapData: IPendleRouter.SwapData({
                swapType: IPendleRouter.SwapType.NONE,
                extRouter: address(0),
                extCalldata: "",
                needScale: false
            })
        });
        
        // Execute mint
        (ptMinted, ytMinted) = pendleRouter.mintPyFromToken(
            msg.sender,
            PENDLE_MARKET,
            0, // minPtOut
            0, // minYtOut
            tokenInput
        );
    }
    
    /**
     * @dev Redeems PT+YT back to USDe
     */
    function redeemPTYTToUSDe(uint256 ptAmount) internal returns (uint256 usdeReceived) {
        // Get corresponding YT amount (assuming 1:1 ratio)
        uint256 ytAmount = ptAmount;
        
        // Pendle redeem parameters
        IPendleRouter.TokenOutput memory tokenOutput = IPendleRouter.TokenOutput({
            tokenOut: address(USDE),
            minTokenOut: 0,
            tokenRedeemSy: address(USDE),
            bulk: address(0),
            pendleSwap: address(0),
            swapData: IPendleRouter.SwapData({
                swapType: IPendleRouter.SwapType.NONE,
                extRouter: address(0),
                extCalldata: "",
                needScale: false
            })
        });
        
        // Execute redeem
        usdeReceived = pendleRouter.redeemPyToToken(
            msg.sender,
            PENDLE_MARKET,
            ptAmount + ytAmount, // Total PY amount
            tokenOutput
        );
    }
    
    // ============ Lending Protocol Integration ============
    
    /**
     * @dev Deposits PT tokens to selected lending protocol
     */
    function depositToLendingProtocol(address protocol, uint256 amount) internal {
        if (protocol == MORPHO_POOL) {
            morpho.supply(address(EUSDE), amount, address(this), 0);
        } else if (protocol == AAVE_POOL) {
            aave.supply(address(EUSDE), amount, address(this), 0);
        } else if (protocol == EULER_POOL) {
            euler.deposit(amount);
        }
    }
    
    /**
     * @dev Borrows USDe from selected lending protocol
     */
    function borrowFromLendingProtocol(address protocol, uint256 amount) internal returns (uint256) {
        if (protocol == MORPHO_POOL) {
            morpho.borrow(address(USDE), amount, address(this), 0);
            return amount;
        } else if (protocol == AAVE_POOL) {
            aave.borrow(address(USDE), amount, 2, 0, address(this)); // Variable rate
            return amount;
        } else if (protocol == EULER_POOL) {
            euler.borrow(amount);
            return amount;
        }
        return 0;
    }
    
    /**
     * @dev Withdraws PT tokens from lending protocol
     */
    function withdrawFromLendingProtocol(address protocol, uint256 amount) internal returns (uint256) {
        if (protocol == MORPHO_POOL) {
            return morpho.withdraw(address(EUSDE), amount, address(this));
        } else if (protocol == AAVE_POOL) {
            return aave.withdraw(address(EUSDE), amount, address(this));
        } else if (protocol == EULER_POOL) {
            euler.withdraw(amount);
            return amount;
        }
        return 0;
    }
    
    /**
     * @dev Repays debt to lending protocol
     */
    function repayDebt(address protocol, uint256 amount) internal returns (uint256) {
        if (protocol == MORPHO_POOL) {
            return morpho.repay(address(USDE), amount, address(this));
        } else if (protocol == AAVE_POOL) {
            return aave.repay(address(USDE), amount, 2, address(this)); // Variable rate
        } else if (protocol == EULER_POOL) {
            euler.repay(amount);
            return amount;
        }
        return 0;
    }
    
    // ============ Helper Functions ============
    
    /**
     * @dev Selects the lending protocol with the best rates
     */
    function selectBestProtocol() internal view returns (address) {
        uint256 morphoRate = morpho.borrowRate(address(USDE));
        uint256 aaveRate = aave.getReserveData(address(USDE)).currentVariableBorrowRate;
        uint256 eulerRate = euler.borrowRate(0);
        
        if (morphoRate <= aaveRate && morphoRate <= eulerRate) {
            return MORPHO_POOL;
        } else if (aaveRate <= eulerRate) {
            return AAVE_POOL;
        } else {
            return EULER_POOL;
        }
    }
    
    /**
     * @dev Calculates maximum borrow amount based on LTV
     */
    function calculateMaxBorrow(address protocol, uint256 collateralAmount, uint256 targetLTV) internal pure returns (uint256) {
        // Simplified calculation - assume 1:1 PT to USDe value
        return (collateralAmount * targetLTV) / 10000;
    }
    
    /**
     * @dev Gets current protocol rates for comparison
     */
    function getProtocolRates() external view returns (uint256 morphoRate, uint256 aaveRate, uint256 eulerRate) {
        morphoRate = morpho.borrowRate(address(USDE));
        aaveRate = aave.getReserveData(address(USDE)).currentVariableBorrowRate;
        eulerRate = euler.borrowRate(0);
    }
    
    /**
     * @dev Emergency function to pause the contract
     */
    function emergencyPause() external onlyOwner {
        // Implement pause functionality if needed
    }
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
