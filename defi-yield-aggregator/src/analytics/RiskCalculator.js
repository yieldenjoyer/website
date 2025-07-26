const logger = require('../utils/logger').loggers.risk;

class RiskCalculator {
    constructor() {
        this.riskFactors = {
            // Protocol risk scoring (0-100, lower is safer)
            protocolRisk: {
                'euler': 25,      // Established, audited
                'aave': 20,       // Blue chip
                'compound': 30,   // Established but governance risks
                'morpho': 35,     // Newer but innovative
                'default': 50
            },
            
            // Chain risk scoring (0-100, lower is safer)
            chainRisk: {
                1: 10,      // Ethereum mainnet
                137: 25,    // Polygon
                42161: 20,  // Arbitrum
                10: 20,     // Optimism
                8453: 30,   // Base
                'default': 40
            },
            
            // Asset risk scoring (0-100, lower is safer)
            assetRisk: {
                'USDC': 10,
                'USDT': 15,
                'DAI': 12,
                'WETH': 25,
                'WBTC': 30,
                'stETH': 35,
                'default': 50
            }
        };
        
        // Reward token multipliers for different types
        this.rewardMultipliers = {
            'governance': 0.7,    // Governance tokens (70% of face value due to liquidity)
            'points': 0.3,        // Points systems (30% estimated conversion)
            'stable': 0.95,       // Stable rewards (95% of face value)
            'native': 0.85,       // Native chain tokens (85% due to volatility)
            'default': 0.5        // Unknown rewards (50% haircut)
        };
    }
    
    calculateRiskAdjustedAPY(marketData) {
        try {
            const {
                baseAPY,
                protocol,
                chainId,
                asset,
                rewards = [],
                utilization = 0,
                liquidityDepth = 0,
                volatility = 0,
                marketAge = 0
            } = marketData;
            
            // Calculate base risk score
            const riskScore = this.calculateRiskScore({
                protocol,
                chainId,
                asset,
                utilization,
                liquidityDepth,
                volatility,
                marketAge
            });
            
            // Calculate total reward APY
            const rewardAPY = this.calculateRewardAPY(rewards);
            
            // Combined APY before risk adjustment
            const combinedAPY = baseAPY + rewardAPY;
            
            // Apply risk adjustment
            const riskMultiplier = this.getRiskMultiplier(riskScore);
            const riskAdjustedAPY = combinedAPY * riskMultiplier;
            
            // Calculate confidence score based on data quality
            const confidenceScore = this.calculateConfidenceScore(marketData);
            
            return {
                riskAdjustedAPY,
                baseAPY,
                rewardAPY,
                combinedAPY,
                riskScore,
                riskMultiplier,
                confidenceScore,
                breakdown: {
                    protocolRisk: this.riskFactors.protocolRisk[protocol] || this.riskFactors.protocolRisk.default,
                    chainRisk: this.riskFactors.chainRisk[chainId] || this.riskFactors.chainRisk.default,
                    assetRisk: this.riskFactors.assetRisk[asset] || this.riskFactors.assetRisk.default,
                    utilizationRisk: this.calculateUtilizationRisk(utilization),
                    liquidityRisk: this.calculateLiquidityRisk(liquidityDepth),
                    volatilityRisk: this.calculateVolatilityRisk(volatility),
                    ageRisk: this.calculateAgeRisk(marketAge)
                },
                rewardBreakdown: this.getRewardBreakdown(rewards)
            };
            
        } catch (error) {
            logger.error('Failed to calculate risk-adjusted APY:', error);
            return {
                riskAdjustedAPY: 0,
                baseAPY: 0,
                rewardAPY: 0,
                combinedAPY: 0,
                riskScore: 100,
                riskMultiplier: 0.1,
                confidenceScore: 0,
                error: error.message
            };
        }
    }
    
    calculateRiskScore(factors) {
        const {
            protocol,
            chainId,
            asset,
            utilization,
            liquidityDepth,
            volatility,
            marketAge
        } = factors;
        
        // Get base risk factors
        const protocolRisk = this.riskFactors.protocolRisk[protocol] || this.riskFactors.protocolRisk.default;
        const chainRisk = this.riskFactors.chainRisk[chainId] || this.riskFactors.chainRisk.default;
        const assetRisk = this.riskFactors.assetRisk[asset] || this.riskFactors.assetRisk.default;
        
        // Calculate dynamic risk factors
        const utilizationRisk = this.calculateUtilizationRisk(utilization);
        const liquidityRisk = this.calculateLiquidityRisk(liquidityDepth);
        const volatilityRisk = this.calculateVolatilityRisk(volatility);
        const ageRisk = this.calculateAgeRisk(marketAge);
        
        // Weighted average (protocol and chain are most important)
        const riskScore = (
            protocolRisk * 0.25 +
            chainRisk * 0.20 +
            assetRisk * 0.15 +
            utilizationRisk * 0.15 +
            liquidityRisk * 0.10 +
            volatilityRisk * 0.10 +
            ageRisk * 0.05
        );
        
        return Math.min(100, Math.max(0, riskScore));
    }
    
    calculateUtilizationRisk(utilization) {
        // Higher utilization increases risk (liquidity crunch)
        // Sweet spot is 70-80% utilization
        if (utilization < 0.5) return 10; // Low utilization, low risk but poor capital efficiency
        if (utilization < 0.7) return 5;  // Good utilization
        if (utilization < 0.8) return 8;  // Optimal range
        if (utilization < 0.9) return 25; // High utilization, risky
        if (utilization < 0.95) return 50; // Very high utilization
        return 80; // Extremely high utilization, very risky
    }
    
    calculateLiquidityRisk(liquidityDepth) {
        // Lower liquidity = higher risk
        // liquidityDepth in USD
        if (liquidityDepth > 100000000) return 5;  // >$100M very liquid
        if (liquidityDepth > 50000000) return 10;  // >$50M good liquidity
        if (liquidityDepth > 10000000) return 20;  // >$10M decent liquidity
        if (liquidityDepth > 1000000) return 40;   // >$1M low liquidity
        if (liquidityDepth > 100000) return 60;    // >$100K very low liquidity
        return 80; // <$100K extremely low liquidity
    }
    
    calculateVolatilityRisk(volatility) {
        // Higher volatility = higher risk
        // volatility as standard deviation %
        if (volatility < 0.05) return 5;   // <5% very stable
        if (volatility < 0.10) return 10;  // <10% stable
        if (volatility < 0.20) return 20;  // <20% moderate volatility
        if (volatility < 0.30) return 35;  // <30% high volatility
        if (volatility < 0.50) return 55;  // <50% very high volatility
        return 75; // >50% extremely volatile
    }
    
    calculateAgeRisk(marketAge) {
        // Newer markets = higher risk
        // marketAge in days
        if (marketAge > 365) return 5;     // >1 year, established
        if (marketAge > 180) return 15;    // >6 months, mature
        if (marketAge > 90) return 25;     // >3 months, developing
        if (marketAge > 30) return 40;     // >1 month, new
        if (marketAge > 7) return 60;      // >1 week, very new
        return 80; // <1 week, extremely new
    }
    
    getRiskMultiplier(riskScore) {
        // Convert risk score (0-100) to multiplier (0.1-1.0)
        // Lower risk = higher multiplier (less penalty)
        return Math.max(0.1, Math.min(1.0, (100 - riskScore) / 100));
    }
    
    calculateRewardAPY(rewards) {
        let totalRewardAPY = 0;
        
        for (const reward of rewards) {
            const {
                type = 'default',
                estimatedAPY = 0,
                confidence = 1.0,
                liquidity = 1.0,
                claimFrequency = 1.0
            } = reward;
            
            // Get multiplier for reward type
            const typeMultiplier = this.rewardMultipliers[type] || this.rewardMultipliers.default;
            
            // Apply various adjustments
            const adjustedAPY = estimatedAPY * 
                typeMultiplier *     // Type-based haircut
                confidence *         // Confidence in the estimate
                liquidity *          // Liquidity adjustment
                claimFrequency;      // How often can you claim
            
            totalRewardAPY += adjustedAPY;
        }
        
        return totalRewardAPY;
    }
    
    getRewardBreakdown(rewards) {
        return rewards.map(reward => {
            const {
                type = 'default',
                estimatedAPY = 0,
                confidence = 1.0,
                liquidity = 1.0,
                claimFrequency = 1.0,
                token,
                description
            } = reward;
            
            const typeMultiplier = this.rewardMultipliers[type] || this.rewardMultipliers.default;
            const adjustedAPY = estimatedAPY * typeMultiplier * confidence * liquidity * claimFrequency;
            
            return {
                token,
                type,
                description,
                rawAPY: estimatedAPY,
                adjustedAPY,
                typeMultiplier,
                confidence,
                liquidity,
                claimFrequency,
                haircut: (estimatedAPY - adjustedAPY) / estimatedAPY
            };
        });
    }
    
    calculateConfidenceScore(marketData) {
        let score = 100;
        
        // Penalize missing data
        if (!marketData.utilization || marketData.utilization === 0) score -= 15;
        if (!marketData.liquidityDepth || marketData.liquidityDepth === 0) score -= 20;
        if (!marketData.volatility) score -= 10;
        if (!marketData.marketAge) score -= 5;
        if (!marketData.rewards || marketData.rewards.length === 0) score -= 10;
        
        // Penalize low data quality
        if (marketData.lastUpdated) {
            const hoursStale = (Date.now() - new Date(marketData.lastUpdated)) / (1000 * 60 * 60);
            if (hoursStale > 24) score -= 30;
            else if (hoursStale > 12) score -= 15;
            else if (hoursStale > 6) score -= 5;
        }
        
        return Math.max(0, score);
    }
    
    compareOpportunities(currentPosition, alternatives, userPreferences = {}) {
        const {
            riskTolerance = 0.5,        // 0-1, higher = more risk tolerance
            yieldPreference = 0.7,      // 0-1, higher = prioritize yield over safety
            minImprovement = 0.02,      // Minimum 2% improvement to consider
            maxGasCostPercent = 0.01,   // Max 1% of position value in gas costs
            includeRewards = true,      // Whether to factor in reward tokens
            preferredChains = [],       // Preferred chains (lower switch cost)
            maxRiskScore = 60          // Maximum acceptable risk score
        } = userPreferences;
        
        const currentAnalysis = this.calculateRiskAdjustedAPY(currentPosition);
        const opportunities = [];
        
        for (const alternative of alternatives) {
            const altAnalysis = this.calculateRiskAdjustedAPY(alternative);
            
            // Skip if risk is too high
            if (altAnalysis.riskScore > maxRiskScore) {
                continue;
            }
            
            // Calculate improvement
            const yieldImprovement = altAnalysis.riskAdjustedAPY - currentAnalysis.riskAdjustedAPY;
            
            // Skip if improvement is too small
            if (yieldImprovement < minImprovement) {
                continue;
            }
            
            // Estimate switching costs
            const switchingCost = this.estimateSwitchingCost(currentPosition, alternative);
            
            // Skip if switching cost is too high
            if (switchingCost.totalCostPercent > maxGasCostPercent) {
                continue;
            }
            
            // Calculate net improvement after costs
            const netImprovement = yieldImprovement - switchingCost.annualizedCostPercent;
            
            // Skip if net improvement is negative
            if (netImprovement <= 0) {
                continue;
            }
            
            // Calculate preference score
            const preferenceScore = this.calculatePreferenceScore(
                alternative,
                altAnalysis,
                userPreferences
            );
            
            opportunities.push({
                market: alternative,
                analysis: altAnalysis,
                yieldImprovement,
                netImprovement,
                switchingCost,
                preferenceScore,
                breakEvenDays: switchingCost.totalCostPercent / (yieldImprovement / 365),
                recommendation: netImprovement > minImprovement ? 'RECOMMENDED' : 'CONSIDER'
            });
        }
        
        // Sort by net improvement descending
        opportunities.sort((a, b) => b.netImprovement - a.netImprovement);
        
        return {
            currentPosition: {
                analysis: currentAnalysis,
                ...currentPosition
            },
            opportunities: opportunities.slice(0, 10), // Top 10 opportunities
            summary: {
                totalOpportunities: opportunities.length,
                bestImprovement: opportunities[0]?.netImprovement || 0,
                averageImprovement: opportunities.reduce((sum, opp) => sum + opp.netImprovement, 0) / opportunities.length || 0,
                recommendedCount: opportunities.filter(opp => opp.recommendation === 'RECOMMENDED').length
            }
        };
    }
    
    estimateSwitchingCost(current, target) {
        // Estimate gas costs for the switch
        let baseCost = 0.01; // Base 0.01 ETH for withdraw + deposit
        
        // Add bridge cost if different chains
        if (current.chainId !== target.chainId) {
            baseCost += 0.02; // Additional 0.02 ETH for bridge
        }
        
        // Add complexity cost for different protocols
        if (current.protocol !== target.protocol) {
            baseCost += 0.005; // Additional complexity
        }
        
        // Convert to percentage of position value (assuming ETH at $2500)
        const ethPrice = 2500;
        const costUSD = baseCost * ethPrice;
        const positionValueUSD = current.totalValue || 10000; // Default $10k if not provided
        
        const totalCostPercent = costUSD / positionValueUSD;
        const annualizedCostPercent = totalCostPercent; // One-time cost spread over a year
        
        return {
            gasCostETH: baseCost,
            gasCostUSD: costUSD,
            totalCostPercent,
            annualizedCostPercent,
            breakEvenDays: 365 * totalCostPercent // Days to break even on gas costs
        };
    }
    
    calculatePreferenceScore(market, analysis, preferences) {
        let score = 50; // Base score
        
        const {
            riskTolerance,
            yieldPreference,
            preferredChains,
            includeRewards
        } = preferences;
        
        // Adjust for risk tolerance
        const riskPenalty = (analysis.riskScore - 50) * (1 - riskTolerance);
        score -= riskPenalty;
        
        // Adjust for yield preference
        const yieldBonus = analysis.riskAdjustedAPY * yieldPreference * 2;
        score += yieldBonus;
        
        // Bonus for preferred chains
        if (preferredChains.includes(market.chainId)) {
            score += 10;
        }
        
        // Adjust for reward inclusion preference
        if (!includeRewards && analysis.rewardAPY > 0) {
            score -= analysis.rewardAPY * 2; // Penalize reward-heavy opportunities
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    // Update risk factors based on historical performance
    updateRiskFactors(performanceData) {
        try {
            for (const [protocol, data] of Object.entries(performanceData)) {
                if (data.incidents && data.totalValue) {
                    // Adjust protocol risk based on incidents vs TVL
                    const incidentRate = data.incidents / (data.totalValue / 1000000); // incidents per $1M TVL
                    const adjustment = Math.min(20, incidentRate * 10);
                    
                    if (this.riskFactors.protocolRisk[protocol]) {
                        this.riskFactors.protocolRisk[protocol] = Math.min(90, 
                            this.riskFactors.protocolRisk[protocol] + adjustment
                        );
                    }
                }
            }
            
            logger.info('Updated risk factors based on performance data');
        } catch (error) {
            logger.error('Failed to update risk factors:', error);
        }
    }
    
    // Get risk category description
    getRiskCategory(riskScore) {
        if (riskScore <= 20) return { category: 'LOW', color: 'green', description: 'Conservative, established protocols with strong safety records' };
        if (riskScore <= 40) return { category: 'MODERATE', color: 'yellow', description: 'Balanced risk/reward with proven track records' };
        if (riskScore <= 60) return { category: 'HIGH', color: 'orange', description: 'Higher risk but potentially higher rewards' };
        if (riskScore <= 80) return { category: 'VERY HIGH', color: 'red', description: 'Experimental or unproven protocols' };
        return { category: 'EXTREME', color: 'darkred', description: 'Highest risk, only for risk-seeking users' };
    }
}

module.exports = RiskCalculator;
