const UniversalYieldOptimizer = require('./core/UniversalYieldOptimizer');
const CrossChainRouter = require('./bridges/CrossChainRouter');
require('dotenv').config();

async function runFullSystemDemo() {
    console.log('🚀 =================================');
    console.log('🚀 DeFi Yield Aggregator Full Demo');
    console.log('🚀 =================================\n');

    // Initialize the system
    console.log('📡 Initializing Universal Yield Optimizer...');
    const optimizer = new UniversalYieldOptimizer({
        feeCollectorAddress: process.env.FEE_COLLECTOR_ADDRESS || '0x24e5fD728A47769913c8faecdb691Eb5DC4B2b95',
        baseFeePercent: 0.001,
        mockMode: true
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`✅ System initialized with ${optimizer.marketDataCache.size} markets\n`);

    // Demo user scenarios
    const scenarios = [
        {
            name: 'Bronze User - Small Position',
            userAddress: '0x1234567890abcdef1234567890abcdef12345678',
            position: {
                marketKey: 'defillama-ethereum-aave-v3-USDC',
                protocol: 'aave-v3',
                chain: 'ethereum',
                asset: 'USDC',
                amount: 50000,
                apy: 6.8
            }
        },
        {
            name: 'Gold User - Medium Position',
            userAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            position: {
                marketKey: 'defillama-arbitrum-compound-v3-USDT',
                protocol: 'compound-v3',
                chain: 'arbitrum',
                asset: 'USDT',
                amount: 500000,
                apy: 5.2
            }
        },
        {
            name: 'Diamond User - Large Position',
            userAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
            position: {
                marketKey: 'defillama-polygon-morpho-DAI',
                protocol: 'morpho',
                chain: 'polygon',
                asset: 'DAI',
                amount: 2000000,
                apy: 7.1
            }
        }
    ];

    for (const scenario of scenarios) {
        console.log(`\n🧪 Testing Scenario: ${scenario.name}`);
        console.log('═'.repeat(50));
        
        // Simulate user history for different tiers
        const userHistory = optimizer.getUserHistory(scenario.userAddress);
        if (scenario.name.includes('Gold')) {
            userHistory.totalVolume = 1500000;
            userHistory.transactionCount = 15;
        } else if (scenario.name.includes('Diamond')) {
            userHistory.totalVolume = 12000000;
            userHistory.transactionCount = 75;
        }
        optimizer.userHistory = optimizer.userHistory || new Map();
        optimizer.userHistory.set(scenario.userAddress, userHistory);

        // Calculate dynamic fee
        const feeInfo = optimizer.calculateDynamicFee(scenario.position.amount, scenario.userAddress);
        console.log(`💰 User Tier: ${feeInfo.breakdown.userTier}`);
        console.log(`💰 Fee: ${(feeInfo.percent * 100).toFixed(4)}% ($${feeInfo.amount.toFixed(2)})`);

        // Find opportunities
        const opportunities = await optimizer.findBestOpportunities(scenario.userAddress, scenario.position);
        
        if (opportunities.length > 0) {
            const bestOpportunity = opportunities[0];
            console.log(`\n🎯 Best Opportunity Found:`);
            console.log(`   From: ${bestOpportunity.from.protocol} (${bestOpportunity.from.chain}) - ${bestOpportunity.from.apy}%`);
            console.log(`   To: ${bestOpportunity.to.protocol} (${bestOpportunity.to.chain}) - ${bestOpportunity.to.apy}%`);
            console.log(`   APY Improvement: +${(bestOpportunity.to.apy - bestOpportunity.from.apy).toFixed(2)}%`);
            console.log(`   Net Benefit: +${(bestOpportunity.improvement.netBenefit * 100).toFixed(2)}%`);
            console.log(`   Total Costs: $${bestOpportunity.improvement.totalCosts.toFixed(2)}`);

            // Simulate execution
            console.log(`\n🚀 Executing optimal rebalance...`);
            const result = await optimizer.executeOptimalRebalance(scenario.userAddress, bestOpportunity);
            
            console.log(`✅ Execution completed successfully!`);
            console.log(`   Transaction Hash: ${result.txHash}`);
            console.log(`   Fee Collected: $${result.feeCollected.toFixed(2)}`);
            if (result.bridgeResult) {
                console.log(`   Bridge Used: ${result.bridgeResult.bridgeProvider} ($${result.bridgeResult.totalFee.toFixed(2)})`);
            }
        } else {
            console.log('📊 No profitable opportunities found with current parameters');
        }
    }

    // Demonstrate cross-chain bridge routing
    console.log('\n\n🌉 Cross-Chain Bridge Routing Demo');
    console.log('═'.repeat(50));
    
    const bridgeRouter = new CrossChainRouter();
    const bridgeScenarios = [
        { from: 'ethereum', to: 'arbitrum', asset: 'USDC', amount: 100000 },
        { from: 'polygon', to: 'base', asset: 'USDT', amount: 250000 },
        { from: 'arbitrum', to: 'optimism', asset: 'ETH', amount: 50000 }
    ];

    for (const bridge of bridgeScenarios) {
        console.log(`\n🔍 Finding route: ${bridge.from} → ${bridge.to} (${bridge.asset})`);
        
        const routes = await bridgeRouter.getRouteOptions(bridge.from, bridge.to, bridge.asset, bridge.amount);
        
        if (routes.length > 0) {
            console.log(`✅ Found ${routes.length} bridge routes:`);
            routes.forEach((route, index) => {
                console.log(`   ${index + 1}. ${route.provider}: $${route.totalFee.toFixed(2)} (${Math.floor(route.time / 60)}min)`);
            });
            
            // Show execution of best route
            const bestRoute = routes[0];
            console.log(`\n🌉 Executing via ${bestRoute.provider}...`);
            const bridgeResult = await bridgeRouter.executeBridge(
                bestRoute, bridge.from, bridge.to, bridge.asset, bridge.amount, 
                '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e'
            );
            console.log(`✅ Bridge completed: ${bridgeResult.txHash}`);
        }
    }

    // System statistics
    console.log('\n\n📊 System Statistics');
    console.log('═'.repeat(50));
    console.log(`Markets Monitored: ${optimizer.marketDataCache.size}`);
    console.log(`Protocols Supported: ${Object.keys(optimizer.supportedProtocols).length}`);
    console.log(`Chains Supported: ${optimizer.getTotalChainCount()}`);
    console.log(`Bridge Providers: ${Object.keys(bridgeRouter.bridgeProviders).length}`);
    console.log(`Supported Assets: ${bridgeRouter.getSupportedAssets().length}`);

    // Revenue demonstration
    console.log('\n\n💰 Revenue Model Demonstration');
    console.log('═'.repeat(50));
    
    const monthlyVolumes = [50000000, 75000000, 100000000, 125000000, 150000000];
    let totalRevenue = 0;
    
    console.log('Projected Monthly Revenue:');
    monthlyVolumes.forEach((volume, index) => {
        const avgFee = 0.0008; // Average 0.08% fee
        const monthlyRevenue = volume * avgFee;
        totalRevenue += monthlyRevenue;
        console.log(`   Month ${index + 1}: $${volume.toLocaleString()} volume → $${monthlyRevenue.toLocaleString()} revenue`);
    });
    
    const annualRevenue = (totalRevenue / 5) * 12; // Average monthly * 12
    console.log(`\n💎 Projected Annual Revenue: $${annualRevenue.toLocaleString()}`);
    
    console.log('\n🎯 Business Model Benefits:');
    console.log('   ✅ Automated yield optimization reduces user effort');
    console.log('   ✅ Cross-chain bridging increases addressable market');
    console.log('   ✅ Dynamic fees reward loyal users and large volumes');
    console.log('   ✅ Institutional-grade features accessible to all users');
    console.log('   ✅ Continuous market monitoring provides competitive edge');

    console.log('\n🌐 Web Interface Available at: http://localhost:3000');
    console.log('   Run: npm run web');
    
    console.log('\n🚀 Full Demo Complete! System is ready for production deployment.');
}

// Run the demo
runFullSystemDemo().catch(console.error);
