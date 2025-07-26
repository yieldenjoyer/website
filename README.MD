## USDe/sUSDe Yield Optimizer Website (currently under development)
-A comprehensive DeFi platform for optimizing USDe/sUSDe yields on the Converge network. The core feature is an automated yield optimization engine that aggregates opportunities from protocols like Strata, Terminal, and Ethereal, using machine learning for risk-adjusted rebalancing and customizable vaults to deliver enhanced returns.

## Overview
-This website serves as the user interface for the USDe/sUSDe Yield Optimization Engine, an automated vault platform that maximizes risk-adjusted yields on Converge by aggregating opportunities from Strata, Terminal, and Ethereal. It uses ML for portfolio optimization (Sharpe ratio rebalancing), smart contract execution for gas-efficient trades, and customizable vaults to deliver 20-30%+ APY with built-in safeguards, driving TVL growth for Ethena's ecosystem.

## How It Works
-The engine aggregates real-time yields from Converge protocols, optimizes allocations using ML (Sharpe ratio for risk-return balance), and executes trades via smart contracts with gas efficiency and safeguards (e.g., pause during volatility). Users select vaults, deposit USDe, and the system auto-rebalances for 20-30%+ APY.
-The engine complements Ethena's delta-neutral yield mechanism by intelligently routing USDe/sUSDe across Converge protocols, providing users with seamless, high-yield strategies in a secure and user-friendly interface.

## Features
-Automated Yield Optimization: Real-time monitoring of 50+ USDe/sUSDe opportunities, with APY calculations accounting for rewards, fees, gas, and risks.
-ML-Powered Rebalancing: Portfolio optimization using Modern Portfolio Theory and Sharpe ratio, with automated triggers for threshold changes (e.g., 2% APY shift).
-Customizable Vaults: Pre-built types (Conservative, Balanced, Aggressive) and custom options for different risk profiles.
-Smart Contract Execution: Batched deposits/withdraws, slippage/MEV protection, and emergency pauses for market stress as well as automated pendle PT/YT loops.
-Frontend Dashboard: Interactive UI with real-time APY, allocation charts (using Recharts), and deposit/withdraw forms.
-Backend Integration: Flask server for ML (scipy/numpy) and data aggregation from DefiLlama or protocol APIs.
-Frontend: React, Tailwind CSS, Recharts (charts), ethers.js (wallet/contract interactions).
-Backend: Python (Flask, numpy, scipy for ML), requests (API fetching).
-Deployment: Docker for backend, Vercel/Netlify for frontend.
-Blockchain: Solidity contracts on Converge testnet (USDe as gas token).


## Data Sources: 
-DefiLlama API for real APY, filtered for USDe/sUSDe pools.

## Setup Instructions
Clone the Repo:
text

Collapse

Wrap

Copy
git clone https://github.com/yieldenjoyer/website
cd website
Backend Setup (ML and API):
text

Collapse

Wrap

Copy
cd defi-yield-aggregator
pip install flask numpy scipy requests
python server.py
Access API at http://localhost:5000/api/optimize?type=Balanced.
Frontend Setup (UI):
text

Collapse

Wrap

Copy
cd websites
npm install
npm start
Access at http://localhost:3000.
Smart Contracts (Only for Testnet currently)
cd contracts
npx hardhat deploy --network converge_testnet (configure hardhat.config.js with RPC/private key from Ethena form).
Update YieldEngine.js with deployed contract address.
Docker for Backend:
text

Collapse

Wrap

Copy
docker-compose up
Test on Converge:
Connect MetaMask to Converge testnet 
Use explorer: https://explorer-converge-testnet-1.t.conduit.xyz/.

License: MIT
