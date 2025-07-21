// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimplePTYTLooper.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Security Test Contract
 * @notice Test contract to demonstrate security features of SimplePTYTLooper
 */
contract SecurityTest is ReentrancyGuard {
    SimplePTYTLooper public looper;
    MockToken public mockToken;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        looper = new SimplePTYTLooper();
        mockToken = new MockToken("Mock Token", "MOCK", 18);
    }
    
    /**
     * @notice Test contract validation registry
     */
    function testContractValidation() external {
        require(msg.sender == owner, "Only owner");
        
        // Test SY contract validation
        address mockSY = address(new MockSY());
        
        // Should fail - contract not validated
        try this.testMintSyFromToken(mockSY) {
            revert("Should have failed - contract not validated");
        } catch {
            // Expected failure
        }
        
        // Add to validation registry
        looper.setValidatedSY(mockSY, true);
        
        // Should work now
        this.testMintSyFromToken(mockSY);
    }
    
    /**
     * @notice Test function pausing
     */
    function testFunctionPausing() external {
        require(msg.sender == owner, "Only owner");
        
        // Setup validated contracts
        address mockSY = address(new MockSY());
        looper.setValidatedSY(mockSY, true);
        
        // Should work normally
        this.testMintSyFromToken(mockSY);
        
        // Pause the function
        bytes4 selector = bytes4(keccak256("_mintSyFromToken(address,address,uint256,address)"));
        looper.setFunctionPaused(selector, true);
        
        // Should fail - function paused
        try this.testMintSyFromToken(mockSY) {
            revert("Should have failed - function paused");
        } catch {
            // Expected failure
        }
        
        // Unpause the function
        looper.setFunctionPaused(selector, false);
        
        // Should work again
        this.testMintSyFromToken(mockSY);
    }
    
    /**
     * @notice Test balance validation
     */
    function testBalanceValidation() external {
        require(msg.sender == owner, "Only owner");
        
        // Setup validated contracts
        address mockSY = address(new MockSY());
        looper.setValidatedSY(mockSY, true);
        
        // Should fail - insufficient balance
        try this.testMintSyFromTokenWithAmount(mockSY, 1000 ether) {
            revert("Should have failed - insufficient balance");
        } catch {
            // Expected failure
        }
    }
    
    /**
     * @notice Internal test function for SY minting
     */
    function testMintSyFromToken(address syAddress) external {
        // This would call the protected internal function
        // In a real scenario, this would be called through the main contract functions
        // that have proper access controls
    }
    
    /**
     * @notice Internal test function for SY minting with specific amount
     */
    function testMintSyFromTokenWithAmount(address syAddress, uint256 amount) external {
        // This would call the protected internal function with a specific amount
        // to test balance validation
    }
    
    /**
     * @notice Test emergency pause functionality
     * @dev Protected against reentrancy attacks with nonReentrant modifier
     */
    function testEmergencyPause() external nonReentrant {
        require(msg.sender == owner, "Only owner");
        
        // Checks: Validate initial state
        bool initialPauseState = looper.paused();
        
        // Effects: No state changes needed here
        
        // Interactions: External calls after all checks and effects
        looper.pauseStrategy();
        
        // Verify pause state changed
        require(looper.paused(), "Contract should be paused");
        
        // All functions should fail when paused
        try looper.openPosition(1 ether, 0.5 ether, 3, 0, 0) {
            revert("Should have failed - contract paused");
        } catch {
            // Expected failure
        }
        
        // Unpause the contract (Interactions)
        looper.unpauseStrategy();
        
        // Verify pause state restored
        require(!looper.paused(), "Contract should be unpaused");
        
        // Functions should work again (with proper setup)
    }
    
    /**
     * @notice Test security status view functions
     */
    function testSecurityStatusViews() external view returns (
        bool syValidated,
        bool swapValidated,
        bool functionPaused
    ) {
        address mockSY = address(0x123);
        address mockSwap = address(0x456);
        bytes4 selector = bytes4(keccak256("_mintSyFromToken(address,address,uint256,address)"));
        
        syValidated = looper.isValidatedSY(mockSY);
        swapValidated = looper.isValidatedSwapAggregator(mockSwap);
        functionPaused = looper.isFunctionPaused(selector);
    }
    
    /**
     * @notice Test batch validation operations
     */
    function testBatchValidation() external {
        require(msg.sender == owner, "Only owner");
        
        address[] memory syAddresses = new address[](3);
        bool[] memory validStates = new bool[](3);
        
        syAddresses[0] = address(new MockSY());
        syAddresses[1] = address(new MockSY());
        syAddresses[2] = address(new MockSY());
        
        validStates[0] = true;
        validStates[1] = true;
        validStates[2] = false;
        
        // Batch validate SY contracts
        looper.batchSetValidatedSY(syAddresses, validStates);
        
        // Verify states
        require(looper.isValidatedSY(syAddresses[0]), "SY 0 should be validated");
        require(looper.isValidatedSY(syAddresses[1]), "SY 1 should be validated");
        require(!looper.isValidatedSY(syAddresses[2]), "SY 2 should not be validated");
    }
}

/**
 * @title Mock Token for Testing
 */
contract MockToken is ERC20 {
    address public owner;
    
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) {
        owner = msg.sender;
        _mint(msg.sender, 1000000 * 10**decimals);
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        _mint(to, amount);
    }
}

/**
 * @title Mock SY Contract for Testing
 */
contract MockSY is ERC20 {
    constructor() ERC20("Mock SY", "MSY") {}
    
    function deposit(address recipient, address /* tokenIn */, uint256 amountIn, uint256 /* minAmountOut */) external returns (uint256) {
        require(msg.sender != address(0), "Unauthorized caller");
        require(recipient != address(0), "Invalid recipient");
        require(amountIn > 0, "Invalid amount");
        require(msg.sender != address(0), "Invalid sender");
        
        uint256 amountOut = amountIn * 98 / 100;
        _mint(recipient, amountOut);
        return amountOut;
    }
    
    function redeem(address recipient, uint256 amountSyToRedeem, address /* tokenOut */, uint256 /* minAmountOut */, bool /* burnFromInternalBalance */) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amountSyToRedeem > 0, "Invalid redeem amount");
        require(balanceOf(msg.sender) >= amountSyToRedeem, "Insufficient balance");
        
        uint256 amountOut = amountSyToRedeem * 98 / 100;
        _burn(msg.sender, amountSyToRedeem);
        return amountOut;
    }
}

/**
 * @title Mock Swap Aggregator for Testing
 */
contract MockSwapAggregator {
    function swap(address /* tokenIn */, uint256 amountIn, bytes calldata /* swapData */) external returns (uint256) {
        // Mock swap logic
        return amountIn * 99 / 100;
    }
}
