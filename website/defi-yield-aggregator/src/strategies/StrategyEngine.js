const logger = require('../utils/logger').loggers.strategy;

class StrategyEngine {
    constructor() {
        this.name = 'StrategyEngine';
        this.database = null;
        this.yieldAnalyzer = null;
        this.riskThresholds = {
            conservative: { maxRisk: 0.3, minTVL: 1000000 },
            moderate: { maxRisk: 0.6, minTVL: 100000 },
            aggressive: { maxRisk: 1.0, minTVL: 10000 }
        };
        this.gasEstimates = {
            ethereum: {
                supply: 150000,
                withdraw: 100000,
                migrate: 250000
            },
            polygon: {
                supply: 80000,
                withdraw: 60000,
                migrate: 140000
            },
            arbitrum: {
                supply: 120000,
                withdraw: 80000,
                migrate: 200000
            }
        };
    }
    
    async initialize(database, yieldAnalyzer) {
        this.database = database;
        this.yieldAnalyzer = yieldAnalyzer;
        logger.info('Strategy Engine initialized');
    }
    
    async generateStrategies(yields) {
        logger.info('Generating yield strategies...');
        
        const strategies = [];
        
        try {
            // Generate different types of strategies
            const migrationStrategies = await this.generateMigrationStrategies(yields);
            const optimizationStrategies = await this.generateOptimizationStrategies(yields);
            const riskBalancedStrategies = await this.generateRiskBalancedStrategies(yields);
            const crossChainStrategies = await this.generateCrossChainStrategies(yields);
            
            strategies.push(
                ...migrationStrategies,
                ...optimizationStrategies,
                ...riskBalancedStrategies,
                ...crossChainStrategies
            );
            
            // Score and rank strategies
            const rankedStrategies = this.rankStrategies(strategies);
            
            logger.info(`Generated ${rankedStrategies.length} strategies`);
            return rankedStrategies;
            
        } catch (error) {
            logger.error('Error generating strategies:', error);
            throw error;
        }
    }
    
    async generateMigrationStrategies(yields) {
        const strategies = [];
        
        // Group yields by asset
        const yieldsByAsset = this.groupYieldsByAsset(yields);
        
        for (const [asset, assetYields] of Object.entries(yieldsByAsset)) {
            if (assetYields.length < 2) continue;
            
            // Sort by total APY
            const sortedYields = assetYields.sort((a, b) => b.totalApy - a.totalApy);
            const bestYield = sortedYields[0];
            
            // Find migration opportunities
            for (let i = 1; i < sortedYields.length; i++) {
                const currentYield = sortedYields[i];
                const apyDifference = bestYield.totalApy - currentYield.totalApy;
                
                if (apyDifference > 0.5) { // At least 0.5% difference
                    const gasEstimate = await this.estimateGasCosts(
                        currentYield.chain,
                        'migrate',
                        currentYield.protocol,
                        bestYield.protocol
                    );
                    
                    const netBenefit = await this.calculateNetBenefit(
                        apyDifference,
                        gasEstimate,
                        10000 // Assume $10k migration
                    );
                    
                    if (netBenefit.isPositive) {
                        strategies.push({
                            type: 'migration',
                            action: 'move_funds',
                            from: {
                                protocol: currentYield.protocol,
                                asset: currentYield.asset,
                                apy: currentYield.totalApy,
                                chain: currentYield.chain
                            },
                            to: {
                                protocol: bestYield.protocol,
                                asset: bestYield.asset,
                                apy: bestYield.totalApy,
                                chain: bestYield.chain
                            },
                            expectedImprovement: apyDifference,
                            estimatedGas: gasEstimate,
                            netBenefit: netBenefit,
                            confidence: this.calculateConfidence(currentYield, bestYield),
                            riskLevel: this.assessRiskLevel(bestYield),
                            steps: this.generateMigrationSteps(currentYield, bestYield)
                        });
                    }
                }
            }
        }
        
        return strategies;
    }
    
    async generateOptimizationStrategies(yields) {
        const strategies = [];
        
        // Find opportunities for yield optimization
        const eulerYields = yields.filter(y => y.protocol === 'euler');
        
        for (const eulerYield of eulerYields) {
            // Strategy 1: Identify low utilization, high APY opportunities
            if (eulerYield.utilization < 50 && eulerYield.totalApy > 3) {
                strategies.push({
                    type: 'optimization',
                    action: 'supply_underutilized',
                    protocol: 'euler',
                    asset: eulerYield.asset,
                    apy: eulerYield.totalApy,
                    utilization: eulerYield.utilization,
                    tvl: eulerYield.tvl,
                    reasoning: 'Low utilization suggests stable high yields',
                    confidence: 0.8,
                    riskLevel: 'low',
                    expectedDuration: '1-3 months',
                    steps: [
                        {
                            action: 'approve',
                            contract: eulerYield.metadata.underlyingAddress,
                            spender: eulerYield.metadata.eTokenAddress
                        },
                        {
                            action: 'supply',
                            contract: eulerYield.metadata.eTokenAddress,
                            method: 'deposit',
                            asset: eulerYield.asset
                        }
                    ]
                });
            }
            
            // Strategy 2: Borrowing arbitrage opportunities
            if (eulerYield.borrowApy && eulerYield.borrowApy < eulerYield.totalApy - 2) {
                strategies.push({
                    type: 'optimization',
                    action: 'borrow_arbitrage',
                    protocol: 'euler',
                    asset: eulerYield.asset,
                    supplyApy: eulerYield.totalApy,
                    borrowApy: eulerYield.borrowApy,
                    spread: eulerYield.totalApy - eulerYield.borrowApy,
                    reasoning: 'Borrow rate significantly below supply rate',
                    confidence: 0.7,
                    riskLevel: 'medium',
                    maxLeverage: 3,
                    steps: this.generateLeverageSteps(eulerYield)
                });
            }
        }
        
        return strategies;
    }
    
    async generateRiskBalancedStrategies(yields) {
        const strategies = [];
        
        // Create portfolio strategies for different risk profiles
        for (const [profileName, profile] of Object.entries(this.riskThresholds)) {
            const suitableYields = yields.filter(y => 
                this.calculateRiskScore(y) <= profile.maxRisk &&
                y.tvl >= profile.minTVL
            );
            
            if (suitableYields.length > 0) {
                const portfolio = this.createOptimalPortfolio(suitableYields, profileName);
                
                strategies.push({
                    type: 'portfolio',
                    action: 'balanced_allocation',
                    profile: profileName,
                    allocation: portfolio.allocation,
                    expectedApy: portfolio.expectedApy,
                    riskScore: portfolio.riskScore,
                    confidence: portfolio.confidence,
                    diversificationScore: portfolio.diversificationScore,
                    steps: portfolio.steps
                });
            }
        }
        
        return strategies;
    }
    
    async generateCrossChainStrategies(yields) {
        const strategies = [];
        
        // Group yields by asset across chains
        const crossChainOpportunities = this.findCrossChainArbitrage(yields);
        
        for (const opportunity of crossChainOpportunities) {
            const bridgeCosts = await this.estimateBridgeCosts(
                opportunity.from.chain,
                opportunity.to.chain,
                opportunity.asset
            );
            
            const netBenefit = await this.calculateNetBenefit(
                opportunity.apyDifference,
                bridgeCosts.totalCost,
                opportunity.suggestedAmount
            );
            
            if (netBenefit.isPositive && netBenefit.breakEvenDays < 90) {
                strategies.push({
                    type: 'cross_chain',
                    action: 'bridge_and_supply',
                    from: opportunity.from,
                    to: opportunity.to,
                    bridgeCosts: bridgeCosts,
                    netBenefit: netBenefit,
                    confidence: 0.6,
                    riskLevel: 'medium',
                    steps: this.generateCrossChainSteps(opportunity, bridgeCosts)
                });
            }
        }
        
        return strategies;
    }
    
    groupYieldsByAsset(yields) {
        return yields.reduce((groups, yield_) => {
            if (!groups[yield_.asset]) {
                groups[yield_.asset] = [];
            }
            groups[yield_.asset].push(yield_);
            return groups;
        }, {});
    }
    
    async estimateGasCosts(chain, operation, fromProtocol = null, toProtocol = null) {
        const gasPrice = await this.getCurrentGasPrice(chain);
        const gasLimit = this.gasEstimates[chain]?.[operation] || 200000;
        
        const ethPrice = await this.getEthPrice();
        const gasUsed = gasLimit * (toProtocol ? 1.5 : 1); // Extra gas for complex operations
        
        return {
            gasLimit: gasUsed,
            gasPrice: gasPrice,
            gasCostETH: (gasUsed * gasPrice) / 1e18,
            gasCostUSD: ((gasUsed * gasPrice) / 1e18) * ethPrice,
            chain: chain
        };
    }
    
    async calculateNetBenefit(apyDifference, gasCosts, amount) {
        const annualBenefit = (amount * apyDifference) / 100;
        const breakEvenDays = (gasCosts.gasCostUSD / annualBenefit) * 365;
        
        return {
            isPositive: breakEvenDays < 365,
            breakEvenDays: breakEvenDays,
            annualBenefit: annualBenefit,
            gasCost: gasCosts.gasCostUSD,
            netAnnualBenefit: annualBenefit - gasCosts.gasCostUSD
        };
    }
    
    calculateConfidence(fromYield, toYield) {
        let confidence = 0.5; // Base confidence
        
        // Higher TVL increases confidence
        if (toYield.tvl > 10000000) confidence += 0.2;
        else if (toYield.tvl > 1000000) confidence += 0.1;
        
        // Established protocols increase confidence
        if (['euler', 'aave-v3', 'compound-v3'].includes(toYield.protocol)) {
            confidence += 0.2;
        }
        
        // Lower utilization in lending protocols increases confidence
        if (toYield.type === 'lending' && toYield.utilization < 70) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    assessRiskLevel(yield_) {
        const riskScore = this.calculateRiskScore(yield_);
        
        if (riskScore <= 0.3) return 'low';
        if (riskScore <= 0.6) return 'medium';
        return 'high';
    }
    
    calculateRiskScore(yield_) {
        let risk = 0;
        
        // Protocol risk
        const protocolRisks = {
            'euler': 0.3,
            'aave-v3': 0.1,
            'compound-v3': 0.1,
            'morpho-blue': 0.2,
            'uniswap-v3': 0.4,
            'curve': 0.2,
            'pendle': 0.5,
            'gmx': 0.8
        };
        risk += protocolRisks[yield_.protocol] || 0.5;
        
        // Asset risk
        const assetRisks = {
            'USDC': 0.05,
            'USDT': 0.1,
            'DAI': 0.05,
            'WETH': 0.2,
            'WBTC': 0.3,
            'USDe': 0.4,
            'stETH': 0.25
        };
        risk += assetRisks[yield_.asset] || 0.4;
        
        // TVL risk (lower TVL = higher risk)
        if (yield_.tvl < 1000000) risk += 0.3;
        else if (yield_.tvl < 10000000) risk += 0.1;
        
        // Utilization risk for lending protocols
        if (yield_.type === 'lending' && yield_.utilization > 90) {
            risk += 0.2;
        }
        
        return Math.min(risk, 1.0);
    }
    
    createOptimalPortfolio(yields, profile) {
        // Sort yields by risk-adjusted return
        const riskAdjusted = yields.map(y => ({
            ...y,
            riskAdjustedReturn: y.totalApy / (1 + this.calculateRiskScore(y))
        })).sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
        
        const allocation = [];
        let totalWeight = 0;
        
        // Allocate based on risk profile
        const maxPositions = profile === 'conservative' ? 3 : profile === 'moderate' ? 5 : 8;
        const topYields = riskAdjusted.slice(0, maxPositions);
        
        topYields.forEach((yield_, index) => {
            const baseWeight = 100 / topYields.length;
            const riskAdjustment = profile === 'conservative' ? 
                (yield_.riskAdjustedReturn / topYields[0].riskAdjustedReturn) :
                1;
            
            const weight = Math.round(baseWeight * riskAdjustment);
            
            allocation.push({
                protocol: yield_.protocol,
                asset: yield_.asset,
                chain: yield_.chain,
                weight: weight,
                apy: yield_.totalApy,
                riskScore: this.calculateRiskScore(yield_)
            });
            
            totalWeight += weight;
        });
        
        // Normalize weights to 100%
        allocation.forEach(pos => {
            pos.weight = Math.round((pos.weight / totalWeight) * 100);
        });
        
        const expectedApy = allocation.reduce((sum, pos) => 
            sum + (pos.apy * pos.weight / 100), 0
        );
        
        const riskScore = allocation.reduce((sum, pos) => 
            sum + (pos.riskScore * pos.weight / 100), 0
        );
        
        return {
            allocation,
            expectedApy,
            riskScore,
            confidence: 0.8,
            diversificationScore: allocation.length / maxPositions,
            steps: this.generatePortfolioSteps(allocation)
        };
    }
    
    findCrossChainArbitrage(yields) {
        const opportunities = [];
        const yieldsByAsset = this.groupYieldsByAsset(yields);
        
        for (const [asset, assetYields] of Object.entries(yieldsByAsset)) {
            const chainYields = assetYields.reduce((chains, yield_) => {
                if (!chains[yield_.chain]) {
                    chains[yield_.chain] = [];
                }
                chains[yield_.chain].push(yield_);
                return chains;
            }, {});
            
            const chainNames = Object.keys(chainYields);
            
            for (let i = 0; i < chainNames.length; i++) {
                for (let j = i + 1; j < chainNames.length; j++) {
                    const chain1 = chainNames[i];
                    const chain2 = chainNames[j];
                    
                    const best1 = chainYields[chain1].sort((a, b) => b.totalApy - a.totalApy)[0];
                    const best2 = chainYields[chain2].sort((a, b) => b.totalApy - a.totalApy)[0];
                    
                    if (best1.totalApy > best2.totalApy + 1) {
                        opportunities.push({
                            asset,
                            from: { chain: chain2, yield: best2 },
                            to: { chain: chain1, yield: best1 },
                            apyDifference: best1.totalApy - best2.totalApy,
                            suggestedAmount: 10000 // $10k default
                        });
                    }
                }
            }
        }
        
        return opportunities;
    }
    
    generateMigrationSteps(from, to) {
        const steps = [];
        
        if (from.chain === to.chain) {
            // Same chain migration
            steps.push({
                step: 1,
                action: 'withdraw',
                protocol: from.protocol,
                asset: from.asset,
                description: `Withdraw ${from.asset} from ${from.protocol}`
            });
            
            steps.push({
                step: 2,
                action: 'approve',
                contract: to.metadata?.underlyingAddress || to.asset,
                spender: to.protocol,
                description: `Approve ${to.protocol} to spend ${to.asset}`
            });
            
            steps.push({
                step: 3,
                action: 'supply',
                protocol: to.protocol,
                asset: to.asset,
                description: `Supply ${to.asset} to ${to.protocol}`
            });
        } else {
            // Cross-chain migration
            steps.push(...this.generateCrossChainSteps({
                from: { chain: from.chain, yield: from },
                to: { chain: to.chain, yield: to }
            }, {}));
        }
        
        return steps;
    }
    
    generateLeverageSteps(yield_) {
        return [
            {
                step: 1,
                action: 'supply_collateral',
                asset: yield_.asset,
                description: `Supply ${yield_.asset} as collateral on Euler`
            },
            {
                step: 2,
                action: 'borrow',
                asset: yield_.asset,
                amount: '50%',
                description: `Borrow ${yield_.asset} against collateral`
            },
            {
                step: 3,
                action: 'supply_borrowed',
                asset: yield_.asset,
                description: 'Supply borrowed funds to increase position'
            }
        ];
    }
    
    generateCrossChainSteps(opportunity, bridgeCosts) {
        return [
            {
                step: 1,
                action: 'withdraw',
                chain: opportunity.from.chain,
                protocol: opportunity.from.yield.protocol,
                description: 'Withdraw funds from current position'
            },
            {
                step: 2,
                action: 'bridge',
                from_chain: opportunity.from.chain,
                to_chain: opportunity.to.chain,
                bridge: bridgeCosts.recommendedBridge || 'stargate',
                description: 'Bridge assets to target chain'
            },
            {
                step: 3,
                action: 'supply',
                chain: opportunity.to.chain,
                protocol: opportunity.to.yield.protocol,
                description: 'Supply assets on target chain'
            }
        ];
    }
    
    generatePortfolioSteps(allocation) {
        return allocation.map((position, index) => ({
            step: index + 1,
            action: 'allocate',
            protocol: position.protocol,
            asset: position.asset,
            chain: position.chain,
            percentage: position.weight,
            description: `Allocate ${position.weight}% to ${position.protocol} ${position.asset}`
        }));
    }
    
    rankStrategies(strategies) {
        return strategies
            .map(strategy => ({
                ...strategy,
                score: this.calculateStrategyScore(strategy)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 20); // Return top 20 strategies
    }
    
    calculateStrategyScore(strategy) {
        let score = 0;
        
        // Base score from expected improvement
        if (strategy.expectedImprovement) {
            score += strategy.expectedImprovement * 10;
        }
        
        if (strategy.expectedApy) {
            score += strategy.expectedApy * 2;
        }
        
        // Confidence multiplier
        score *= (strategy.confidence || 0.5);
        
        // Risk penalty
        const riskPenalties = { low: 1, medium: 0.8, high: 0.5 };
        score *= riskPenalties[strategy.riskLevel] || 0.7;
        
        // Net benefit bonus
        if (strategy.netBenefit?.isPositive) {
            score += strategy.netBenefit.netAnnualBenefit / 100;
        }
        
        return score;
    }
    
    async getCurrentGasPrice(chain) {
        // Simplified gas price - in production, fetch from chain
        const gasPrices = {
            ethereum: 20e9, // 20 gwei
            polygon: 30e9,  // 30 gwei
            arbitrum: 1e9,  // 1 gwei
            optimism: 1e9   // 1 gwei
        };
        
        return gasPrices[chain] || 20e9;
    }
    
    async getEthPrice() {
        // Simplified - in production, fetch from price API
        return 2500; // $2500 per ETH
    }
    
    async estimateBridgeCosts(fromChain, toChain, asset) {
        // Simplified bridge cost estimation
        const baseCosts = {
            ethereum: { gas: 0.01, time: 15 },
            polygon: { gas: 0.001, time: 10 },
            arbitrum: { gas: 0.005, time: 10 },
            optimism: { gas: 0.005, time: 10 }
        };
        
        const fromCost = baseCosts[fromChain] || baseCosts.ethereum;
        const toCost = baseCosts[toChain] || baseCosts.ethereum;
        
        return {
            totalCost: (fromCost.gas + toCost.gas) * 2500, // ETH price
            timeMinutes: Math.max(fromCost.time, toCost.time),
            recommendedBridge: 'stargate',
            slippage: 0.1 // 0.1%
        };
    }
}

module.exports = StrategyEngine;
