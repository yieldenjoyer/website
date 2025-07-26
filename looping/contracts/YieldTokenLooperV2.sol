// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./YieldTokenLooper.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title YieldTokenLooperV2
 * @dev Advanced version with flash loans and optimized gas usage
 */
contract YieldTokenLooperV2 is YieldTokenLooper {
    using SafeERC20 for IERC20;
    
    // Flash loan providers
    address private constant AAVE_FLASH_LOAN = 0x87870Bace7f31f0d4C4b4b8A7d1D9891B7E4f7b;
    address private constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    
    // Events
    event FlashLoanExecuted(uint256 amount, uint256 premium);
    event PositionLeveraged(address indexed user, uint256 finalLeverage);
    event BatchOperation(address indexed target, bytes4 selector, uint256 value, bool success);
    
    constructor(
        address _ptToken,
        address _ytToken,
        address _morpho,
        address _aave,
        address _euler
    ) YieldTokenLooper(_ptToken, _ytToken, _morpho, _aave, _euler) {}
    
    /**
     * @dev Opens leveraged position using flash loan for maximum capital efficiency
     */
    function openLeveragedPosition(
        uint256 initialAmount,
        uint256 targetLeverage, // e.g., 300 for 3x leverage
        uint256 maxSlippage
    ) external nonReentrant {
        require(initialAmount != 0, "Invalid amount");
        require(targetLeverage > 100 && targetLeverage <= 1000, "Invalid leverage"); // 1x to 10x
        require(!positions[msg.sender].isActive, "Position already active");
        
        // Calculate flash loan amount needed
        uint256 flashLoanAmount = (initialAmount * (targetLeverage - 100)) / 100;
        
        // Store operation data
        bytes memory params = abi.encode(
            msg.sender,
            initialAmount,
            targetLeverage,
            maxSlippage,
            block.timestamp
        );
        
        // Execute flash loan
        executeFlashLoan(flashLoanAmount, params);
    }
    
    /**
     * @dev Executes flash loan operation
     */
    function executeFlashLoan(uint256 amount, bytes memory params) internal {
        // Use Aave flash loan (lowest fees)
        address[] memory assets = new address[](1);
        assets[0] = address(USDE);
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // No debt
        
        IFlashLoanReceiver(AAVE_FLASH_LOAN).flashLoan(
            assets,
            amounts,
            modes,
            address(this),
            params,
            0
        );
    }
    
    /**
     * @dev Flash loan callback
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata /* premiums */,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == AAVE_FLASH_LOAN, "Invalid caller");
        require(initiator == address(this), "Invalid initiator");
        
        // Decode parameters
        (
            address user,
            uint256 initialAmount,
            uint256 targetLeverage,
            uint256 maxSlippage,
            uint256 timestamp
        ) = abi.decode(params, (address, uint256, uint256, uint256, uint256));
        
        // Transfer user's initial amount
        USDE.safeTransferFrom(user, address(this), initialAmount);
        
        // Total amount to work with
        uint256 totalAmount = initialAmount + amounts[0];
        
        // Execute leveraged farming
        executeLeveragedFarming(user, totalAmount, targetLeverage);
        
        // Repay flash loan
        uint256 repayAmount = amounts[0] + premiums[0];
        USDE.safeTransfer(AAVE_FLASH_LOAN, repayAmount);
        
        emit FlashLoanExecuted(amounts[0], premiums[0]);
        
        return true;
    }
    
    /**
     * @dev Executes the actual leveraged farming logic
     */
    function executeLeveragedFarming(
        address user,
        uint256 totalAmount,
        uint256 targetLeverage
    ) internal {
        // Find best lending protocol
        address bestProtocol = getBestLendingProtocol();
        
        // Initialize position
        positions[user] = Position({
            totalPTDeposited: 0,
            totalUSDeBorrowed: 0,
            loopCount: 0,
            lendingProtocol: bestProtocol,
            isActive: true
        });
        
        // Execute single large mint and deposit
        (uint256 ptMinted, uint256 ytMinted) = mintPTYT(totalAmount);
        
        // Deposit PT to lending protocol
        depositToLendingProtocol(bestProtocol, ptMinted);
        positions[user].totalPTDeposited = ptMinted;
        
        // Calculate borrow amount to achieve target leverage
        uint256 borrowAmount = calculateLeverageBorrow(ptMinted, targetLeverage);
        
        // Borrow USDe
        uint256 actualBorrow = borrowFromLendingProtocol(bestProtocol, borrowAmount);
        positions[user].totalUSDeBorrowed = actualBorrow;
        
        emit PositionLeveraged(user, targetLeverage);
    }
    
    /**
     * @dev Calculates borrow amount for target leverage
     */
    function calculateLeverageBorrow(
        uint256 ptAmount,
        uint256 targetLeverage
    ) internal view returns (uint256) {
        uint256 ptPrice = getPTPrice();
        uint256 totalValue = (ptAmount * ptPrice) / 1e18;
        
        // Calculate required borrow to achieve leverage
        // Formula: borrow = (totalValue * (leverage - 1)) / leverage
        return (totalValue * (targetLeverage - 100)) / targetLeverage;
    }
    
    /**
     * @dev Closes leveraged position with flash loan
     */
    function closeLeveragedPosition() external nonReentrant {
        Position storage pos = positions[msg.sender];
        require(pos.isActive, "No active position");
        
        // Calculate amounts
        uint256 totalPT = pos.totalPTDeposited;
        uint256 totalDebt = pos.totalUSDeBorrowed;
        
        // Use flash loan to repay debt first
        bytes memory params = abi.encode(
            msg.sender,
            totalPT,
            totalDebt,
            block.timestamp
        );
        
        executeFlashLoan(totalDebt, params);
    }
    
    // ============ Gas-optimized batch operations ============
    // Whitelist for allowed targets and selectors
    mapping(address => bool) public whitelistedTargets;
    mapping(bytes4 => bool) public whitelistedSelectors;

    function setWhitelistedTarget(address target, bool allowed) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized access denied");
        require(target != address(0), "Invalid target address");
        whitelistedTargets[target] = allowed;
    }
    function setWhitelistedSelector(bytes4 selector, bool allowed) external onlyOwner {
        require(msg.sender == owner(), "Unauthorized access denied");
        require(selector != bytes4(0), "Invalid selector");
        whitelistedSelectors[selector] = allowed;
    }

    function batchOperations(
        address[] calldata targets,
        bytes[] calldata calldatas,
        uint256[] calldata values
    ) external payable onlyOwner {
        require(msg.sender == owner(), "Unauthorized batch operation");
        require(targets.length == calldatas.length, "Length mismatch");
        require(targets.length == values.length, "Length mismatch");
        for (uint256 i = 0; i < targets.length; i++) {
            require(whitelistedTargets[targets[i]], "Target not whitelisted");
            require(calldatas[i].length >= 4, "Invalid calldata");
            bytes4 selector;
            assembly { selector := calldataload(add(calldatas.offset, mul(i, 0x20))) }
            require(whitelistedSelectors[selector], "Selector not whitelisted");
            (bool success, bytes memory result) = targets[i].call{value: values[i]}(calldatas[i]);
            emit BatchOperation(targets[i], selector, values[i], success);
            require(success, string(result));
        }
    }
    
    /**
     * @dev Emergency exit with flash loan
     */
    function emergencyExitWithFlashLoan() external {
        Position storage pos = positions[msg.sender];
        require(pos.isActive, "No active position");
        
        // Force close position regardless of profitability
        closeLeveragedPosition();
        
        // Additional safety measures
        delete positions[msg.sender];
    }
    
    /**
     * @dev View function to simulate position profitability
     */
    function simulatePosition(
        uint256 initialAmount,
        uint256 targetLeverage,
        uint256 holdingPeriod
    ) external view returns (
        uint256 projectedYield,
        uint256 borrowCost,
        int256 netProfit,
        uint256 roi
    ) {
        // Calculate projected yields
        uint256 ptPrice = getPTPrice();
        uint256 totalValue = (initialAmount * targetLeverage) / 100;
        
        // Get current rates
        address bestProtocol = getBestLendingProtocol();
        uint256 supplyRate = getProtocolSupplyRate(bestProtocol);
        uint256 borrowRate = getProtocolBorrowRate(bestProtocol);
        
        // Calculate projected returns
        projectedYield = (totalValue * supplyRate * holdingPeriod) / (365 days * 1e18);
        borrowCost = (totalValue * borrowRate * holdingPeriod) / (365 days * 1e18);
        
        netProfit = SafeCast.toInt256(projectedYield) - SafeCast.toInt256(borrowCost);
        roi = netProfit > 0 ? (SafeCast.toUint256(netProfit) * 10000) / initialAmount : 0;
    }
    
    /**
     * @dev Get protocol borrow rate
     */
    function getProtocolBorrowRate(address protocol) public view returns (uint256) {
        if (protocol == MORPHO_POOL) {
            return morpho.borrowRate(address(USDE));
        } else if (protocol == AAVE_POOL) {
            return aave.getReserveData(address(USDE)).currentVariableBorrowRate;
        } else if (protocol == EULER_POOL) {
            return euler.borrowRate(0);
        }
        return 0;
    }
    
    /**
     * @dev Get protocol supply rate
     */
    function getProtocolSupplyRate(address protocol) public view returns (uint256) {
        if (protocol == MORPHO_POOL) {
            return morpho.supplyRate(PT_TOKEN);
        } else if (protocol == AAVE_POOL) {
            return aave.getReserveData(PT_TOKEN).currentLiquidityRate;
        } else if (protocol == EULER_POOL) {
            return euler.supplyRate(0);
        }
        return 0;
    }
}

// Additional interfaces
interface IFlashLoanReceiver {
    function flashLoan(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IMorphoExtended is IMorpho {
    function borrowRate(address asset) external view returns (uint256);
}

interface IEulerExtended is IEuler {
    function borrowRate(uint256 subAccountId) external view returns (uint256);
}
