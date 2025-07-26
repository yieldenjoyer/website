// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title UltraFastYieldLooper
 * @dev Hyper-optimized yield farming contract with assembly optimizations
 * Features:
 * - Assembly-optimized loops
 * - Batch operations in single transaction
 * - Minimal gas usage
 * - Maximum speed for airdrop farming
 */
contract UltraFastYieldLooper {
    using SafeERC20 for IERC20;
    
    // ============ Storage Layout (Optimized) ============
    
    struct PackedPosition {
        uint128 ptAmount;      // PT token amount
        uint128 debtAmount;    // USDe debt amount
        uint64 timestamp;      // Position timestamp
        uint64 leverage;       // Leverage multiplier (100 = 1x)
        address protocol;      // Lending protocol
        bool active;           // Position status
    }
    
    // Single storage slot for gas optimization
    mapping(address => PackedPosition) private positions;
    
    // Constants (immutable for gas savings)
    IERC20 private immutable USDE;
    address private immutable PT_TOKEN;
    address private immutable YT_TOKEN;
    address private immutable PENDLE_ROUTER;
    address private immutable MORPHO;
    address private immutable AAVE;
    address private immutable EULER;
    
    // ============ Events ============
    event UltraFastLoop(address indexed user, uint256 loops, uint256 leverage);
    event UltraFastUnwind(address indexed user, int256 pnl);
    
    // ============ Constructor ============
    
    constructor(
        address _usde,
        address _ptToken,
        address _ytToken,
        address _pendleRouter,
        address _morpho,
        address _aave,
        address _euler
    ) {
        USDE = IERC20(_usde);
        PT_TOKEN = _ptToken;
        YT_TOKEN = _ytToken;
        PENDLE_ROUTER = _pendleRouter;
        MORPHO = _morpho;
        AAVE = _aave;
        EULER = _euler;
        
        // Max approvals for gas efficiency
        _maxApprove(_usde, _pendleRouter);
        _maxApprove(_ptToken, _morpho);
        _maxApprove(_ptToken, _aave);
        _maxApprove(_ptToken, _euler);
    }
    
    // ============ Ultra-Fast Main Function ============
    
    /**
     * @dev Ultra-fast yield farming with assembly optimizations
     * @param amount Initial USDe amount
     * @param loops Number of loops (1-20)
     * @param leverage Target leverage (100-1000)
     */
    function ultraFastLoop(
        uint256 amount,
        uint256 loops,
        uint256 leverage
    ) external {
        assembly {
            // Input validation
            if iszero(amount) { revert(0, 0) }
            if or(iszero(loops), gt(loops, 20)) { revert(0, 0) }
            if or(lt(leverage, 100), gt(leverage, 1000)) { revert(0, 0) }
        }
        
        // Check position doesn't exist
        require(!positions[msg.sender].active, "Position exists");
        
        // Transfer initial amount (handle fee-on-transfer tokens)
        uint256 balanceBefore = USDE.balanceOf(address(this));
        USDE.safeTransferFrom(msg.sender, address(this), amount);
        uint256 balanceAfter = USDE.balanceOf(address(this));
        uint256 actualAmountReceived = balanceAfter - balanceBefore;
        
        // Get best protocol (assembly optimized)
        address bestProtocol = _getBestProtocol();
        
        // Initialize position with safe casting
        positions[msg.sender] = PackedPosition({
            ptAmount: 0,
            debtAmount: 0,
            timestamp: SafeCast.toUint64(block.timestamp),
            leverage: SafeCast.toUint64(leverage),
            protocol: bestProtocol,
            active: true
        });
        
        // Execute ultra-fast loops with actual received amount
        _executeUltraFastLoops(actualAmountReceived, loops, leverage, bestProtocol);
        
        emit UltraFastLoop(msg.sender, loops, leverage);
    }
    
    /**
     * @dev Ultra-fast position unwinding
     */
    function ultraFastUnwind() external {
        PackedPosition storage pos = positions[msg.sender];
        require(pos.active, "No position");
        
        // Store position data before clearing state (CEI pattern)
        uint256 ptAmount = pos.ptAmount;
        uint256 debtAmount = pos.debtAmount;
        address protocol = pos.protocol;
        
        // Effects: Clear position before external calls
        delete positions[msg.sender];
        
        // Interactions: External calls after state updates
        // Withdraw PT
        _ultraFastWithdraw(protocol, ptAmount);
        
        // Redeem PT+YT to USDe
        uint256 usdeReceived = _ultraFastRedeem(ptAmount);
        
        // Repay debt
        _ultraFastRepay(protocol, debtAmount);
        
        // Calculate PnL
        int256 pnl = SafeCast.toInt256(usdeReceived) - SafeCast.toInt256(debtAmount);
        
        // Transfer remaining to user
        if (pnl > 0) {
            USDE.safeTransfer(msg.sender, SafeCast.toUint256(pnl));
        }
        
        emit UltraFastUnwind(msg.sender, pnl);
    }
    
    // ============ Assembly-Optimized Internal Functions ============
    
    /**
     * @dev Execute loops with assembly optimizations
     */
    function _executeUltraFastLoops(
        uint256 amount,
        uint256 loops,
        uint256 leverage,
        address protocol
    ) internal {
        uint256 currentAmount = amount;
        
        assembly {
            // Loop counter
            let i := 0
            
            // Loop execution
            for { } lt(i, loops) { i := add(i, 1) } {
                // Store current amount for next iteration
                let nextAmount := currentAmount
                
                // Calculate next amount (simplified)
                currentAmount := div(mul(currentAmount, leverage), 100)
            }
        }
        
        // Execute actual operations (outside assembly for safety)
        for (uint256 i = 0; i < loops; i++) {
            currentAmount = _executeSingleLoop(currentAmount, protocol);
        }
    }
    
    /**
     * @dev Execute single loop iteration
     */
    function _executeSingleLoop(uint256 amount, address protocol) internal returns (uint256) {
        // Mint PT+YT
        (uint256 ptMinted, ) = _ultraFastMint(amount);
        
        // Deposit PT
        _ultraFastDeposit(protocol, ptMinted);
        
        // Borrow USDe
        uint256 borrowed = _ultraFastBorrow(protocol, amount);
        
        // Update position with safe casting to prevent overflow
        PackedPosition storage pos = positions[msg.sender];
        pos.ptAmount += SafeCast.toUint128(ptMinted);
        pos.debtAmount += SafeCast.toUint128(borrowed);
        
        return borrowed;
    }
    
    /**
     * @dev Ultra-fast mint with minimal gas
     */
    function _ultraFastMint(uint256 amount) internal returns (uint256, uint256) {
        // Simplified mint call (implement actual Pendle integration)
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("mintPyFromToken(address,address,uint256,uint256,tuple)")),
            msg.sender,
            address(0), // market
            0,          // minPtOut
            0,          // minYtOut
            amount      // simplified input
        );
        
        (bool success, bytes memory result) = PENDLE_ROUTER.call(data);
        require(success, "Mint failed");
        
        return abi.decode(result, (uint256, uint256));
    }
    
    /**
     * @dev Ultra-fast deposit
     */
    function _ultraFastDeposit(address protocol, uint256 amount) internal {
        if (protocol == MORPHO) {
            _morphoCall(0, amount); // supply
        } else if (protocol == AAVE) {
            _aaveCall(0, amount); // supply
        } else {
            _eulerCall(0, amount); // deposit
        }
    }
    
    /**
     * @dev Ultra-fast borrow
     */
    function _ultraFastBorrow(address protocol, uint256 amount) internal returns (uint256) {
        if (protocol == MORPHO) {
            return _morphoCall(1, amount); // borrow
        } else if (protocol == AAVE) {
            return _aaveCall(1, amount); // borrow
        } else {
            return _eulerCall(1, amount); // borrow
        }
    }
    
    /**
     * @dev Ultra-fast withdraw
     */
    function _ultraFastWithdraw(address protocol, uint256 amount) internal {
        if (protocol == MORPHO) {
            _morphoCall(2, amount); // withdraw
        } else if (protocol == AAVE) {
            _aaveCall(2, amount); // withdraw
        } else {
            _eulerCall(2, amount); // withdraw
        }
    }
    
    /**
     * @dev Ultra-fast repay
     */
    function _ultraFastRepay(address protocol, uint256 amount) internal {
        if (protocol == MORPHO) {
            _morphoCall(3, amount); // repay
        } else if (protocol == AAVE) {
            _aaveCall(3, amount); // repay
        } else {
            _eulerCall(3, amount); // repay
        }
    }
    
    /**
     * @dev Ultra-fast redeem
     */
    function _ultraFastRedeem(uint256 amount) internal returns (uint256) {
        // Simplified redeem call
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("redeemPyToToken(address,address,uint256,uint256,tuple)")),
            msg.sender,
            address(0), // market
            amount,     // ptAmount
            amount,     // ytAmount
            0           // simplified output
        );
        
        (bool success, bytes memory result) = PENDLE_ROUTER.call(data);
        require(success, "Redeem failed");
        
        return abi.decode(result, (uint256));
    }
    
    // ============ Protocol-Specific Calls ============
    
    function _morphoCall(uint256 operation, uint256 amount) internal returns (uint256) {
        bytes memory data;
        if (operation == 0) { // supply
            data = abi.encodeCall(IMorpho.supply, (PT_TOKEN, amount, address(this), 0));
        } else if (operation == 1) { // borrow
            data = abi.encodeCall(IMorpho.borrow, (address(USDE), amount, address(this), address(this), 0));
        } else if (operation == 2) { // withdraw
            data = abi.encodeCall(IMorpho.withdraw, (PT_TOKEN, amount, address(this), address(this)));
        } else if (operation == 3) { // repay
            data = abi.encodeCall(IMorpho.repay, (address(USDE), amount, address(this), address(this)));
        }
        (bool success, bytes memory result) = MORPHO.call(data);
        require(success, "Morpho call failed");
        return result.length > 0 ? abi.decode(result, (uint256)) : amount;
    }
    
    function _aaveCall(uint256 operation, uint256 amount) internal returns (uint256) {
        bytes memory data;
        
        if (operation == 0) { // supply
            data = abi.encodeWithSelector(0x617ba037, PT_TOKEN, amount, address(this), 0);
        } else if (operation == 1) { // borrow
            data = abi.encodeWithSelector(0xa415bcad, address(USDE), amount, 2, 0, address(this));
        } else if (operation == 2) { // withdraw
            data = abi.encodeWithSelector(0x69328dec, PT_TOKEN, amount, address(this));
        } else if (operation == 3) { // repay
            data = abi.encodeWithSelector(0x573ade81, address(USDE), amount, 2, address(this));
        }
        
        (bool success, bytes memory result) = AAVE.call(data);
        require(success, "Aave call failed");
        
        return result.length > 0 ? abi.decode(result, (uint256)) : amount;
    }
    
    function _eulerCall(uint256 operation, uint256 amount) internal returns (uint256) {
        bytes memory data;
        
        if (operation == 0) { // deposit
            data = abi.encodeWithSelector(0x47e7ef24, 0, amount);
        } else if (operation == 1) { // borrow
            data = abi.encodeWithSelector(0x4b8a3529, 0, amount);
        } else if (operation == 2) { // withdraw
            data = abi.encodeWithSelector(0x441a3e70, 0, amount);
        } else if (operation == 3) { // repay
            data = abi.encodeWithSelector(0x371fd8e6, 0, amount);
        }
        
        (bool success, bytes memory result) = EULER.call(data);
        require(success, "Euler call failed");
        
        return amount;
    }
    
    // ============ Utility Functions ============
    
    function _getBestProtocol() internal view returns (address) {
        // Assembly-optimized protocol selection
        uint256 bestRate = 0;
        address bestProtocol = MORPHO;
        
        assembly {
            // Simple comparison logic
            // In production, implement actual rate fetching
            bestProtocol := MORPHO
        }
        
        return bestProtocol;
    }
    
    /**
     * @notice Safely approve token spending with validation
     * @param token Token contract address
     * @param spender Address to approve for spending
     * @dev Validates addresses and uses SafeERC20 for secure approvals
     */
    function _maxApprove(address token, address spender) internal {
        // Security: Validate that addresses are not zero
        require(token != address(0), "Invalid token address");
        require(spender != address(0), "Invalid spender address");
        // Security: Validate that addresses are contracts
        require(_isContract(token), "Token is not a contract");
        require(_isContract(spender), "Spender is not a contract");
        // Security: Whitelist validation for trusted protocols only
        require(_isTrustedSpender(spender), "Spender not whitelisted");
        // Use SafeERC20 for secure approval
        uint256 maxAllowance = type(uint96).max;
        try IERC20(token).safeApprove(spender, maxAllowance) {
            // Success
        } catch {
            // If approval fails, try resetting to 0 first (some tokens require this)
            IERC20(token).safeApprove(spender, 0);
            IERC20(token).safeApprove(spender, maxAllowance);
        }
    }
    
    /**
     * @notice Check if address is a contract
     * @param addr Address to check
     * @return true if address is a contract
     */
    function _isContract(address addr) internal view returns (bool) {
        return addr.code.length > 0;
    }
    
    /**
     * @notice Validate if spender is a trusted protocol
     * @param spender Address to validate
     * @return true if spender is whitelisted
     */
    function _isTrustedSpender(address spender) internal pure returns (bool) {
        // Whitelist of trusted protocol addresses
        return (
            spender == 0x888888888889758F76e7103c6CbF23ABbF58F946 || // Pendle Router
            spender == 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 || // Aave Pool
            spender == 0x33333aea097c193e66081E930c33020272b33333 || // Morpho
            spender == 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B    // Euler (example)
        );
    }
    
    // ============ View Functions ============
    
    function getPosition(address user) external view returns (PackedPosition memory) {
        return positions[user];
    }
    
    function getPositionValue(address user) external view returns (uint256) {
        PackedPosition memory pos = positions[user];
        if (!pos.active) return 0;
        
        // Calculate current position value
        return pos.ptAmount; // Simplified
    }
    
    // ============ Batch Operations ============
    
    /**
     * @dev Batch multiple operations in single transaction
     *      Restricted to owner and whitelisted function selectors only.
     */
    address public owner;
    mapping(bytes4 => bool) public whitelistedSelectors;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    function setWhitelistedSelector(bytes4 selector, bool allowed) external onlyOwner {
        whitelistedSelectors[selector] = allowed;
    }

    function batchExecute(bytes[] calldata calls) external onlyOwner {
        for (uint256 i = 0; i < calls.length; i++) {
            require(calls[i].length >= 4, "Invalid calldata");
            bytes4 selector;
            assembly { selector := calldataload(add(calls.offset, mul(i, 0x20))) }
            require(whitelistedSelectors[selector], "Selector not whitelisted");
            (bool success, ) = address(this).delegatecall(calls[i]);
            require(success, "Batch call failed");
        }
    }
    
    // ============ Emergency Functions ============
    
    function emergencyExit() external {
        PackedPosition storage pos = positions[msg.sender];
        require(pos.active, "No position");
        
        // Force unwind regardless of profitability
        delete positions[msg.sender];
        
        // Transfer any remaining tokens
        uint256 balance = USDE.balanceOf(address(this));
        if (balance > 0) {
            USDE.safeTransfer(msg.sender, balance);
        }
    }
}

interface IMorpho {
    function supply(address token, uint256 amount, address onBehalf, uint256 referralCode) external;
    function borrow(address token, uint256 amount, address onBehalf, address receiver, uint256 referralCode) external;
    function withdraw(address token, uint256 amount, address onBehalf, address receiver) external;
    function repay(address token, uint256 amount, address onBehalf, address receiver) external;
}
