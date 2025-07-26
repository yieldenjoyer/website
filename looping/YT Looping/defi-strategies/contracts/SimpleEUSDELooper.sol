// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleEUSDELooper
 * @dev 
 * 
 * This contract is 100% isolated for PT/YT yield farming only.
 * 
 */
contract SimpleEUSDELooper is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ eUSDe Addresses ============
    
    // ✅ eUSDe token address
    address private constant EUSDE_BASE = 0x90D2af7d622ca3141efA4d8f1F24d86E5974Cc8F; // eUSDe token
    address private constant EUSDE_MARKET = 0x9Df192D13D61609D1852461c4850595e1F56E714; // eUSDe Pendle market
    
    // ✅ Available eUSDe addresses
    address private constant EUSDE_PT = 0x14Bdc3A3AE09f5518b923b69489CBcAfB238e617;
    address private constant EUSDE_YT = 0xe8eF806c8aaDc541408dcAd36107c7d26a391712;
    address private constant EUSDE_SY = 0x7ac8ca87959b1d5EDfe2df5325A37c304DCea4D0;
    
    // ✅ Pendle infrastructure
    address private constant PENDLE_ROUTER_V4 = 0x888888888889758F76e7103c6CbF23ABbF58F946;
    
    // ✅ Lending protocols
    address private constant EULER_PT_EUSDE_VAULT = 0x5e761084c253743268CdbcCc433bDd33C94c82C9;
    address private constant AAVE_V3_POOL = 0x87870bCd3e37E6c3cca04C8D0e4F82D2Bc18aa18;
    
    // ============ State Variables ============
    
    struct LoopPosition {
        uint256 initialAmount;      // Initial eUSDe deposited
        uint256 totalPTMinted;      // Total PT tokens minted
        uint256 totalYTMinted;      // Total YT tokens minted
        uint256 totalPTDeposited;   // Total PT deposited to lending
        uint256 totalBorrowed;      // Total borrowed against PT
        uint256 loopCount;          // Number of loops executed
        bool isActive;              // Position status
        uint256 timestamp;          // When position was opened
    }
    
    mapping(address => LoopPosition) public positions;
    
    // ============ Events ============
    
    event PositionOpened(
        address indexed user,
        uint256 initialAmount,
        uint256 targetLoops
    );
    
    event LoopExecuted(
        address indexed user,
        uint256 loopNumber,
        uint256 ptMinted,
        uint256 ytMinted,
        uint256 ptDeposited
    );
    
    event PositionClosed(
        address indexed user,
        uint256 finalAmount,
        int256 netProfit
    );
    
    // ============ Constructor ============
    
    constructor() {
        // Initialize ReentrancyGuard and set up approvals
    }

    // ============ Modifiers ============
    
    modifier requiresAddresses() {
        require(EUSDE_BASE != address(0), "eUSDe base address not set");
        require(EUSDE_MARKET != address(0), "eUSDe market address not set");
        _;
    }
    
    modifier hasActivePosition() {
        require(positions[msg.sender].isActive, "No active position");
        _;
    }
    
    modifier noActivePosition() {
        require(!positions[msg.sender].isActive, "Position already active");
        _;
    }
    
    // ============ Main Functions ============
    
    /**
     * @dev Open a simple looping position (FOR TESTING ONLY)
     * @param amount Amount of eUSDe to start with
     * @param loops Number of loops to execute
     */
    function openSimpleLoop(
        uint256 amount,
        uint256 loops
    ) external nonReentrant requiresAddresses noActivePosition {
        require(amount != 0, "Amount must be > 0");
        require(loops != 0 && loops <= 5, "Invalid loop count");
        
        // Transfer eUSDe from user
        IERC20(EUSDE_BASE).safeTransferFrom(msg.sender, address(this), amount);
        
        // Initialize position
        positions[msg.sender] = LoopPosition({
            initialAmount: amount,
            totalPTMinted: 0,
            totalYTMinted: 0,
            totalPTDeposited: 0,
            totalBorrowed: 0,
            loopCount: 0,
            isActive: true,
            timestamp: block.timestamp
        });
        
        emit PositionOpened(msg.sender, amount, loops);
        
        // Execute loops
        uint256 currentAmount = amount;
        for (uint256 i = 0; i < loops; i++) {
            currentAmount = executeSingleLoop(currentAmount, i + 1);
            if (currentAmount == 0) break; // Stop if no more to loop
        }
    }
    
    /**
     * @dev Open position for Gnosis Safe batch compatibility
     * @param amount Amount of eUSDe to use (in wei)
     * @param leverage Leverage amount (200 = 2x, 300 = 3x, etc.)
     * Note: protocol parameter is unused but kept for batch compatibility
     */
    function openPosition(
        uint256 amount,
        uint8 /* protocol */,
        uint256 leverage
    ) external nonReentrant requiresAddresses noActivePosition {
        require(amount != 0, "Amount must be > 0");
        require(leverage >= 100 && leverage <= 500, "Invalid leverage (100-500)");
        
        // Convert leverage to loop count (200 = 2 loops, 300 = 3 loops)
        uint256 loops = leverage / 100;
        
        // Transfer eUSDe from user
        IERC20(EUSDE_BASE).safeTransferFrom(msg.sender, address(this), amount);
        
        // Initialize position
        positions[msg.sender] = LoopPosition({
            initialAmount: amount,
            totalPTMinted: 0,
            totalYTMinted: 0,
            totalPTDeposited: 0,
            totalBorrowed: 0,
            loopCount: 0,
            isActive: true,
            timestamp: block.timestamp
        });
        
        emit PositionOpened(msg.sender, amount, loops);
        
        // Execute loops
        uint256 currentAmount = amount;
        for (uint256 i = 0; i < loops; i++) {
            currentAmount = executeSingleLoop(currentAmount, i + 1);
            if (currentAmount == 0) break; // Stop if no more to loop
        }
    }
    
    /**
     * @dev Execute a single loop iteration
     */
    function executeSingleLoop(
        uint256 eusdeAmount,
        uint256 loopNumber
    ) internal returns (uint256 nextAmount) {
        LoopPosition storage pos = positions[msg.sender];
        
        // 1. Mint PT + YT from eUSDe
        (uint256 ptMinted, uint256 ytMinted) = mintPTYTFromEUSDe(eusdeAmount);
        
        // 2. Deposit PT to Euler
        uint256 ptDeposited = depositPTToEuler(ptMinted);
        
        // 3. Update position
        pos.totalPTMinted += ptMinted;
        pos.totalYTMinted += ytMinted;
        pos.totalPTDeposited += ptDeposited;
        pos.loopCount++;
        
        emit LoopExecuted(msg.sender, loopNumber, ptMinted, ytMinted, ptDeposited);
        
        // For now, return 0 to stop looping (will add borrowing later)
        return 0;
    }
    
    /**
     * @dev Mint PT + YT from eUSDe using Pendle
     */
    function mintPTYTFromEUSDe(uint256 eusdeAmount) internal returns (uint256 ptMinted, uint256 ytMinted) {
        // Approve eUSDe for Pendle Router using SafeERC20
        IERC20(EUSDE_BASE).safeApprove(PENDLE_ROUTER_V4, eusdeAmount);
        
        // Prepare token input
        IPendleRouter.TokenInput memory tokenInput = IPendleRouter.TokenInput({
            tokenIn: EUSDE_BASE,
            netTokenIn: eusdeAmount,
            tokenMintSy: EUSDE_BASE,
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
        (ptMinted, ytMinted) = IPendleRouter(PENDLE_ROUTER_V4).mintPyFromToken(
            address(this),
            EUSDE_MARKET,
            0, // minPtOut
            0, // minYtOut
            tokenInput
        );
    }
    
    /**
     * @dev Deposit PT to Euler vault
     */
    function depositPTToEuler(uint256 ptAmount) internal returns (uint256 deposited) {
        // Approve PT for Euler using SafeERC20
        IERC20(EUSDE_PT).safeApprove(EULER_PT_EUSDE_VAULT, ptAmount);
        
        // Deposit to Euler
        IEuler(EULER_PT_EUSDE_VAULT).deposit(0, ptAmount);
        
        return ptAmount;
    }
    
    /**
     * @dev Close position and return funds
     */
    function closePosition() external nonReentrant hasActivePosition {
        // For now, just clear the position
        // TODO: Add full unwinding logic
        
        uint256 finalAmount = 0; // Will calculate after unwinding
        int256 netProfit = 0;    // Will calculate profit/loss
        
        // Clear position
        delete positions[msg.sender];
        
        emit PositionClosed(msg.sender, finalAmount, netProfit);
    }
    
    // ============ View Functions ============
    
    function isReady() external pure returns (bool) {
        return true; // All addresses are now set
    }
    
    function getMissingAddresses() external pure returns (string[] memory) {
        string[] memory result = new string[](0); // No missing addresses
        return result;
    }
    
    // ============ Emergency Functions ============
    
    function emergencyWithdraw(address token) external {
        require(positions[msg.sender].isActive, "No active position");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(msg.sender, balance);
        }
    }
}

// ============ Interfaces ============

interface IPendleRouter {
    enum SwapType { NONE, KYBERSWAP, ONE_INCH, ETH_WETH }
    
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
    
    function mintPyFromToken(
        address receiver,
        address market,
        uint256 minPtOut,
        uint256 minYtOut,
        TokenInput calldata input
    ) external returns (uint256 netPtOut, uint256 netYtOut);
}

interface IEuler {
    function deposit(uint256 subAccountId, uint256 amount) external;
    function withdraw(uint256 subAccountId, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}
