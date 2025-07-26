# DeFi Yield Aggregator

A comprehensive DeFi yield aggregation system that monitors ALL major DeFi protocols to find the best yield opportunities and provides automated suggestions for yield optimization.

## 🌟 Features

### Universal Protocol Coverage
- **Lending Protocols**: Aave, Compound, Euler, Morpho, Radiant, Benqi
- **Liquid Staking**: Lido, Rocket Pool, Frax, Ankr, Swell 
- **Yield Farming**: Uniswap, SushiSwap, Curve, Balancer, PancakeSwap
- **Structured Products**: Pendle, Element, Ribbon, Friktion
- **Synthetic Assets**: Synthetix, Mirror, UMA
- **Cross-Chain**: Stargate, Multichain, Hop, Across
- **Real World Assets**: Maple, Goldfinch, Centrifuge
- **Derivatives**: GMX, Perpetual Protocol, dYdX, Gains

### Multi-Chain Support
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- Avalanche
- BNB Chain
- Fantom

### Core Capabilities
- **Real-time Yield Monitoring**: Continuous tracking of APY/APR across all protocols
- **Risk Assessment**: Automated evaluation of smart contract risks, IL, and protocol security
- **Arbitrage Detection**: Identifies yield differences and optimal migration paths
- **Gas Optimization**: Calculates net yields after transaction costs
- **Portfolio Analysis**: Tracks your positions across all protocols
- **Alert System**: Notifications for new opportunities and position risks

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
npm run setup

# Start the aggregator
npm start

# Start web dashboard
npm run dashboard
```

## 📊 Usage

### Web Dashboard
Access the comprehensive dashboard at `http://localhost:3000`:
- View top yielding opportunities across all protocols
- Compare yields by asset, chain, and risk level  
- Get step-by-step migration instructions
- Track your portfolio performance

### API Endpoints

```javascript
// Get best yields for an asset
GET /api/yields/best/:asset

// Compare yields across protocols
GET /api/yields/compare/:protocol1/:protocol2

// Get migration path
POST /api/strategy/migrate
{
  "currentPosition": {...},
  "targetProtocol": "aave-v3",
  "amount": "1000"
}
```

### CLI Usage

```bash
# Find best yield for USDC
node src/cli.js find-best --asset USDC --chain ethereum

# Analyze current position
node src/cli.js analyze --address 0x123...

# Get migration suggestions
node src/cli.js suggest-moves --min-improvement 0.5
```

## 🏗️ Architecture

```
defi-yield-aggregator/
├── src/
│   ├── scrapers/          # Protocol-specific data scrapers
│   ├── analyzers/         # Yield analysis and comparison
│   ├── strategies/        # Migration and optimization logic
│   ├── dashboard/         # Web interface
│   └── utils/            # Shared utilities
├── config/               # Configuration files
├── data/                # Cached data and database
└── scripts/             # Setup and maintenance scripts
```

## 📈 Supported Protocols

### Lending Protocols
| Protocol | Chains | Assets | Features |
|----------|--------|--------|----------|
| Aave V3 | ETH, POLY, ARB, OPT | 20+ | Variable rates, isolation mode |
| Compound V3 | ETH, POLY, ARB | USDC, USDT, ETH | Supply caps, liquidation |
| Euler | ETH | 200+ | Risk-adjusted rates |
| Morpho | ETH | 15+ | P2P matching |

### Yield Farming
| Protocol | Type | Chains | Features |
|----------|------|--------|----------|
| Uniswap V3 | DEX | Multi | Concentrated liquidity |
| Curve | Stable DEX | Multi | Low slippage swaps |
| Convex | Yield Booster | ETH | CRV boost optimization |
| Balancer | Weighted Pools | Multi | Custom pool weights |

### Structured Products  
| Protocol | Product Type | Risk Level | Yield Type |
|----------|-------------|------------|------------|
| Pendle | PT/YT splitting | Medium | Fixed + Variable |
| Ribbon | Options vaults | High | Premium collection |
| Jones DAO | Options strategies | High | Leveraged yields |

## 🔧 Configuration

### Protocol Endpoints
Configure RPC endpoints in `config/networks.json`:

```json
{
  "ethereum": {
    "rpc": "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY",
    "chainId": 1,
    "explorer": "https://etherscan.io"
  }
}
```

### Scraper Settings
Adjust scraping intervals in `config/scrapers.json`:

```json
{
  "intervals": {
    "fast": 60000,    // 1 minute
    "medium": 300000, // 5 minutes  
    "slow": 900000    // 15 minutes
  },
  "protocols": {
    "aave": { "interval": "fast" },
    "compound": { "interval": "medium" }
  }
}
```

## 🔐 Security

- **Read-only Operations**: No private keys required for yield monitoring
- **Rate Limiting**: Prevents API abuse and blocks
- **Data Validation**: All scraped data is verified against multiple sources
- **Risk Scoring**: Automated assessment of protocol and position risks

## 📱 Mobile App (Coming Soon)
- Real-time push notifications
- Quick yield comparisons
- One-tap migration suggestions
- Portfolio tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-protocol`
3. Add protocol scraper in `src/scrapers/`
4. Update protocol registry in `config/protocols.json`
5. Add tests and documentation
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**⚠️ Disclaimer**: This tool provides information only. Always verify yields and risks before moving funds. DeFi involves significant risks including smart contract bugs, liquidation, and impermanent loss.
