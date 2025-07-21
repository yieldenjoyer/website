// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DeployableEUSDELooper
 * @dev Simple, deployable eUSDe looper for Gnosis Safe batch transactions
 * @custom:dev-run-script ./scripts/deploy.js
 */
contract DeployableEUSDELooper is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Constants ============
    
    IERC20 private constant EUSDE = IERC20(0x90D2af7d622ca3141efA4d8f1F24d86E5974Cc8F);
    
    // ============ State Variables ============
    
    struct Position {
        uint256 amount;
        uint256 leverage;
        bool isActive;
        uint256 timestamp;
    }
    
    mapping(address => Position) public positions;
    
    // ============ Events ============
    
    event PositionOpened(address indexed user, uint256 amount, uint256 leverage);
    event PositionClosed(address indexed user, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() {
        // Contract is ready to deploy
    }
    
    // ============ Main Functions ============
    
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
    ) external nonReentrant {
        require(amount != 0, "Amount must be > 0");
        require(leverage >= 100 && leverage <= 500, "Invalid leverage");
        require(!positions[msg.sender].isActive, "Position already active");
        
        // Transfer eUSDe from user
        EUSDE.safeTransferFrom(msg.sender, address(this), amount);
        
        // Store position
        positions[msg.sender] = Position({
            amount: amount,
            leverage: leverage,
            isActive: true,
            timestamp: block.timestamp
        });
        
        emit PositionOpened(msg.sender, amount, leverage);
        
        // For now, just hold the tokens (mock looping)
        // In a real implementation, this would:
        // 1. Mint PT/YT from eUSDe
        // 2. Deposit PT to Euler
        // 3. Borrow more eUSDe
        // 4. Loop for desired leverage
    }
    
    /**
     * @dev Close position and return funds
     */
    function closePosition() external nonReentrant {
        require(positions[msg.sender].isActive, "No active position");
        
        Position storage pos = positions[msg.sender];
        uint256 amount = pos.amount;
        
        // Clear position first (reentrancy protection)
        delete positions[msg.sender];
        
        // Return eUSDe to user
        EUSDE.safeTransfer(msg.sender, amount);
        
        emit PositionClosed(msg.sender, amount);
    }
    
    // ============ View Functions ============
    
    function contractBalance() external view returns (uint256) {
        return EUSDE.balanceOf(address(this));
    }
    
    // ============ Emergency Functions ============
    
    function emergencyWithdraw() external {
        require(positions[msg.sender].isActive, "No active position");
        
        Position storage pos = positions[msg.sender];
        uint256 amount = pos.amount;
        
        // Clear position
        delete positions[msg.sender];
        
        // Return funds
        EUSDE.safeTransfer(msg.sender, amount);
    }
}
