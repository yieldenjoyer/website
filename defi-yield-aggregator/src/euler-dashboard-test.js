const EulerCrossChainOptimizer = require('./euler-optimizer/EulerCrossChainOptimizer');
const EulerDashboard = require('./dashboard/EulerDashboard');

async function startDashboard() {
    console.log('🚀 Starting Euler Optimizer with Web Dashboard...\n');

    // Initialize the optimizer
    const optimizer = new EulerCrossChainOptimizer({
        rpcEndpoints: {
            ethereum: 'mock',
            arbitrum: 'mock',
            base: 'mock',
            optimism: 'mock'
        },
        database: ':memory:',
        mockMode: true
    });

    await optimizer.initialize();
    console.log('✅ Optimizer initialized');

    // Start updating market data
    await optimizer.updateMarketData();
    
    // Set up periodic updates
    setInterval(async () => {
        await optimizer.updateMarketData();
    }, 30000); // Update every 30 seconds

    // Initialize and start the dashboard
    const dashboard = new EulerDashboard(optimizer, 3333);
    dashboard.start();

    console.log('\n📊 Dashboard Features:');
    console.log('  - Real-time market data across all chains');
    console.log('  - APY tracking with rewards');
    console.log('  - Opportunity detection');
    console.log('  - Auto-refresh every 30 seconds');
    console.log('\n🔄 Press Ctrl+C to stop\n');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\nShutting down...');
        dashboard.stop();
        process.exit(0);
    });
}

// Start the dashboard
startDashboard().catch(console.error);
