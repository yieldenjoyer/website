const logger = require('../utils/logger').loggers.analyzer;

class YieldAnalyzer {
    constructor() {
        this.database = null;
        this.latestAnalysis = null;
        this.analysisCache = new Map();
    }
    
    async initialize(database) {
        this.database = database;
        logger.info('Yield Analyzer initialized');
    }
    
    async analyzeAll() {
        logger.info('Starting comprehensive yield analysis...');
        const startTime = Date.now();
        
        try {
            // Get latest yields from database
            const yields = await this.database.getLatestYields();
            
            if (!yields || yields.length === 0) {
                logger.warn('No yield data available for analysis');
                return null;
            }
            
            // Perform various analyses
            const analysis = {
                timestamp: Date.now(),
                totalOpportunities: yields.length,
                topYields: this.findTopYields(yields),
                bestOpportunities: this.findBestOpportunities(yields),
                riskAnalysis: this.performRiskAnalysis(yields),
                assetAnalysis: this.analyzeByAsset(yields),
                protocolAnalysis: this.analyzeByProtocol(yields),
                chainAnalysis: this.analyzeByChain(yields),
                trends: await this.analyzeTrends(yields),
                summary: this.generateSummary(yields)
            };
            
            // Cache the analysis
            this.latestAnalysis = analysis;
            this.analysisCache.set('latest', analysis);
            
            const duration = Date.now() - startTime;
            logger.info(`Yield analysis completed in ${duration}ms`);
            
            return analysis;
            
        } catch (error) {
            logger.error('Error during yield analysis:', error);
            throw error;
        }
    }
    
    findTopYields(yields, limit = 10) {
        return yields
            .sort((a, b) => b.totalApy - a.totalApy)
            .slice(0, limit)
            .map(yield_ => ({
                protocol: yield_.protocol,
                asset: yield_.asset,
                chain: yield_.chain,
                apy: yield_.totalApy,
                tvl: yield_.tvl,
                utilization: yield_.utilization,
                riskScore: this.calculateRiskScore(yield_)
            }));
    }
    
    findBestOpportunities(yields) {
        // Find opportunities with good risk-adjusted returns
        const opportunities = yields
            .map(yield_ => ({
                ...yield_,
                riskScore: this.calculateRiskScore(yield_),
                riskAdjustedReturn: this.calculateRiskAdjustedReturn(yield_)
            }))
            .filter(yield_ => yield_.riskAdjustedReturn > 3) // Minimum 3% risk-adjusted return
            .sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn)
            .slice(0, 15);
        
        return opportunities.map(opp => ({
            protocol: opp.protocol,
            asset: opp.asset,
            chain: opp.chain,
            apy: opp.totalApy,
            riskAdjustedReturn: opp.riskAdjustedReturn,
            riskScore: opp.riskScore,
            tvl: opp.tvl,
            reasoning: this.generateOpportunityReasoning(opp)
        }));
    }
    
    performRiskAnalysis(yields) {
        const riskBuckets = {
            low: [],
            medium: [],
            high: []
        };
        
        yields.forEach(yield_ => {
            const riskScore = this.calculateRiskScore(yield_);
            if (riskScore <= 0.3) riskBuckets.low.push(yield_);
            else if (riskScore <= 0.6) riskBuckets.medium.push(yield_);
            else riskBuckets.high.push(yield_);
        });
        
        return {
            distribution: {
                low: riskBuckets.low.length,
                medium: riskBuckets.medium.length,
                high: riskBuckets.high.length
            },
            avgApyByRisk: {
                low: this.calculateAverageApy(riskBuckets.low),
                medium: this.calculateAverageApy(riskBuckets.medium),
                high: this.calculateAverageApy(riskBuckets.high)
            },
            recommendations: {
                conservative: this.getTopByRisk(riskBuckets.low, 5),
                moderate: this.getTopByRisk(riskBuckets.medium, 5),
                aggressive: this.getTopByRisk(riskBuckets.high, 3)
            }
        };
    }
    
    analyzeByAsset(yields) {
        const assetGroups = yields.reduce((groups, yield_) => {
            if (!groups[yield_.asset]) {
                groups[yield_.asset] = [];
            }
            groups[yield_.asset].push(yield_);
            return groups;
        }, {});
        
        const assetAnalysis = {};
        
        for (const [asset, assetYields] of Object.entries(assetGroups)) {
            const sortedByApy = assetYields.sort((a, b) => b.totalApy - a.totalApy);
            
            assetAnalysis[asset] = {
                opportunities: assetYields.length,
                bestApy: sortedByApy[0]?.totalApy || 0,
                averageApy: this.calculateAverageApy(assetYields),
                totalTvl: assetYields.reduce((sum, y) => sum + (y.tvl || 0), 0),
                bestProtocol: sortedByApy[0]?.protocol,
                protocols: [...new Set(assetYields.map(y => y.protocol))],
                riskRange: {
                    min: Math.min(...assetYields.map(y => this.calculateRiskScore(y))),
                    max: Math.max(...assetYields.map(y => this.calculateRiskScore(y)))
                }
            };
        }
        
        return assetAnalysis;
    }
    
    analyzeByProtocol(yields) {
        const protocolGroups = yields.reduce((groups, yield_) => {
            if (!groups[yield_.protocol]) {
                groups[yield_.protocol] = [];
            }
            groups[yield_.protocol].push(yield_);
            return groups;
        }, {});
        
        const protocolAnalysis = {};
        
        for (const [protocol, protocolYields] of Object.entries(protocolGroups)) {
            protocolAnalysis[protocol] = {
                opportunities: protocolYields.length,
                averageApy: this.calculateAverageApy(protocolYields),
                totalTvl: protocolYields.reduce((sum, y) => sum + (y.tvl || 0), 0),
                assets: [...new Set(protocolYields.map(y => y.asset))],
                chains: [...new Set(protocolYields.map(y => y.chain))],
                bestOpportunity: protocolYields.sort((a, b) => b.totalApy - a.totalApy)[0],
                avgRiskScore: protocolYields.reduce((sum, y) => 
                    sum + this.calculateRiskScore(y), 0) / protocolYields.length
            };
        }
        
        return protocolAnalysis;
    }
    
    analyzeByChain(yields) {
        const chainGroups = yields.reduce((groups, yield_) => {
            if (!groups[yield_.chain]) {
                groups[yield_.chain] = [];
            }
            groups[yield_.chain].push(yield_);
            return groups;
        }, {});
        
        const chainAnalysis = {};
        
        for (const [chain, chainYields] of Object.entries(chainGroups)) {
            chainAnalysis[chain] = {
                opportunities: chainYields.length,
                averageApy: this.calculateAverageApy(chainYields),
                totalTvl: chainYields.reduce((sum, y) => sum + (y.tvl || 0), 0),
                protocols: [...new Set(chainYields.map(y => y.protocol))],
                assets: [...new Set(chainYields.map(y => y.asset))],
                gasEfficiency: this.estimateGasEfficiency(chain)
            };
        }
        
        return chainAnalysis;
    }
    
    async analyzeTrends(currentYields) {
        try {
            // Get historical data for trend analysis
            const trends = {};
            
            for (const yield_ of currentYields.slice(0, 10)) { // Analyze top 10
                const history = await this.database.getYieldHistory(
                    yield_.protocol, 
                    yield_.asset, 
                    yield_.chain, 
                    24 // 24 hours
                );
                
                if (history.length >= 2) {
                    const firstApy = history[0].totalApy;
                    const lastApy = history[history.length - 1].totalApy;
                    const change = lastApy - firstApy;
                    const changePercent = (change / firstApy) * 100;
                    
                    const key = `${yield_.protocol}-${yield_.asset}-${yield_.chain}`;
                    trends[key] = {
                        current: lastApy,
                        change: change,
                        changePercent: changePercent,
                        trend: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable',
                        volatility: this.calculateVolatility(history)
                    };
                }
            }
            
            return trends;
            
        } catch (error) {
            logger.warn('Error analyzing trends:', error.message);
            return {};
        }
    }
    
    generateSummary(yields) {
        const totalTvl = yields.reduce((sum, y) => sum + (y.tvl || 0), 0);
        const avgApy = this.calculateAverageApy(yields);
        const maxApy = Math.max(...yields.map(y => y.totalApy));
        
        const eulerYields = yields.filter(y => y.protocol === 'euler');
        const eulerAvgApy = this.calculateAverageApy(eulerYields);
        
        const stablecoinYields = yields.filter(y => 
            ['USDC', 'USDT', 'DAI', 'FRAX'].includes(y.asset)
        );
        
        const ethYields = yields.filter(y => 
            ['WETH', 'stETH', 'wstETH', 'weETH', 'ezETH'].includes(y.asset)
        );
        
        return {
            totalOpportunities: yields.length,
            totalTvl: totalTvl,
            averageApy: avgApy,
            maxApy: maxApy,
            euler: {
                opportunities: eulerYields.length,
                averageApy: eulerAvgApy,
                bestAsset: eulerYields.sort((a, b) => b.totalApy - a.totalApy)[0]?.asset
            },
            stablecoins: {
                opportunities: stablecoinYields.length,
                averageApy: this.calculateAverageApy(stablecoinYields),
                best: stablecoinYields.sort((a, b) => b.totalApy - a.totalApy)[0]
            },
            ethereum: {
                opportunities: ethYields.length,
                averageApy: this.calculateAverageApy(ethYields),
                best: ethYields.sort((a, b) => b.totalApy - a.totalApy)[0]
            },
            recommendations: this.generateRecommendations(yields)
        };
    }
    
    generateRecommendations(yields) {
        const recommendations = [];
        
        // Find highest APY opportunities
        const topApy = yields.sort((a, b) => b.totalApy - a.totalApy)[0];
        if (topApy) {
            recommendations.push({
                type: 'high_yield',
                title: `Highest APY: ${topApy.totalApy.toFixed(2)}%`,
                description: `${topApy.asset} on ${topApy.protocol} (${topApy.chain})`,
                action: 'consider_supply',
                priority: 'high'
            });
        }
        
        // Find best Euler opportunities
        const eulerYields = yields.filter(y => y.protocol === 'euler');
        if (eulerYields.length > 0) {
            const bestEuler = eulerYields.sort((a, b) => b.totalApy - a.totalApy)[0];
            recommendations.push({
                type: 'euler_opportunity',
                title: `Best Euler Yield: ${bestEuler.totalApy.toFixed(2)}%`,
                description: `${bestEuler.asset} with ${bestEuler.utilization?.toFixed(1) || 'N/A'}% utilization`,
                action: 'supply_euler',
                priority: 'high'
            });
        }
        
        // Find underutilized high-yield opportunities
        const underutilized = yields.filter(y => 
            y.utilization && y.utilization < 50 && y.totalApy > 3
        );
        
        if (underutilized.length > 0) {
            const best = underutilized.sort((a, b) => b.totalApy - a.totalApy)[0];
            recommendations.push({
                type: 'underutilized',
                title: 'Low Competition Opportunity',
                description: `${best.asset} on ${best.protocol}: ${best.totalApy.toFixed(2)}% APY, ${best.utilization.toFixed(1)}% utilization`,
                action: 'supply_early',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
    
    // Helper methods
    calculateRiskScore(yield_) {
        let risk = 0;
        
        // Protocol risk
        const protocolRisks = {
            'euler': 0.3,
            'aave-v3': 0.1,
            'compound-v3': 0.1,
            'morpho-blue': 0.2
        };
        risk += protocolRisks[yield_.protocol] || 0.5;
        
        // Asset risk
        const assetRisks = {
            'USDC': 0.05, 'USDT': 0.1, 'DAI': 0.05,
            'WETH': 0.2, 'WBTC': 0.3, 'USDe': 0.4
        };
        risk += assetRisks[yield_.asset] || 0.4;
        
        // TVL risk
        if (yield_.tvl < 1000000) risk += 0.3;
        else if (yield_.tvl < 10000000) risk += 0.1;
        
        // Utilization risk
        if (yield_.utilization && yield_.utilization > 90) risk += 0.2;
        
        return Math.min(risk, 1.0);
    }
    
    calculateRiskAdjustedReturn(yield_) {
        const riskScore = this.calculateRiskScore(yield_);
        return yield_.totalApy / (1 + riskScore);
    }
    
    calculateAverageApy(yields) {
        if (!yields || yields.length === 0) return 0;
        const sum = yields.reduce((acc, y) => acc + y.totalApy, 0);
        return sum / yields.length;
    }
    
    getTopByRisk(yields, limit) {
        return yields
            .sort((a, b) => b.totalApy - a.totalApy)
            .slice(0, limit)
            .map(y => ({
                protocol: y.protocol,
                asset: y.asset,
                apy: y.totalApy,
                tvl: y.tvl
            }));
    }
    
    generateOpportunityReasoning(opportunity) {
        const reasons = [];
        
        if (opportunity.riskAdjustedReturn > 8) {
            reasons.push('Excellent risk-adjusted return');
        }
        
        if (opportunity.utilization && opportunity.utilization < 50) {
            reasons.push('Low utilization suggests stable rates');
        }
        
        if (opportunity.tvl > 10000000) {
            reasons.push('High TVL indicates strong liquidity');
        }
        
        if (opportunity.protocol === 'euler') {
            reasons.push('Euler protocol efficiency');
        }
        
        return reasons.join(', ') || 'Good yield opportunity';
    }
    
    calculateVolatility(history) {
        if (history.length < 3) return 0;
        
        const apyValues = history.map(h => h.totalApy);
        const mean = apyValues.reduce((sum, val) => sum + val, 0) / apyValues.length;
        const squaredDiffs = apyValues.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / apyValues.length;
        
        return Math.sqrt(variance);
    }
    
    estimateGasEfficiency(chain) {
        const gasEfficiency = {
            ethereum: 0.3,  // Higher gas costs
            polygon: 0.9,  // Low gas costs
            arbitrum: 0.8,  // Medium gas costs
            optimism: 0.8   // Medium gas costs
        };
        
        return gasEfficiency[chain] || 0.5;
    }
    
    getLatestAnalysis() {
        return this.latestAnalysis;
    }
}

module.exports = YieldAnalyzer;
