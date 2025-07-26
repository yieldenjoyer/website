const { ethers } = require('ethers');
const axios = require('axios');
const CrossChainRouter = require('../bridges/CrossChainRouter');

class UniversalYieldOptimizer {
    constructor(config) {
        this.config = config;
        this.providers = new Map();
        this.marketDataCache = new Map();
        this.userPositions = new Map();
        this.userPreferences = new Map();
        this.protocolAdapters = new Map();
        this.feeCollectorAddress = config.feeCollectorAddress; // Your address
        this.baseFeePercent = config.baseFeePercent || 0.001; // 0.1% base fee
        this.bridgeRouter = new CrossChainRouter();
        
        this.supportedProtocols = {
            euler: {
                chains: ['ethereum', 'arbitrum', 'base', 'optimism'],
                types: ['prime', 'yield']
            },
            morpho: {
                chains: ['ethereum', 'base'],
                types: ['blue', 'yellow', 'green']
            },
            aave: {
                chains: ['ethereum', 'arbitrum', 'polygon', 'avalanche', 'base', 'optimism'],
                types: ['v3']
            },
            compound: {
                chains: ['ethereum', 'arbitrum', 'polygon', 'base'],
                types: ['v3']
            },
            spark: {
                chains: ['ethereum', 'gnosis'],
                types: ['main']
            },
            venus: {
                chains: ['bnb'],
                types: ['core', 'isolated']
            },
            justlend: {
                chains: ['tron'],
                types: ['main']
            },
            yearn: {
                chains: ['ethereum', 'arbitrum', 'base', 'optimism', 'polygon'],
                types: ['v3']
            },
            convex: {
                chains: ['ethereum'],
                types: ['main', 'frax']
            }
        };

        this.dataSources = {
            'vaults.fyi': 'https://api.vaults.fyi/v1/vaults',
            'morpho-api': 'https://blue-api.morpho.org/graphql',
            'aave-api': 'https://api.aave.com/data/liquidity/v2',
            'defillama': 'https://yields.llama.fi/pools',
            'euler-api': 'https://api.euler.finance/v1/markets',
            'yearn-api': 'https://api.yearn.finance/v1/chains/1/vaults/all'
        };

        this.initialize();
    }

    async initialize() {
        console.log('Initializing Universal DeFi Yield Optimizer...');
        
        // Initialize protocol adapters
        await this.initializeProtocolAdapters();
        
        // Start data collection from all sources
        await this.startDataAggregation();
        
        // Initialize fee collection system
        this.initializeFeeSystem();
        
        console.log(`✅ Universal Optimizer initialized`);
        console.log(`📊 Monitoring ${Object.keys(this.supportedProtocols).length} protocols`);
        console.log(`🔗 Across ${this.getTotalChainCount()} chains`);
    }

    async initializeProtocolAdapters() {
        // Euler adapter
        this.protocolAdapters.set('euler', {
            fetchMarkets: this.fetchEulerMarkets.bind(this),
            calculateAPY: this.calculateEulerAPY.bind(this),
            execute: this.executeEulerOperation.bind(this)
        });

        // Morpho adapter
        this.protocolAdapters.set('morpho', {
            fetchMarkets: this.fetchMorphoMarkets.bind(this),
            calculateAPY: this.calculateMorphoAPY.bind(this),
            execute: this.executeMorphoOperation.bind(this)
        });

        // Aave adapter
        this.protocolAdapters.set('aave', {
            fetchMarkets: this.fetchAaveMarkets.bind(this),
            calculateAPY: this.calculateAaveAPY.bind(this),
            execute: this.executeAaveOperation.bind(this)
        });

        // Add more adapters...
        await this.loadAdditionalProtocolAdapters();
    }

    async startDataAggregation() {
        // Aggregate from multiple sources
        await Promise.all([
            this.fetchFromVaultsFyi(),
            this.fetchFromDeFiLlama(),
            this.fetchFromMorphoAPI()
        ]);

        // Start continuous monitoring
        setInterval(() => this.aggregateAllData(), 30000); // Every 30 seconds
    }

    async fetchFromVaultsFyi() {
        try {
            const response = await axios.get(this.dataSources['vaults.fyi']);
            const vaults = response.data;
            
            for (const vault of vaults) {
                const marketKey = `vaultsfyi-${vault.chain}-${vault.protocol}-${vault.asset}`;
                this.marketDataCache.set(marketKey, {
                    protocol: vault.protocol,
                    chain: vault.chain,
                    asset: vault.asset,
                    tvl: vault.tvl,
                    apy: vault.apy,
                    rewards: vault.rewards || [],
                    risks: vault.risks || [],
                    source: 'vaults.fyi',
                    lastUpdate: Date.now()
                });
            }
            
            console.log(`📊 Loaded ${vaults.length} vaults from vaults.fyi`);
        } catch (error) {
            console.log('⚠️  Using mock data for vaults.fyi');
            this.generateMockVaultsData();
        }
    }

    async fetchFromDeFiLlama() {
        try {
            const response = await axios.get(this.dataSources.defillama);
            const pools = response.data.data;
            
            for (const pool of pools) {
                const marketKey = `defillama-${pool.chain}-${pool.project}-${pool.symbol}`;
                this.marketDataCache.set(marketKey, {
                    protocol: pool.project,
                    chain: pool.chain,
                    asset: pool.symbol,
                    tvl: pool.tvlUsd,
                    apy: pool.apy,
                    apyBase: pool.apyBase,
                    apyReward: pool.apyReward,
                    rewards: pool.rewardTokens || [],
                    source: 'defillama',
                    lastUpdate: Date.now()
                });
            }
            
            console.log(`📊 Loaded ${pools.length} pools from DeFiLlama`);
        } catch (error) {
            console.log('⚠️  Using mock data for DeFiLlama');
            this.generateMockDeFiLlamaData();
        }
    }

    async fetchFromMorphoAPI() {
        try {
            // GraphQL query for Morpho markets
            const query = `
                query {
                    markets {
                        id
                        lltv
                        oracleAddress
                        irmAddress
                        collateralAsset {
                            address
                            symbol
                            decimals
                        }
                        loanAsset {
                            address
                            symbol
                            decimals
                        }
                        state {
                            supplyApy
                            borrowApy
                            supplyAssetsUsd
                            borrowAssetsUsd
                        }
                    }
                }
            `;

            const response = await axios.post(this.dataSources['morpho-api'], {
                query
            });

            const markets = response.data.data.markets;
            
            for (const market of markets) {
                const marketKey = `morpho-ethereum-${market.loanAsset.symbol}`;
                this.marketDataCache.set(marketKey, {
                    protocol: 'morpho',
                    chain: 'ethereum',
                    asset: market.loanAsset.symbol,
                    collateral: market.collateralAsset.symbol,
                    apy: market.state.supplyApy * 100,
                    tvl: market.state.supplyAssetsUsd,
                    lltv: market.lltv,
                    source: 'morpho-api',
                    lastUpdate: Date.now()
                });
            }
            
            console.log(`📊 Loaded ${markets.length} markets from Morpho`);
        } catch (error) {
            console.log('⚠️  Using mock data for Morpho');
            this.generateMockMorphoData();
        }
    }

    generateMockVaultsData() {
        const mockVaults = [
            { protocol: 'yearn', chain: 'ethereum', asset: 'USDC', apy: 8.5, tvl: 45000000, rewards: ['YFI'] },
            { protocol: 'yearn', chain: 'arbitrum', asset: 'USDT', apy: 9.2, tvl: 23000000, rewards: ['YFI'] },
            { protocol: 'convex', chain: 'ethereum', asset: 'FRAX', apy: 12.1, tvl: 15000000, rewards: ['CVX', 'CRV'] },
            { protocol: 'beefy', chain: 'polygon', asset: 'USDC', apy: 7.8, tvl: 12000000, rewards: ['BIFI'] },
            { protocol: 'harvest', chain: 'base', asset: 'USDC', apy: 11.3, tvl: 8000000, rewards: ['FARM'] }
        ];

        mockVaults.forEach(vault => {
            const marketKey = `vaultsfyi-${vault.chain}-${vault.protocol}-${vault.asset}`;
            this.marketDataCache.set(marketKey, {
                ...vault,
                source: 'vaults.fyi',
                lastUpdate: Date.now()
            });
        });
    }

    generateMockDeFiLlamaData() {
        const mockPools = [
            { project: 'aave-v3', chain: 'Ethereum', symbol: 'USDC', apy: 6.8, apyBase: 4.2, apyReward: 2.6, tvlUsd: 850000000 },
            { project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 7.1, apyBase: 5.1, apyReward: 2.0, tvlUsd: 245000000 },
            { project: 'compound-v3', chain: 'Ethereum', symbol: 'USDC', apy: 5.9, apyBase: 5.9, apyReward: 0, tvlUsd: 1200000000 },
            { project: 'spark', chain: 'Ethereum', symbol: 'DAI', apy: 8.4, apyBase: 6.1, apyReward: 2.3, tvlUsd: 156000000 },
            { project: 'venus', chain: 'BSC', symbol: 'USDT', apy: 9.7, apyBase: 7.2, apyReward: 2.5, tvlUsd: 89000000 }
        ];

        mockPools.forEach(pool => {
            const marketKey = `defillama-${pool.chain}-${pool.project}-${pool.symbol}`;
            this.marketDataCache.set(marketKey, {
                protocol: pool.project,
                chain: pool.chain,
                asset: pool.symbol,
                tvl: pool.tvlUsd,
                apy: pool.apy,
                apyBase: pool.apyBase,
                apyReward: pool.apyReward,
                source: 'defillama',
                lastUpdate: Date.now()
            });
        });
    }

    generateMockMorphoData() {
        const mockMorphoMarkets = [
            { asset: 'USDC', collateral: 'WETH', apy: 8.7, tvl: 125000000 },
            { asset: 'USDT', collateral: 'WBTC', apy: 9.1, tvl: 78000000 },
            { asset: 'DAI', collateral: 'WETH', apy: 8.3, tvl: 56000000 },
            { asset: 'WETH', collateral: 'USDC', apy: 4.2, tvl: 89000000 }
        ];

        mockMorphoMarkets.forEach(market => {
            const marketKey = `morpho-ethereum-${market.asset}`;
            this.marketDataCache.set(marketKey, {
                protocol: 'morpho',
                chain: 'ethereum',
                asset: market.asset,
                collateral: market.collateral,
                apy: market.apy,
                tvl: market.tvl,
                source: 'morpho-api',
                lastUpdate: Date.now()
            });
        });
    }

    async aggregateAllData() {
        console.log('🔄 Refreshing all market data...');
        
        await Promise.all([
            this.fetchFromVaultsFyi(),
            this.fetchFromDeFiLlama(),
            this.fetchFromMorphoAPI()
        ]);

        console.log(`📊 Total markets tracked: ${this.marketDataCache.size}`);
    }

    async executeRebalanceWithFee(opportunity) {
        // Mock execution for demo
        console.log('🔄 Executing rebalance...');
        console.log(`📤 Withdrawing from ${opportunity.from.protocol}`);
        console.log(`🌉 Bridging to ${opportunity.to.chain} (if needed)`);
        console.log(`📥 Depositing to ${opportunity.to.protocol}`);
        
        return {
            success: true,
            txHash: '0x123...abc',
            gasCost: opportunity.improvement.gasCost,
            bridgeCost: opportunity.improvement.bridgeCost,
            newAPY: opportunity.to.apy,
            timestamp: Date.now()
        };
    }

    // Find best opportunities across ALL protocols
    async findBestOpportunities(userAddress, currentPosition) {
        const opportunities = [];
        const userPrefs = this.userPreferences.get(userAddress) || this.getDefaultPreferences();
        
        // Get all markets for the same asset (seamless swapping)
        const sameAssetMarkets = this.getMarketsForAsset(currentPosition.asset);
        
        for (const [marketKey, marketData] of sameAssetMarkets) {
            if (marketKey === currentPosition.marketKey) continue; // Skip current position
            
            const improvement = await this.calculateNetBenefit(
                currentPosition,
                marketData,
                userPrefs,
                userAddress
            );
            
            if (improvement.netBenefit > userPrefs.minYieldImprovement) {
                opportunities.push({
                    from: currentPosition,
                    to: marketData,
                    improvement: improvement,
                    feeEstimate: this.calculateDynamicFee(currentPosition.amount, userAddress),
                    swapType: 'seamless', // Mark as seamless pool swap
                    executionMethod: 'direct_swap'
                });
            }
        }
        
        return opportunities.sort((a, b) => b.improvement.netBenefit - a.improvement.netBenefit);
    }

    calculateDynamicFee(amount, userAddress) {
        // Get user history for loyalty calculations
        const userHistory = this.getUserHistory(userAddress);
        const totalVolume = userHistory.totalVolume || 0;
        const transactionCount = userHistory.transactionCount || 0;
        const lastTransactionTime = userHistory.lastTransactionTime || 0;
        
        // Base fee structure as requested
        let baseFeePercent;
        if (amount >= 100000) { // $100K+
            baseFeePercent = 0.001; // 0.1%
        } else {
            baseFeePercent = 0.0008; // 0.08% for under $100K
        }
        
        // Apply volume-based discounts (loyalty program)
        let volumeDiscount = 0;
        if (totalVolume > 10000000) { // $10M+ total volume
            volumeDiscount = 0.0002; // 0.02% discount
        } else if (totalVolume > 5000000) { // $5M+ total volume
            volumeDiscount = 0.00015; // 0.015% discount
        } else if (totalVolume > 1000000) { // $1M+ total volume
            volumeDiscount = 0.0001; // 0.01% discount
        }
        
        // Apply frequency-based discounts (reward active users)
        let frequencyDiscount = 0;
        if (transactionCount > 50) {
            frequencyDiscount = 0.0001; // 0.01% discount for power users
        } else if (transactionCount > 20) {
            frequencyDiscount = 0.00005; // 0.005% discount for regular users
        }
        
        // Apply recent activity bonus (encourage consistent usage)
        let activityBonus = 0;
        const daysSinceLastTx = (Date.now() - lastTransactionTime) / (1000 * 60 * 60 * 24);
        if (daysSinceLastTx < 7 && transactionCount > 5) { // Active within a week
            activityBonus = 0.00002; // Small bonus for active users
        }
        
        // Calculate final fee with all adjustments
        let finalFeePercent = Math.max(
            baseFeePercent - volumeDiscount - frequencyDiscount + activityBonus,
            0.0003 // Minimum fee of 0.03%
        );
        
        // Large transaction additional discounts
        if (amount > 5000000) { // $5M+
            finalFeePercent *= 0.8; // 20% discount for huge transactions
        } else if (amount > 1000000) { // $1M+
            finalFeePercent *= 0.9; // 10% discount for large transactions
        }
        
        return {
            percent: finalFeePercent,
            amount: amount * finalFeePercent,
            destination: this.feeCollectorAddress,
            breakdown: {
                baseFee: baseFeePercent,
                volumeDiscount: volumeDiscount,
                frequencyDiscount: frequencyDiscount,
                activityBonus: activityBonus,
                userTier: this.getUserTier(totalVolume, transactionCount)
            }
        };
    }

    async executeOptimalRebalance(userAddress, opportunity) {
        console.log(`🚀 Executing seamless pool swap for ${userAddress}`);
        
        try {
            // Calculate dynamic fee with user history
            const fee = this.calculateDynamicFee(opportunity.from.amount, userAddress);
            
            // Update user history before execution
            this.updateUserHistory(userAddress, opportunity.from.amount);
            
            // Execute seamless swap
            const result = await this.executeSeamlessSwap(opportunity, fee);
            
            // Collect fee after successful execution
            await this.collectFee(userAddress, fee);
            
            console.log(`✅ Seamless pool swap completed`);
            console.log(`💰 Fee collected: $${fee.amount.toFixed(2)} (${(fee.percent * 100).toFixed(4)}%)`);
            console.log(`🏆 User tier: ${fee.breakdown.userTier}`);
            
            return result;
        } catch (error) {
            console.error('❌ Pool swap failed:', error);
            throw error;
        }
    }

    async collectFee(userAddress, feeInfo) {
        // In production, this would deduct the fee before executing the rebalance
        console.log(`💰 Collecting ${(feeInfo.percent * 100).toFixed(3)}% fee: $${feeInfo.amount.toFixed(2)}`);
        console.log(`📤 Sending fee to: ${feeInfo.destination}`);
        
        // Mock fee collection - in production would be actual transaction
        return {
            feeCollected: feeInfo.amount,
            feeRecipient: feeInfo.destination,
            timestamp: Date.now()
        };
    }

    getMarketsForAsset(asset) {
        const markets = new Map();
        
        for (const [key, data] of this.marketDataCache) {
            if (data.asset === asset) {
                markets.set(key, data);
            }
        }
        
        return markets;
    }

    async calculateNetBenefit(currentPosition, targetMarket, userPrefs, userAddress) {
        const currentAPY = currentPosition.apy;
        const targetAPY = targetMarket.apy;
        const apyDifference = targetAPY - currentAPY;
        
        // Calculate costs with user-specific fee
        const gasCost = await this.estimateGasCosts(currentPosition, targetMarket);
        const bridgeCost = this.estimateBridgeCosts(currentPosition.chain, targetMarket.chain);
        const fee = this.calculateDynamicFee(currentPosition.amount, userAddress);
        
        const totalCosts = gasCost + bridgeCost + fee.amount;
        const totalCostPercent = totalCosts / currentPosition.amount;
        
        // Calculate net benefit with seamless swap optimization
        const grossBenefit = apyDifference / 100;
        const netBenefit = grossBenefit - totalCostPercent;
        
        return {
            grossBenefit: grossBenefit,
            netBenefit: netBenefit,
            gasCost: gasCost,
            bridgeCost: bridgeCost,
            protocolFee: fee.amount,
            totalCosts: totalCosts,
            executionTime: this.estimateExecutionTime(currentPosition.chain, targetMarket.chain),
            feeBreakdown: fee.breakdown
        };
    }

    getTotalChainCount() {
        const chains = new Set();
        Object.values(this.supportedProtocols).forEach(protocol => {
            protocol.chains.forEach(chain => chains.add(chain));
        });
        return chains.size;
    }

    getDefaultPreferences() {
        return {
            minYieldImprovement: 0.02, // 2%
            maxGasCostPercent: 0.01,   // 1%
            allowCrossChain: true,
            preferredProtocols: ['aave-v3', 'morpho', 'euler'],
            maxPositionSize: 10000000, // $10M
            riskTolerance: 'medium'
        };
    }

    async estimateGasCosts(currentPos, targetMarket) {
        // Mock gas estimation - would use real gas oracles in production
        const baseGas = 150000; // Base gas for withdraw + deposit
        const gasPrice = 20; // 20 gwei
        const ethPrice = 3500; // $3500 ETH
        
        return (baseGas * gasPrice * 1e-9 * ethPrice);
    }

    estimateBridgeCosts(fromChain, toChain) {
        if (fromChain === toChain) return 0;
        
        // Mock bridge costs
        const bridgeFees = {
            'ethereum-arbitrum': 15,
            'ethereum-base': 20,
            'ethereum-optimism': 18,
            'arbitrum-base': 25,
            'arbitrum-optimism': 22
        };
        
        return bridgeFees[`${fromChain}-${toChain}`] || 30;
    }

    estimateExecutionTime(fromChain, toChain) {
        if (fromChain === toChain) return 60; // 1 minute for same chain
        return 900; // 15 minutes for cross-chain
    }

    // User History Management
    getUserHistory(userAddress) {
        if (!this.userHistory) {
            this.userHistory = new Map();
        }
        
        return this.userHistory.get(userAddress) || {
            totalVolume: 0,
            transactionCount: 0,
            lastTransactionTime: 0,
            firstTransactionTime: Date.now()
        };
    }
    
    updateUserHistory(userAddress, amount) {
        const history = this.getUserHistory(userAddress);
        history.totalVolume += amount;
        history.transactionCount += 1;
        history.lastTransactionTime = Date.now();
        
        if (!this.userHistory) {
            this.userHistory = new Map();
        }
        this.userHistory.set(userAddress, history);
    }
    
    getUserTier(totalVolume, transactionCount) {
        if (totalVolume > 10000000 && transactionCount > 50) return 'Diamond';
        if (totalVolume > 5000000 && transactionCount > 20) return 'Platinum';
        if (totalVolume > 1000000 && transactionCount > 10) return 'Gold';
        if (totalVolume > 100000 && transactionCount > 5) return 'Silver';
        return 'Bronze';
    }
    
    // Seamless Swap Execution
    async executeSeamlessSwap(opportunity, feeInfo) {
        console.log('🔄 Executing seamless pool swap...');
        console.log(`📤 Withdrawing from ${opportunity.from.protocol} on ${opportunity.from.chain}`);
        
        // Simulate withdrawal
        await this.sleep(1000);
        
        let bridgeResult = null;
        // If cross-chain, use bridge router
        if (opportunity.from.chain !== opportunity.to.chain) {
            const bridgeRoute = await this.bridgeRouter.findOptimalRoute(
                opportunity.from.chain, 
                opportunity.to.chain, 
                opportunity.from.asset, 
                opportunity.from.amount
            );
            
            bridgeResult = await this.bridgeRouter.executeBridge(
                bridgeRoute,
                opportunity.from.chain,
                opportunity.to.chain,
                opportunity.from.asset,
                opportunity.from.amount,
                opportunity.userAddress
            );
        }
        
        console.log(`📥 Depositing to ${opportunity.to.protocol} on ${opportunity.to.chain}`);
        await this.sleep(1000);
        
        return {
            success: true,
            txHash: '0x' + Math.random().toString(16).substr(2, 40),
            fromProtocol: opportunity.from.protocol,
            toProtocol: opportunity.to.protocol,
            oldAPY: opportunity.from.apy,
            newAPY: opportunity.to.apy,
            feeCollected: feeInfo.amount,
            userTier: feeInfo.breakdown.userTier,
            bridgeResult: bridgeResult,
            timestamp: Date.now()
        };
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Protocol-specific methods (would expand these)
    async fetchEulerMarkets() { /* Implementation */ }
    async fetchMorphoMarkets() { /* Implementation */ }
    async fetchAaveMarkets() { /* Implementation */ }
    
    calculateEulerAPY(market) { /* Implementation */ }
    calculateMorphoAPY(market) { /* Implementation */ }
    calculateAaveAPY(market) { /* Implementation */ }
    
    async executeEulerOperation(operation) { /* Implementation */ }
    async executeMorphoOperation(operation) { /* Implementation */ }
    async executeAaveOperation(operation) { /* Implementation */ }

    async loadAdditionalProtocolAdapters() {
        // Load adapters for Compound, Yearn, Convex, etc.
        console.log('📦 Loading additional protocol adapters...');
    }

    initializeFeeSystem() {
        console.log(`💰 Fee system initialized`);
        console.log(`📍 Fee collector address: ${this.feeCollectorAddress}`);
        console.log(`📊 Base fee: ${(this.baseFeePercent * 100).toFixed(3)}%`);
    }
}

module.exports = UniversalYieldOptimizer;
