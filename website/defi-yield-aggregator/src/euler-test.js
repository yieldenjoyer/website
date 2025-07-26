const { ethers } = require('ethers');
const EulerCrossChainOptimizer = require('./euler-optimizer/EulerCrossChainOptimizer');

// Use console as logger for testing
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args)
};

// Mock dependencies for testing
const mockDatabase = {
    all: async (query) => {
        logger.info('Mock database query:', query);
        // Return test user preferences
        return [
            {
                user_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e',
                preferences: JSON.stringify({
                    minYieldImprovement: 0.02,
                    maxGasCostPercent: 0.01,
                    riskTolerance: 'medium',
                    allowCrossChain: true,
                    includeRewards: true,
                    preferredChains: ['ethereum', 'arbitrum', 'base']
                })
            }
        ];
    },
    run: async (query, params) => {
        logger.info('Mock database run:', { query, params });
        return { changes: 1 };
    }
};

const mockTransactionExecutor = {
    withdrawFromEuler: async (params) => {
        logger.info('Mock withdrawal:', params);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    },
    depositToEuler: async (params) => {
        logger.info('Mock deposit:', params);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    },
    validateExecution: async (params) => {
        return { valid: true };
    }
};

const mockBridgeManager = {
    bridgeAsset: async (params) => {
        logger.info('Mock bridge:', params);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    }
};

const mockGasMonitor = {
    getGasPrice: async (chain) => {
        const gasPrices = {
            ethereum: 30 * 1e9, // 30 gwei
            arbitrum: 0.1 * 1e9, // 0.1 gwei
            base: 0.05 * 1e9, // 0.05 gwei
            optimism: 0.05 * 1e9 // 0.05 gwei
        };
        return gasPrices[chain] || 1e9;
    }
};

const mockAlertSystem = {
    sendAlert: async (title, message, type) => {
        console.log(`\n🔔 ALERT [${type.toUpperCase()}]: ${title}`);
        console.log(`   ${message}\n`);
    }
};

const mockScraperManager = {
    getAllMarkets: async () => {
        // Return mock market data
        return [
            {
                protocol: 'euler',
                chain: 'ethereum',
                deployment: 'prime',
                asset: 'USDC',
                supplyAPY: 5.2,
                totalAPY: 6.8,
                totalSupply: '10000000',
                timestamp: Date.now()
            },
            {
                protocol: 'euler',
                chain: 'arbitrum',
                deployment: 'prime',
                asset: 'USDC',
                supplyAPY: 7.5,
                totalAPY: 9.2,
                totalSupply: '5000000',
                timestamp: Date.now()
            },
            {
                protocol: 'euler',
                chain: 'base',
                deployment: 'yield',
                asset: 'USDC',
                supplyAPY: 8.0,
                totalAPY: 11.5,
                rewards: [
                    { token: 'rEUL', apy: 3.5 }
                ],
                totalSupply: '3000000',
                timestamp: Date.now()
            }
        ];
    }
};

// Test runner
async function runEulerOptimizerTest() {
    console.log('🚀 Starting Euler Cross-Chain Optimizer Test...\n');
    
    try {
        // Initialize optimizer with mocks
        const optimizer = new EulerCrossChainOptimizer({
            database: mockDatabase,
            transactionExecutor: process.env.USE_MOCK_EXECUTOR === 'true' ? mockTransactionExecutor : null,
            bridgeManager: mockBridgeManager,
            gasMonitor: mockGasMonitor,
            alertSystem: mockAlertSystem,
            scraperManager: mockScraperManager
        });
        
        // Override RPC initialization for testing
        optimizer.initializeProviders = async function() {
            logger.info('Using mock providers for testing');
            this.providers = {
                ethereum: new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL),
                arbitrum: new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL),
                base: new ethers.JsonRpcProvider(process.env.BASE_RPC_URL),
                optimism: new ethers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL)
            };
        };
        
        // Override contract initialization
        optimizer.initializeContracts = async function() {
            logger.info('Using mock contracts for testing');
            // Mock contract instances
            for (const chain of Object.keys(this.supportedChains)) {
                this.contracts[chain] = {
                    prime: { 
                        euler: { address: '0x' + Math.random().toString(16).substr(2, 40) },
                        markets: { 
                            address: '0x' + Math.random().toString(16).substr(2, 40),
                            underlyingToEToken: async () => '0x' + Math.random().toString(16).substr(2, 40)
                        }
                    },
                    yield: { 
                        vault: { 
                            address: '0x' + Math.random().toString(16).substr(2, 40),
                            totalAssets: async () => ethers.parseEther('1000000'),
                            totalSupply: async () => ethers.parseEther('1000000'),
                            asset: async () => '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
                            getRewardTokens: async () => ['0x' + Math.random().toString(16).substr(2, 40)],
                            getRewardData: async () => ({ 
                                rewardRate: ethers.parseEther('100'),
                                rewardPerTokenStored: ethers.parseEther('0.5'),
                                lastUpdateTime: Math.floor(Date.now() / 1000)
                            })
                        }
                    }
                };
            }
        };
        
        // Add automation settings
        optimizer.automationSettings = { enabled: false };
        
        // Override user position fetching
        optimizer.getUserPositions = async function(userAddress) {
            return [
                {
                    chain: 'ethereum',
                    deployment: 'prime',
                    asset: 'USDC',
                    amount: ethers.parseUnits('10000', 6),
                    value: 10000,
                    apy: 5.2,
                    rewardAPY: 1.6,
                    lastUpdated: new Date()
                }
            ];
        };
        
        // Initialize the optimizer
        await optimizer.initialize();
        
        console.log('✅ Optimizer initialized successfully\n');
        
        // Test market data collection
        console.log('📊 Testing market data collection...');
        await optimizer.updateAllMarketData();
        
        // Display collected market data
        console.log('\n📈 Market Data Summary:');
        for (const [key, data] of optimizer.marketDataCache) {
            console.log(`\n${key}:`);
            if (Array.isArray(data)) {
                data.forEach(market => {
                    console.log(`  - ${market.asset}: ${market.supplyAPY}% base + ${(market.totalAPY - market.supplyAPY).toFixed(2)}% rewards`);
                });
            }
        }
        
        // Test opportunity finding
        console.log('\n🔍 Testing opportunity detection...');
        const testUser = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e';
        const preferences = optimizer.userPreferences.get(testUser);
        
        if (preferences) {
            const opportunities = await optimizer.findOpportunitiesForUser(testUser, preferences);
            
            if (opportunities.length > 0) {
                console.log(`\n💡 Found ${opportunities.length} opportunities:`);
                opportunities.forEach((opp, index) => {
                    console.log(`\n  Opportunity ${index + 1}:`);
                    console.log(`    From: ${opp.currentPosition.chain}/${opp.currentPosition.deployment}`);
                    console.log(`    To: ${opp.targetMarket.chain}/${opp.targetMarket.deployment}`);
                    console.log(`    Current APY: ${opp.improvement.currentAPY.toFixed(2)}%`);
                    console.log(`    Target APY: ${opp.improvement.targetAPY.toFixed(2)}%`);
                    console.log(`    Net Improvement: ${opp.improvement.netBenefit.toFixed(2)}%`);
                    console.log(`    Break-even: ${opp.improvement.breakEvenDays.toFixed(1)} days`);
                });
                
                // Test execution in dry-run mode
                if (process.env.DRY_RUN === 'true') {
                    console.log('\n🏃 Testing execution (DRY RUN mode)...');
                    const executed = await optimizer.executeOpportunities(testUser, opportunities.slice(0, 1), preferences);
                    console.log(`\n✅ Dry run completed. Would execute ${executed} rebalances.`);
                }
            } else {
                console.log('\n❌ No profitable opportunities found with current settings.');
            }
        }
        
        // Display optimizer status
        console.log('\n📊 Optimizer Status:');
        console.log(`  - Automation Enabled: ${optimizer.automationSettings.enabled}`);
        console.log(`  - Min Yield Improvement: ${(optimizer.optimizationSettings.minYieldImprovement * 100).toFixed(2)}%`);
        console.log(`  - Max Gas Cost: ${(optimizer.optimizationSettings.maxGasCostPercent * 100).toFixed(2)}%`);
        console.log(`  - Rebalance Interval: ${optimizer.optimizationSettings.rebalanceInterval / 1000}s`);
        
        // Keep running for monitoring
        console.log('\n\n🔄 Optimizer is running. Press Ctrl+C to stop.\n');
        
        // Health check endpoint
        if (process.env.NODE_ENV === 'development') {
            const express = require('express');
            const app = express();
            
            app.get('/health', (req, res) => {
                res.json({
                    status: 'healthy',
                    optimizer: 'running',
                    chains: Object.keys(optimizer.providers),
                    cache: optimizer.marketDataCache.size,
                    users: optimizer.userPreferences.size
                });
            });
            
            app.get('/opportunities', async (req, res) => {
                const opportunities = [];
                for (const [user, prefs] of optimizer.userPreferences) {
                    const userOpps = await optimizer.findOpportunitiesForUser(user, prefs);
                    opportunities.push({ user, opportunities: userOpps });
                }
                res.json(opportunities);
            });
            
            app.listen(3000, () => {
                console.log('📡 Health check API running on http://localhost:3000');
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Euler Optimizer...');
    process.exit(0);
});

// Run the test
runEulerOptimizerTest();
