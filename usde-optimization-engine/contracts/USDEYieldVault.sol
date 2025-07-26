// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title USDEYieldVault
 * @dev Automated yield optimization vault for USDe/sUSDe on Converge
 * Aggregates yield opportunities from Strata, Terminal, and Ethereal Finance
 */
contract USDEYieldVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // State variables
    IERC20 public immutable usdeToken;
    IERC20 public immutable susdeToken;
    
    uint256 public totalShares;
    uint256 public totalAssets;
    uint256 public lastRebalance;
    uint256 public performanceFee = 200; // 2%
    uint256 public managementFee = 100; // 1%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant REBALANCE_INTERVAL = 1 days;
    
    address public treasury;
    address public strategist;
    
    enum VaultType { Conservative, Balanced, Aggressive }
    
    struct UserInfo {
        uint256 shares;
        uint256 lastDeposit;
        VaultType vaultType;
    }
    
    struct ProtocolAllocation {
        address protocol;
        uint256 allocation; // percentage in basis points
        uint256 currentBalance;
        bool active;
    }
    
    mapping(address => UserInfo) public userInfo;
    mapping(uint256 => ProtocolAllocation) public protocols;
    uint256 public protocolCount;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 amount);
    event Rebalance(uint256 totalAssetsBefore, uint256 totalAssetsAfter);
    event ProtocolAdded(address protocol, uint256 allocation);
    event ProtocolUpdated(address protocol, uint256 newAllocation);
    event FeesCollected(uint256 performanceFee, uint256 managementFee);
    
    // Modifiers
    modifier onlyStrategist() {
        require(msg.sender == strategist || msg.sender == owner(), "Not strategist");
        _;
    }
    
    constructor(
        address _usdeToken,
        address _susdeToken,
        address _treasury,
        address _strategist
    ) {
        usdeToken = IERC20(_usdeToken);
        susdeToken = IERC20(_susdeToken);
        treasury = _treasury;
        strategist = _strategist;
        lastRebalance = block.timestamp;
    }
    
    /**
     * @dev Deposit USDe tokens to the vault
     * @param amount Amount of USDe to deposit
     * @param vaultType Risk preference for allocation
     */
    function deposit(uint256 amount, VaultType vaultType) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        usdeToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 shares = totalShares == 0 ? amount : (amount * totalShares) / totalAssets;
        
        userInfo[msg.sender].shares += shares;
        userInfo[msg.sender].lastDeposit = block.timestamp;
        userInfo[msg.sender].vaultType = vaultType;
        
        totalShares += shares;
        totalAssets += amount;
        
        emit Deposit(msg.sender, amount, shares);
        
        // Auto-rebalance if needed
        if (shouldRebalance()) {
            _rebalance();
        }
    }
    
    /**
     * @dev Withdraw user's share from the vault
     * @param shares Amount of shares to withdraw
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be > 0");
        require(userInfo[msg.sender].shares >= shares, "Insufficient shares");
        
        uint256 amount = (shares * totalAssets) / totalShares;
        
        userInfo[msg.sender].shares -= shares;
        totalShares -= shares;
        totalAssets -= amount;
        
        // Withdraw from protocols if needed
        _withdrawFromProtocols(amount);
        
        usdeToken.safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, shares, amount);
    }
    
    /**
     * @dev Get user's current balance in USDe
     */
    function getUserBalance(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userInfo[user].shares * totalAssets) / totalShares;
    }
    
    /**
     * @dev Check if rebalancing is needed
     */
    function shouldRebalance() public view returns (bool) {
        return block.timestamp >= lastRebalance + REBALANCE_INTERVAL;
    }
    
    /**
     * @dev Manual rebalance function for strategist
     */
    function rebalance() external onlyStrategist {
        _rebalance();
    }
    
    /**
     * @dev Internal rebalance logic
     */
    function _rebalance() internal {
        uint256 totalAssetsBefore = totalAssets;
        
        // Collect yields from all protocols
        _harvestYields();
        
        // Redistribute based on optimal allocations
        _redistributeAssets();
        
        // Update last rebalance timestamp
        lastRebalance = block.timestamp;
        
        emit Rebalance(totalAssetsBefore, totalAssets);
    }
    
    /**
     * @dev Harvest yields from all active protocols
     */
    function _harvestYields() internal {
        for (uint256 i = 0; i < protocolCount; i++) {
            if (protocols[i].active) {
                // Mock yield harvesting - in real implementation,
                // this would call specific protocol harvest functions
                uint256 yield = protocols[i].currentBalance * 15 / 10000; // 0.15% mock yield
                protocols[i].currentBalance += yield;
                totalAssets += yield;
            }
        }
        
        // Collect fees
        _collectFees();
    }
    
    /**
     * @dev Collect management and performance fees
     */
    function _collectFees() internal {
        uint256 managementFeeAmount = (totalAssets * managementFee) / FEE_DENOMINATOR / 365;
        uint256 performanceFeeAmount = 0; // Calculate based on performance
        
        uint256 totalFees = managementFeeAmount + performanceFeeAmount;
        
        if (totalFees > 0) {
            totalAssets -= totalFees;
            usdeToken.safeTransfer(treasury, totalFees);
            emit FeesCollected(performanceFeeAmount, managementFeeAmount);
        }
    }
    
    /**
     * @dev Redistribute assets based on optimal allocations
     */
    function _redistributeAssets() internal {
        // This would implement the actual rebalancing logic
        // For now, it's a placeholder that maintains current allocations
        
        uint256 availableAssets = usdeToken.balanceOf(address(this));
        
        for (uint256 i = 0; i < protocolCount; i++) {
            if (protocols[i].active) {
                uint256 targetAllocation = (totalAssets * protocols[i].allocation) / FEE_DENOMINATOR;
                uint256 currentAllocation = protocols[i].currentBalance;
                
                if (targetAllocation > currentAllocation && availableAssets > 0) {
                    uint256 amountToAllocate = Math.min(
                        targetAllocation - currentAllocation,
                        availableAssets
                    );
                    
                    protocols[i].currentBalance += amountToAllocate;
                    availableAssets -= amountToAllocate;
                    
                    // In real implementation, deposit to actual protocol
                }
            }
        }
    }
    
    /**
     * @dev Withdraw from protocols to fulfill user withdrawal
     */
    function _withdrawFromProtocols(uint256 amount) internal {
        uint256 availableBalance = usdeToken.balanceOf(address(this));
        
        if (availableBalance >= amount) {
            return; // Sufficient balance available
        }
        
        uint256 needed = amount - availableBalance;
        
        // Withdraw proportionally from protocols
        for (uint256 i = 0; i < protocolCount && needed > 0; i++) {
            if (protocols[i].active && protocols[i].currentBalance > 0) {
                uint256 toWithdraw = Math.min(needed, protocols[i].currentBalance);
                protocols[i].currentBalance -= toWithdraw;
                needed -= toWithdraw;
                
                // In real implementation, withdraw from actual protocol
            }
        }
    }
    
    /**
     * @dev Add a new protocol for yield generation
     */
    function addProtocol(
        address protocol,
        uint256 allocation
    ) external onlyOwner {
        require(protocol != address(0), "Invalid protocol");
        require(allocation > 0 && allocation <= FEE_DENOMINATOR, "Invalid allocation");
        
        protocols[protocolCount] = ProtocolAllocation({
            protocol: protocol,
            allocation: allocation,
            currentBalance: 0,
            active: true
        });
        
        protocolCount++;
        
        emit ProtocolAdded(protocol, allocation);
    }
    
    /**
     * @dev Update protocol allocation
     */
    function updateProtocolAllocation(
        uint256 protocolId,
        uint256 newAllocation
    ) external onlyStrategist {
        require(protocolId < protocolCount, "Invalid protocol ID");
        require(newAllocation <= FEE_DENOMINATOR, "Invalid allocation");
        
        protocols[protocolId].allocation = newAllocation;
        
        emit ProtocolUpdated(protocols[protocolId].protocol, newAllocation);
    }
    
    /**
     * @dev Set performance fee (only owner)
     */
    function setPerformanceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        performanceFee = _fee;
    }
    
    /**
     * @dev Set management fee (only owner)
     */
    function setManagementFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high"); // Max 5%
        managementFee = _fee;
    }
    
    /**
     * @dev Emergency function to pause protocol if needed
     */
    function pauseProtocol(uint256 protocolId) external onlyOwner {
        require(protocolId < protocolCount, "Invalid protocol ID");
        protocols[protocolId].active = false;
    }
    
    /**
     * @dev Emergency withdrawal function (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Get current APY estimate based on protocol yields
     */
    function getCurrentAPY() external view returns (uint256) {
        // Mock APY calculation - in real implementation would query actual protocols
        uint256 weightedAPY = 0;
        uint256 totalAllocation = 0;
        
        for (uint256 i = 0; i < protocolCount; i++) {
            if (protocols[i].active) {
                // Mock protocol APYs: 12%, 16%, 18%, 9%
                uint256 protocolAPY = i == 0 ? 1200 : i == 1 ? 1600 : i == 2 ? 1800 : 900;
                weightedAPY += protocolAPY * protocols[i].allocation;
                totalAllocation += protocols[i].allocation;
            }
        }
        
        return totalAllocation > 0 ? weightedAPY / totalAllocation : 0;
    }
    
    /**
     * @dev Get vault TVL
     */
    function getTVL() external view returns (uint256) {
        return totalAssets;
    }
}
