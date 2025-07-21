# Pendle PT/YT Contracts Repository

A comprehensive collection of smart contracts for Pendle Protocol Principal Token (PT) and Yield Token (YT) looping strategies, with complete interfaces and utility contracts for DeFi yield optimization.

## 🏗️ Repository Structure

```
pendle-pt-yt-contracts/
├── contracts/          # Main smart contract implementations
├── interfaces/         # Protocol interfaces and external contract ABIs
├── utils/             # Utility contracts and libraries  
├── security/          # Security-related contracts
├── CONTENTS.md        # Detailed repository contents guide
└── README.MD          # This documentation
```

## 📋 Quick Overview

This repository contains **43 production-ready Solidity contracts** focused on:

- **Pendle Protocol Integration**: PT/YT looping strategies and yield optimization
- **Multi-Protocol DeFi**: Aave, Morpho, Ethena, and Chainlink integrations  
- **Gas Optimization**: Efficient contracts with minimal overhead
- **Security First**: Comprehensive reentrancy protection and safety measures

## 🔥 Core Contracts

### Primary Looping Strategies
- **`SimplePTYTLooper.sol`** - Basic PT/YT looping implementation (57KB)
- **`EnhancedPTYTLooper.sol`** - Advanced looping with enhanced features (26KB)
- **`MultiAssetYieldLooper.sol`** - Multi-asset yield optimization (23KB)
- **`UltraFastYieldLooper.sol`** - High-performance minimal overhead looper (18KB)

### Ethena eUSDe Integration
- **`SimpleEUSDELooper.sol`** - Ethena eUSDe looping strategies (11KB)
- **`DeployableEUSDELooper.sol`** - Lightweight deployable version (4KB)

### Advanced Strategies
- **`MULTI-LOOP-PTYT-STRATEGY.sol`** - Comprehensive multi-loop implementation (35KB)
- **`YieldTokenLooper.sol`** & **`YieldTokenLooperV2.sol`** - Specialized YT loopers

## 🔧 Key Features

### ⚡ Performance Optimized
- Efficient storage patterns and function calls
- Reduced external calls and gas overhead
- Batch operations support for multiple actions

### 🛡️ Security Hardened
- Comprehensive reentrancy protection via `ReentrancyGuard.sol`
- Input validation and bounds checking on all functions
- Safe arithmetic operations and overflow protection
- Access control mechanisms and proper authorization

### 🔄 Protocol Integration
- **Pendle Protocol**: Full Router V4, Market, PT/YT token support
- **Aave V3**: Pool interactions and aToken integrations
- **Morpho**: Advanced lending protocol callbacks
- **Ethena**: sUSDe and staking rewards integration
- **Chainlink**: Price feed and oracle integrations

## 🚀 Usage Examples

### Basic PT/YT Looping
```solidity
import "./contracts/SimplePTYTLooper.sol";

// Deploy and initialize looper
SimplePTYTLooper looper = new SimplePTYTLooper();
looper.initialize(pendleRouter, market, principalToken);

// Execute looping strategy
looper.executeLoop(amount, loops);
```

### Multi-Asset Strategy
```solidity
import "./contracts/MultiAssetYieldLooper.sol";

MultiAssetYieldLooper strategy = new MultiAssetYieldLooper();
strategy.addAsset(asset1, weight1);
strategy.addAsset(asset2, weight2);
strategy.executeStrategy();
```

## 📁 Directory Details

### `/contracts` (12 files)
Main smart contract implementations for all looping strategies and specialized contracts.

### `/interfaces` (26 files)  
Complete interface definitions for:
- Pendle Protocol (Router, Market, PT/YT tokens)
- DeFi Protocols (Aave, Morpho, Ethena)
- Oracle Services (Chainlink, EAC)
- Standard tokens (ERC20, ERC20Permit)

### `/utils` (4 files)
Essential utility contracts:
- **`SafeERC20.sol`** - Safe token transfer operations
- **`Address.sol`** - Address utility functions  
- **`TokenUtils.sol`** - Token balance and metadata helpers
- **`ProtocolConstants.sol`** - Network configurations and addresses

### `/security` (1 file)
- **`ReentrancyGuard.sol`** - Reentrancy attack protection for all contracts

## 🛠️ Development

### Prerequisites
- Solidity ^0.8.0
- Hardhat or Foundry for compilation
- Node.js for development scripts

### Compilation
```bash
# Using Hardhat
npx hardhat compile

# Using Foundry  
forge build
```

### Testing
```bash
# Run security tests
npx hardhat test --grep "Security"

# Test specific looper
npx hardhat test contracts/SimplePTYTLooper.sol
```

## 📊 Repository Statistics

- **Total Files**: 43 Solidity contracts
- **Total Size**: ~280KB of optimized code
- **Security Contracts**: 1 dedicated security guard
- **Interface Coverage**: 26 external protocol interfaces
- **Utility Libraries**: 4 helper contracts
- **Lines of Code**: 13,000+ lines

## ⚠️ Security Notice

These contracts handle significant financial value and interact with multiple DeFi protocols. Always:

- ✅ Test thoroughly on testnets before mainnet deployment
- ✅ Conduct security audits for production use
- ✅ Use proper access controls and multisig wallets
- ✅ Monitor positions and implement proper risk management
- ❌ Never deploy without understanding the financial risks

## 📝 Documentation

For detailed contract specifications and usage examples, see:
- **[CONTENTS.md](./CONTENTS.md)** - Complete repository contents guide
- **Contract source code** - Comprehensive inline documentation
- **Interface files** - Full function specifications

## 🤝 Contributing

This repository contains production smart contracts. Any contributions should:
1. Include comprehensive tests
2. Follow existing code patterns
3. Add proper documentation
4. Consider security implications

## ⚖️ License

Smart contracts for educational and development purposes. Ensure compliance with applicable licenses and regulations before production deployment.

---

**Repository**: [`github.com/liquiditymax/pendle-pt-yt-contracts`](https://github.com/liquiditymax/pendle-pt-yt-contracts)
