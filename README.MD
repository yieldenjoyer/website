# Pendle PT/YT Contracts 

Collection of smart contracts for Pendle Protocol Principal Token (PT) and Yield Token (YT) looping strategies.

## Structure

```
├── contracts/          # Main contract implementations
├── interfaces/         # Protocol interfaces 
├── utils/             # Utility contracts
├── security/          # Security contracts
└── CONTENTS.md        # Contents guide
```

## Overview

This repo has 43 Solidity contracts for:

- Pendle Protocol PT/YT looping 
- Multi-protocol DeFi integrations (Aave, Morpho, Ethena, Chainlink)
- Gas optimized implementations
- Security features and reentrancy protection
- Created to take a flashloan, mint PY (PT+YT) coins on pendle, send the PT to aave, euler or morpho, take a loan, loop it multiple times up to max LTV/Etc in one TX.

# Purpose
- flash loan from morpho -> pendle mint PT+YT(py token),-> aave/euler/morpho (plans to add silo), -> take max LTV on the PT, back to pendle to mint PT+YT, repeat.

# Warning - these involve highly complex smart contract interactions. Make sure to use on testnet first to verify before trying with real money. Despite having multiple audits via zan.top, there is still the possibility of a vulnerability.

### Looping Strategies
- `SimplePTYTLooper.sol` - Basic PT/YT looping (57KB)
- `EnhancedPTYTLooper.sol` - Advanced looping (26KB) 
- `MultiAssetYieldLooper.sol` - Multi-asset yield optimization (23KB)
- `UltraFastYieldLooper.sol` - Fast looper (18KB)

### Ethena Integration
- `SimpleEUSDELooper.sol` - eUSDe looping 
- `DeployableEUSDELooper.sol` - Lightweight version 
- `SimpleEUSDELooperv2.sol` - incomplete, use first(non v2) if compiling to create a contract).


### Other
- `MULTI-LOOP-PTYT-STRATEGY.sol` - Multi-loop implementation 
- `YieldTokenLooper.sol` & `YieldTokenLooperV2.sol` - YT loopers

## Features

- Gas optimized storage and function calls
- Reentrancy protection via `ReentrancyGuard.sol`
- Input validation and bounds checking
- Safe arithmetic and access controls

## Protocol Integrations

- **Pendle**: Router V4, Market, PT/YT/SY tokens
- **Aave V3**: Pool and aToken interactions  
- **Morpho**: Lending protocol callbacks and flashloans
- **Ethena**: USDe, Eusde, Susde
- **Chainlink**: Price feeds and oracles
- **Euler**: Lending PT & Looping

## Current config is for Ethena's USDe and Ethereal's Eusde mainly with plans to add more coins in the future that will be loopable.



## Usage

```solidity
// Basic PT/YT looping
SimplePTYTLooper looper = new SimplePTYTLooper();
looper.initialize(pendleRouter, market, principalToken);
looper.executeLoop(amount, loops);
```

## Directories

- `/contracts` (12 files) - Main implementations
- `/interfaces` (26 files) - Protocol interfaces for Pendle, Aave, Morpho, etc.
- `/utils` (4 files) - `SafeERC20.sol`, `Address.sol`, `TokenUtils.sol`, `ProtocolConstants.sol`
- `/security` (1 file) - `ReentrancyGuard.sol`

## Development

Requirements: Solidity ^0.8.0, Hardhat/Foundry

```bash
# Compile
npx hardhat compile
# or
forge build

# Test
npx hardhat test
```

## Stats

43 Solidity contracts, ~280KB total, 13k+ lines of code

## Security Warning

These contracts handle real money. Test thoroughly, get audits, use multisigs.

## These contract were developed to be used mainly with Ethena's USDe and Ethereal.trade's Eusde but are open to exploring all other options this could be useful for!


## Docs

See [CONTENTS.md](./CONTENTS.md) for detailed info.


## Development Notes
Some parts of this project were developed with AI assistance for rapid prototyping and security enhancements. All contracts require thorough testing and security review before mainnet deployment.



## Contributing

Contributions welcome! Areas needing help:
- [ ] Security audits and testing
- [ ] Gas optimization 
- [ ] Additional protocol integrations
- [ ] Documentation improvements

### How to Contribute
1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Test thoroughly on testnets
4. Submit pull request with detailed description

Feel free to open issues for bugs, feature requests, or questions!

## License
MIT - see LICENSE file for details
