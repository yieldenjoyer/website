
# Polybets Monorepo

A comprehensive DeFi and prediction market ecosystem with MEV bots, yield strategies, and automated trading tools.

**Live app**: https://polybets-web3.vercel.app/

## Project Structure

### 🎯 Core Applications
- [**yieldbet/**](./yieldbet/): Main prediction market and yield farming platform
- [**jovaytestnet/**](./jovaytestnet/): Jovay testnet client and developer toolkit

### 🤖 Bot & Automation Projects
- [**mev-bots/**](./mev-bots/): MEV extraction strategies and arbitrage bots
- [**sandwich-bot/**](./sandwich-bot/): Dedicated sandwich attack bot
- [**nft-automation/**](./nft-automation/): NFT minting and airdrop automation
- [**sandbox-bot/**](./sandbox-bot/): Testing environment for bot strategies

### 📁 Shared Resources
- [**apps/**](./apps/): Core application services (bet routing, knowledge graph, market discovery)
- [**contracts/**](./contracts/): Smart contracts for the ecosystem
- [**packages/**](./packages/): Shared libraries and utilities

### 🛠️ Development Tools
- [**discord-scraper-bot/**](./discord-scraper-bot/): Discord data collection and analysis

## Quick Start

Each project has its own README with specific setup instructions:

1. **For prediction markets**: See [yieldbet/README.md](./yieldbet/README.MD)
2. **For MEV bots**: See [mev-bots/README.md](./mev-bots/README.md)
3. **For NFT automation**: See [nft-automation/README.md](./nft-automation/README.md)
4. **For Jovay testnet**: See [jovaytestnet/README.md](./jovaytestnet/README.md)

## Security Notice

⚠️ **Warning**: This repository contains financial trading bots and DeFi strategies. Always test thoroughly in sandbox environments before deploying to mainnet. Use at your own risk.