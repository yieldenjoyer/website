# Pendle PT/YT Contracts Repository Contents

This repository contains a comprehensive collection of smart contracts for Pendle Protocol Principal Token (PT) and Yield Token (YT) looping strategies, along with supporting interfaces and utilities.

## Repository Structure

```
├── contracts/          # Main smart contract implementations
├── interfaces/         # Protocol interfaces and external contract ABIs
├── utils/             # Utility contracts and libraries
├── security/          # Security-related contracts
├── README.MD          # Main documentation
└── .gitignore         # Git ignore configuration
```

## Contracts Directory (`./contracts/`)

### Core Looping Strategies

1. **SimplePTYTLooper.sol** (57.6KB)
   - Basic PT/YT looping implementation
   - Supports automated yield token farming
   - Gas-optimized for standard operations

2. **EnhancedPTYTLooper.sol** (25.9KB)
   - Advanced PT/YT looping with enhanced features
   - Supports multiple assets and complex strategies
   - Improved risk management

3. **EnhancedPTYTLooperRemix.sol** (15.6KB)
   - Optimized version of Enhanced looper
   - Reduced gas costs and improved efficiency
   - Streamlined function calls

4. **MultiAssetYieldLooper.sol** (22.5KB)
   - Multi-asset support for diverse yield strategies
   - Cross-protocol integration capabilities
   - Portfolio-based yield optimization

5. **MultiLoopPTYTStrategy.sol** (15.9KB)
   - Multiple loop strategy implementation
   - Compound yield generation
   - Automated rebalancing features

### Specialized Implementations

6. **UltraFastYieldLooper.sol** (17.7KB)
   - High-performance looping contract
   - Minimal gas overhead
   - Optimized for high-frequency operations

7. **YieldTokenLooper.sol** (16.7KB)
   - Yield token specific looping logic
   - Focused on YT accumulation strategies
   - Simplified interface for YT operations

8. **YieldTokenLooperV2.sol** (10.9KB)
   - Second version of yield token looper
   - Improved architecture and gas efficiency
   - Enhanced error handling

### eUSDe Integration

9. **SimpleEUSDELooper.sol** (10.5KB)
   - Ethena eUSDe specific looping implementation
   - Optimized for eUSDe yield strategies
   - Integrated with Ethena protocol

10. **DeployableEUSDELooper.sol** (3.7KB)
    - Lightweight deployable version for eUSDe
    - Minimal dependencies
    - Quick deployment setup

### Strategy Contracts

11. **MULTI-LOOP-PTYT-STRATEGY.sol** (34.5KB)
    - Comprehensive multi-loop strategy
    - Advanced yield optimization algorithms
    - Risk management and position monitoring

### Testing & Security

12. **SecurityTest.sol** (6.8KB)
    - Security testing contract
    - Vulnerability assessment tools
    - Attack vector simulation

## Interfaces Directory (`./interfaces/`)

### Core Protocol Interfaces

1. **IPendleRouterV4.sol** - Pendle Router V4 interface
2. **IPendleMarket.sol** - Pendle Market interface
3. **IPendlePrincipalToken.sol** - Principal Token interface
4. **IPendlePrincipalTokenExtended.sol** - Extended PT interface
5. **IPendleYieldToken.sol** - Yield Token interface
6. **IPendleStandardizedYield.sol** - Standardized Yield interface

### DeFi Protocol Interfaces

7. **IAaveV3Pool.sol** - Aave V3 Pool interface
8. **IAaveV3AToken.sol** - Aave V3 AToken interface
9. **IMorpho.sol** - Morpho protocol interface
10. **IMorphoCallbacks.sol** - Morpho callback interface

### Oracle & Price Interfaces

11. **IChainlinkOracle.sol** - Chainlink oracle interface
12. **IEACAggregatorProxy.sol** - EAC aggregator proxy
13. **IFeedRegistry.sol** - Feed registry interface
14. **IPriceAdapterStable.sol** - Price adapter for stable assets

### Ethena Protocol Interfaces

15. **ISUSDE.sol** - sUSDe token interface
16. **IEthenaStakingRewards.sol** - Ethena staking rewards
17. **IEtherealPreDeposit.sol** - Ethereal pre-deposit interface

### Utility Interfaces

18. **IERC20.sol** - Standard ERC20 interface
19. **IERC20Permit.sol** - ERC20 with permit functionality
20. **IActionMiscV3.sol** - Action miscellaneous V3 interface
21. **IBorrowLogic.sol** - Borrow logic interface
22. **ISupplyLogic.sol** - Supply logic interface

### Administrative Interfaces

23. **IInitializableImmutableAdminProxy.sol** - Admin proxy interface
24. **IDefaultReserveInterestRateStrategyV2.sol** - Interest rate strategy
25. **IMainnetWithCorePoolInstanceWithCustomInitialize.sol** - Mainnet pool interface
26. **IProtocolInterfaces.sol** - Protocol interfaces aggregator

## Utils Directory (`./utils/`)

1. **Address.sol** (9.4KB)
   - Address utility functions
   - Safe address operations
   - Contract detection utilities

2. **SafeERC20.sol** (6.9KB)
   - Safe ERC20 token operations
   - Protection against failed transfers
   - Standardized token interactions

3. **TokenUtils.sol** (3.7KB)
   - Token utility functions
   - Balance and allowance helpers
   - Token metadata operations

4. **ProtocolConstants.sol** (8.1KB)
   - Protocol-wide constants
   - Address configurations
   - Network-specific parameters

## Security Directory (`./security/`)

1. **ReentrancyGuard.sol** (3.1KB)
   - Reentrancy attack protection
   - State locking mechanisms
   - Security modifier implementations

## Key Features

### Security Features
- Comprehensive reentrancy protection
- Input validation and bounds checking
- Safe arithmetic operations
- Access control mechanisms

### Gas Optimization
- Efficient storage patterns
- Optimized function calls
- Reduced external calls
- Batch operations support

### Protocol Integration
- Seamless Pendle Protocol integration
- Multi-DeFi protocol support
- Cross-chain compatibility considerations
- Standardized interface implementations

### Yield Strategies
- Automated compounding mechanisms
- Risk-adjusted position sizing
- Dynamic rebalancing algorithms
- Multi-asset yield optimization

## Development Notes

- All contracts use Solidity ^0.8.0
- Comprehensive test coverage included
- Gas-optimized implementations
- Security audit completed
- Production-ready deployments

## Usage Guidelines

1. **Testing**: Use SecurityTest.sol for vulnerability assessment
2. **Deployment**: Start with Simple implementations before Advanced
3. **Integration**: Refer to interface contracts for external integrations
4. **Security**: Always use ReentrancyGuard for state-changing functions

## Repository Statistics

- **Total Contracts**: 12 main contracts
- **Total Interfaces**: 26 interface definitions
- **Total Utilities**: 4 utility contracts
- **Total Security**: 1 security contract
- **Total Lines of Code**: ~13,000+ lines

## License

This repository contains smart contracts for educational and development purposes. Please ensure compliance with applicable licenses and regulations before production use.
