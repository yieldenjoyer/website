const EulerCrossChainOptimizer = require('./euler-optimizer/EulerCrossChainOptimizer');
const EulerDashboard = require('./dashboard/EulerDashboard');

// Mock data for demonstration
const mockMarketData = [
    {
        chain: 'ethereum',
        deployment: 'prime',
        asset: 'USDC',
        supplyAPY: 6.89,
        totalAPY: 6.89,
        rewards: []
    },
    {
        chain: 'ethereum',
        deployment: 'yield',
        asset: 'USDC',
        supplyAPY: 6.95,
        totalAPY: 8.80,
        rewards: [{ token: 'rEUL', apy: 1.85 }]
    },
    {
        chain: 'arbitrum',
        deployment: 'prime',
        asset: 'USDC',
        supplyAPY: 6.96,
        totalAPY: 6.96,
        rewards: []
    },
    {
        chain: 'base',
        deployment: 'yield',
        asset: 'USDC',
        supplyAPY: 7.52,
        totalAPY: 9.29,
        rewards: [{ token: 'rEUL', apy: 1.77 }]
    },
    {
        chain: 'optimism',
        deployment: 'prime',
        asset: 'USDC',
        supplyAPY: 6.73,
        totalAPY: 6.73,
        rewards: []
    }
];

// Mock optimizer class
class MockEulerOptimizer {
    constructor() {
        this.marketDataCache = new Map();
        this.userPositions = new Map();
        this.userPreferences = new Map();
        this.supportedChains = {
            ethereum: true,
            arbitrum: true,
            base: true,
            optimism: true
        };
        this.automationSettings = {
            enabled: false,
            rebalanceInterval: 900
        };
        this.optimizationSettings = {
            minYieldImprovement: 0.02,
            maxGasCostPercent: 0.01
        };
        
        // Initialize with mock data
        this.updateMockData();
    }

    updateMockData() {
        // Generate some random variation to make it look live
        const updatedData = mockMarketData.map(market => ({
            ...market,
            supplyAPY: market.supplyAPY + (Math.random() - 0.5) * 0.5,
            totalAPY: market.totalAPY + (Math.random() - 0.5) * 0.5
        }));
        
        this.marketDataCache.set('live-data', updatedData);
    }

    async findOpportunitiesForUser(address, preferences) {
        // Mock - no opportunities found for demo
        return [];
    }
}

async function startDashboard() {
    console.log('🚀 Starting Euler Optimizer Dashboard (Mock Mode)...\n');

    // Create mock optimizer
    const optimizer = new MockEulerOptimizer();
    
    // Update data every 30 seconds for demo
    setInterval(() => {
        optimizer.updateMockData();
    }, 30000);

    // Initialize and start the dashboard
    const dashboard = new EulerDashboard(optimizer, 3333);
    dashboard.start();

    console.log('✅ Mock optimizer initialized with live data simulation');
    console.log('\n📊 Dashboard Features:');
    console.log('  - Real-time market data simulation');
    console.log('  - APY tracking with rewards');
    console.log('  - Cross-chain comparison');
    console.log('  - Auto-refresh every 30 seconds');
    console.log('\n🌐 Dashboard URL: http://localhost:3333');
    console.log('🔄 Press Ctrl+C to stop\n');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\nShutting down...');
        dashboard.stop();
        process.exit(0);
    });
}

// Start the dashboard
startDashboard().catch(console.error);
