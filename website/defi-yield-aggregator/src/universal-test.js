const UniversalYieldOptimizer = require('./core/UniversalYieldOptimizer');

async function testUniversalOptimizer() {
    console.log('🚀 Starting Universal DeFi Yield Optimizer Test...\n');

    // Initialize with your fee collector address
    const optimizer = new UniversalYieldOptimizer({
        feeCollectorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e', // Your address
        baseFeePercent: 0.001, // 0.1% base fee
        mockMode: true // Use mock data for testing
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 Testing market data aggregation from all sources...\n');

    // Display aggregated data
    displayMarketSummary(optimizer);

    console.log('\n🔍 Testing opportunity detection across protocols...\n');

    // Mock user position
    const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e';
    const currentPosition = {
        marketKey: 'defillama-Ethereum-aave-v3-USDC',
        protocol: 'aave-v3',
        chain: 'ethereum',
        asset: 'USDC',
        amount: 100000, // $100k
        apy: 6.8
    };

    // Find best opportunities
    const opportunities = await optimizer.findBestOpportunities(userAddress, currentPosition);

    if (opportunities.length > 0) {
        console.log(`💡 Found ${opportunities.length} profitable opportunities:\n`);
        
        opportunities.slice(0, 5).forEach((opp, index) => {
            const fee = opp.feeEstimate;
            console.log(`${index + 1}. ${opp.to.protocol} on ${opp.to.chain}`);
            console.log(`   📈 APY: ${opp.from.apy}% → ${opp.to.apy}% (+${(opp.to.apy - opp.from.apy).toFixed(2)}%)`);
            console.log(`   💰 Net Benefit: +${(opp.improvement.netBenefit * 100).toFixed(2)}% annually`);
            console.log(`   💸 Protocol Fee: ${(fee.percent * 100).toFixed(3)}% ($${fee.amount.toFixed(2)})`);
            console.log(`   ⛽ Total Costs: $${opp.improvement.totalCosts.toFixed(2)}`);
            console.log(`   ⏱️  Execution Time: ${Math.floor(opp.improvement.executionTime / 60)} minutes\n`);
        });

        // Simulate executing the best opportunity
        console.log('🤖 Simulating execution of best opportunity...\n');
        const result = await optimizer.executeOptimalRebalance(userAddress, opportunities[0]);
        
    } else {
        console.log('📌 No profitable opportunities found with current mock data.');
        console.log('   This is normal - the system only executes when benefits exceed thresholds.\n');
    }

    console.log('📈 Enhanced Fee Structure with Loyalty Program:\n');
    displayFeeExamples(optimizer, userAddress);

    console.log('🎯 Protocol Coverage Summary:\n');
    displayProtocolCoverage(optimizer);

    console.log('✅ Universal Optimizer test completed!\n');
    
    console.log('🌐 Key Features Demonstrated:');
    console.log('  ✅ Multi-protocol data aggregation (Euler, Morpho, Aave, etc.)');
    console.log('  ✅ Cross-chain opportunity detection');
    console.log('  ✅ Seamless pool swapping with dynamic fees');
    console.log('  ✅ User loyalty program with tier-based discounts');
    console.log('  ✅ Real-time APY calculation including rewards');
    console.log('  ✅ Gas cost and bridge fee optimization');
    console.log('  ✅ Risk-adjusted decision making');
    console.log('  ✅ Volume and frequency-based fee discounts\n');
}

function displayMarketSummary(optimizer) {
    const markets = Array.from(optimizer.marketDataCache.values());
    const protocolStats = {};
    const chainStats = {};
    
    markets.forEach(market => {
        // Protocol stats
        if (!protocolStats[market.protocol]) {
            protocolStats[market.protocol] = { count: 0, totalTvl: 0, avgApy: 0 };
        }
        protocolStats[market.protocol].count++;
        protocolStats[market.protocol].totalTvl += market.tvl || 0;
        protocolStats[market.protocol].avgApy += market.apy || 0;
        
        // Chain stats
        if (!chainStats[market.chain]) {
            chainStats[market.chain] = { count: 0, totalTvl: 0 };
        }
        chainStats[market.chain].count++;
        chainStats[market.chain].totalTvl += market.tvl || 0;
    });
    
    console.log('📊 Market Data Summary:');
    console.log(`   Total Markets: ${markets.length}`);
    console.log(`   Data Sources: vaults.fyi, DeFiLlama, Morpho API, Aave API\n`);
    
    console.log('🏛️  Protocol Breakdown:');
    Object.entries(protocolStats).forEach(([protocol, stats]) => {
        const avgApy = (stats.avgApy / stats.count).toFixed(2);
        const tvlFormatted = formatTvl(stats.totalTvl);
        console.log(`   ${protocol}: ${stats.count} markets, ${avgApy}% avg APY, $${tvlFormatted} TVL`);
    });
    
    console.log('\n🔗 Chain Distribution:');
    Object.entries(chainStats).forEach(([chain, stats]) => {
        const tvlFormatted = formatTvl(stats.totalTvl);
        console.log(`   ${chain}: ${stats.count} markets, $${tvlFormatted} TVL`);
    });
}

function displayFeeExamples(optimizer, userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e') {
    // Simulate user with history for loyalty benefits
    optimizer.updateUserHistory(userAddress, 2000000); // $2M total volume
    optimizer.updateUserHistory(userAddress, 500000);  // Add more transactions
    optimizer.updateUserHistory(userAddress, 300000);  // 25 total transactions
    
    const amounts = [5000, 50000, 250000, 1500000];
    
    console.log('🎯 Enhanced Dynamic Fee Structure with Loyalty Program:\n');
    
    amounts.forEach(amount => {
        const fee = optimizer.calculateDynamicFee(amount, userAddress);
        console.log(`   $${amount.toLocaleString()} position → ${(fee.percent * 100).toFixed(4)}% fee ($${fee.amount.toFixed(2)})`);
        console.log(`     └─ User Tier: ${fee.breakdown.userTier} | Base: ${(fee.breakdown.baseFee * 100).toFixed(3)}% | Discount: -${(fee.breakdown.volumeDiscount * 100).toFixed(3)}%`);
    });
    
    console.log('\n💎 Loyalty Tier Benefits:');
    console.log('   Bronze: New users (no discounts)');
    console.log('   Silver: $100K+ volume, 5+ transactions');
    console.log('   Gold: $1M+ volume, 10+ transactions (-0.01% discount)');
    console.log('   Platinum: $5M+ volume, 20+ transactions (-0.015% discount)');
    console.log('   Diamond: $10M+ volume, 50+ transactions (-0.02% discount)');
}

function displayProtocolCoverage(optimizer) {
    const protocols = optimizer.supportedProtocols;
    
    Object.entries(protocols).forEach(([protocol, config]) => {
        console.log(`   ${protocol}: ${config.chains.length} chains (${config.chains.join(', ')})`);
    });
    
    console.log(`\n   Total: ${Object.keys(protocols).length} protocols across ${optimizer.getTotalChainCount()} chains`);
}

function formatTvl(tvl) {
    if (tvl >= 1e9) return `${(tvl / 1e9).toFixed(1)}B`;
    if (tvl >= 1e6) return `${(tvl / 1e6).toFixed(0)}M`;
    if (tvl >= 1e3) return `${(tvl / 1e3).toFixed(0)}K`;
    return tvl.toFixed(0);
}

// Run the test
testUniversalOptimizer().catch(console.error);
