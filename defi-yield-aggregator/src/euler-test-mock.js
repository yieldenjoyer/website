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
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    },
    depositToEuler: async (params) => {
        logger.info('Mock deposit:', params);
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
    },
    validateExecution: async (params) => {
        return { valid: true };
    }
};

const mockBridgeManager = {
    bridgeAsset: async (params) => {
        logger.info('Mock bridge:', params);
        await new Promise(resolve => setTimeout(resolve, 200));
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

// Mock provider that doesn't make real network calls
class MockProvider {
    async getBlockNumber() {
        return 18000000;
    }
    
    async getNetwork() {
        return { chainId: 1, name: 'ethereum' };
    }
    
    async getBalance(address) {
        return ethers.parseEther('100');
    }
}

// Test runner
async function runEulerOptimizerTest() {
    console.log('🚀 Starting Euler Cross-Chain Optimizer Mock Test...\n');
    
    try {
        // Initialize optimizer with mocks
        const optimizer = new EulerCrossChainOptimizer({
            database: mockDatabase,
            transactionExecutor: mockTransactionExecutor,
            bridgeManager: mockBridgeManager,
            gasMonitor: mockGasMonitor,
            alertSystem: mockAlertSystem
        });
        
        // Override RPC initialization with mock providers
        optimizer.initializeProviders = async function() {
            logger.info('Using mock providers for testing');
            this.providers = {
                ethereum: new MockProvider(),
                arbitrum: new MockProvider(),
                base: new MockProvider(),
                optimism: new MockProvider()
            };
        };
        
        // Override contract initialization with full mocks
        optimizer.initializeContracts = async function() {
            logger.info('Using mock contracts for testing');
            
            // Create mock contract methods
            const createMockEToken = (asset) => ({
                totalSupply: async () => ethers.parseEther('1000000'),
                totalBorrows: async () => ethers.parseEther('600000'),
                interestRate: async () => ethers.parseUnits('5', 25), // 5% APR
                reserveFee: async () => ethers.parseUnits('0.2', 27), // 20% reserve fee
                address: '0x' + Math.random().toString(16).substr(2, 40)
            });
            
            // Mock contract instances
            for (const chain of Object.keys(this.supportedChains)) {
                this.contracts[chain] = {};
                
                // Mock Euler Prime contracts
                const deployments = this.supportedChains[chain].eulerDeployments;
                
                for (const [deploymentName, deployment] of Object.entries(deployments)) {
                    if (deployment.type === 'EULER_PRIME') {
                        this.contracts[chain][deploymentName] = {
                            euler: { address: deployment.address },
                            markets: {
                                address: '0x' + Math.random().toString(16).substr(2, 40),
                                underlyingToEToken: async (assetAddress) => {
                                    // Return mock eToken address for supported assets
                                    const supportedAssets = ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'];
                                    const assetSymbol = this.getAssetSymbolFromAddress(assetAddress, chain);
                                    
                                    if (supportedAssets.includes(assetSymbol)) {
                                        return '0x' + Math.random().toString(16).substr(2, 40);
                                    }
                                    return ethers.ZeroAddress;
                                }
                            }
                        };
                    } else if (deployment.type === 'EULER_YIELD') {
                        this.contracts[chain][deploymentName] = {
                            vault: {
                                address: deployment.address,
                                totalAssets: async () => ethers.parseEther('2000000'),
                                totalSupply: async () => ethers.parseEther('1950000'),
                                asset: async () => this.getAssetAddress('USDC', chain),
                                getRewardTokens: async () => [this.rewardTokens.rEUL[chain] || ethers.ZeroAddress],
                                getRewardData: async (token) => ({
                                    rewardRate: ethers.parseEther('100'),
                                    rewardPerTokenStored: ethers.parseEther('0.5'),
                                    lastUpdateTime: Math.floor(Date.now() / 1000)
                                })
                            }
                        };
                    }
                }
            }
        };
        
        // Add helper method to get asset symbol from address
        optimizer.getAssetSymbolFromAddress = function(address, chain) {
            const addresses = {
                ethereum: {
                    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
                    '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
                    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
                    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC'
                }
            };
            
            return addresses[chain]?.[address] || 'UNKNOWN';
        };
        
        // Override market data collection to inject mock data
        optimizer.collectEulerPrimeData = async function(chainName, deploymentName, contracts) {
            logger.info(`Collecting mock Euler Prime data for ${chainName}/${deploymentName}`);
            
            const mockMarkets = [
                {
                    chain: chainName,
                    deployment: deploymentName,
                    asset: 'USDC',
                    assetAddress: this.getAssetAddress('USDC', chainName),
                    eTokenAddress: '0x' + Math.random().toString(16).substr(2, 40),
                    supplyAPY: 5.2 + Math.random() * 3,
                    borrowAPY: 7.5 + Math.random() * 2,
                    totalSupply: '10000000',
                    totalBorrows: '6000000',
                    utilization: 60n,
                    timestamp: Date.now()
                }
            ];
            
            return mockMarkets;
        };
        
        optimizer.collectEulerYieldData = async function(chainName, deploymentName, contracts) {
            logger.info(`Collecting mock Euler Yield data for ${chainName}/${deploymentName}`);
            
            return [{
                chain: chainName,
                deployment: deploymentName,
                asset: 'USDC',
                assetAddress: this.getAssetAddress('USDC', chainName),
                vaultAddress: contracts.vault.address,
                supplyAPY: 6.0 + Math.random() * 2,
                totalAPY: 8.5 + Math.random() * 3,
                rewards: [
                    { token: '0xrEUL', apy: 2.5 }
                ],
                totalAssets: '2000000',
                totalSupply: '1950000',
                sharePrice: '1.025641',
                timestamp: Date.now()
            }];
        };
        
        // Override user position fetching
        optimizer.getUserPositions = async function(userAddress) {
            return [
                {
                    chain: 'ethereum',
                    deployment: 'prime',
                    asset: 'USDC',
                    assetAddress: this.getAssetAddress('USDC', 'ethereum'),
                    amount: ethers.parseUnits('10000', 6),
                    value: 10000,
                    apy: 5.2,
                    rewardAPY: 1.6,
                    lastUpdated: new Date()
                }
            ];
        };
        
        // Add automation settings
        optimizer.automationSettings = { enabled: false };
        
        // Initialize the optimizer
        await optimizer.initialize();
        
        console.log('✅ Optimizer initialized successfully\n');
        
        // Test market data collection
        console.log('📊 Testing market data collection...');
        await optimizer.updateAllMarketData();
        
        // Display collected market data
        console.log('\n📈 Market Data Summary:');
        let marketCount = 0;
        for (const [key, data] of optimizer.marketDataCache) {
            console.log(`\n${key}:`);
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(market => {
                    console.log(`  - ${market.asset}: ${market.supplyAPY?.toFixed(2) || 'N/A'}% base APY`);
                    if (market.totalAPY) {
                        console.log(`    Total APY with rewards: ${market.totalAPY.toFixed(2)}%`);
                    }
                    marketCount++;
                });
            }
        }
        console.log(`\nTotal markets tracked: ${marketCount}`);
        
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
                console.log('\n🏃 Testing execution (DRY RUN mode)...');
                const executed = await optimizer.executeOpportunities(testUser, opportunities.slice(0, 1), preferences);
                console.log(`\n✅ Dry run completed. Would execute ${executed} rebalances.`);
            } else {
                console.log('\n📌 No profitable opportunities found with current settings.');
                console.log('   This is normal in testing with mock data.');
            }
        }
        
        // Display optimizer status
        console.log('\n📊 Optimizer Status:');
        console.log(`  - Automation Enabled: ${optimizer.automationSettings.enabled}`);
        console.log(`  - Min Yield Improvement: ${(optimizer.optimizationSettings.minYieldImprovement * 100).toFixed(2)}%`);
        console.log(`  - Max Gas Cost: ${(optimizer.optimizationSettings.maxGasCostPercent * 100).toFixed(2)}%`);
        console.log(`  - Rebalance Interval: ${optimizer.optimizationSettings.rebalanceInterval / 1000}s`);
        console.log(`  - Supported Chains: ${Object.keys(optimizer.supportedChains).join(', ')}`);
        
        console.log('\n✅ All tests completed successfully!');
        
        // Show sample configuration
        console.log('\n📝 Sample User Configuration:');
        console.log(JSON.stringify({
            minYieldImprovement: 0.02, // 2%
            maxGasCostPercent: 0.01, // 1%
            riskTolerance: 'medium',
            allowCrossChain: true,
            includeRewards: true,
            includePoints: true,
            preferredChains: ['ethereum', 'arbitrum', 'base'],
            maxLTV: 0.8 // 80%
        }, null, 2));
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Run the test
runEulerOptimizerTest().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
