const { ethers } = require('ethers');
const logger = require('../utils/logger').loggers.rebalance;

class RebalanceOrchestrator {
    constructor(config) {
        this.config = config;
        this.database = config.database;
        this.positionManager = config.positionManager;
        this.transactionExecutor = config.transactionExecutor;
        this.riskCalculator = config.riskCalculator;
        this.scraperManager = config.scraperManager;
        this.alertSystem = config.alertSystem;
        
        // Automation settings
        this.automationSettings = {
            enabled: process.env.AUTOMATION_ENABLED === 'true',
            rebalanceInterval: parseInt(process.env.REBALANCE_INTERVAL) || 900000, // 15 minutes
            minYieldImprovement: parseFloat(process.env.MIN_YIELD_IMPROVEMENT) || 0.02, // 2%
            maxGasCostPercent: parseFloat(process.env.MAX_GAS_COST_PERCENT) || 0.01, // 1%
            maxPositionsPerUser: parseInt(process.env.MAX_POSITIONS_PER_USER) || 10,
            dryRun: process.env.DRY_RUN === 'true'
        };
        
        // Emergency circuit breakers
        this.circuitBreakers = {
            maxFailuresPerHour: 5,
            maxSlippagePercent: 0.05, // 5%
            minLiquidityUSD: 100000, // $100k minimum liquidity
            failures: new Map(), // user -> failure count
            lastReset: Date.now()
        };
        
        this.isRunning = false;
        this.userPreferences = new Map(); // user -> preferences
    }
    
    async initialize() {
        try {
            logger.info('Initializing Rebalance Orchestrator...');
            
            // Load user preferences
            await this.loadUserPreferences();
            
            // Initialize circuit breaker cleanup
            setInterval(() => this.resetCircuitBreakers(), 3600000); // Reset every hour
            
            // Start automation if enabled
            if (this.automationSettings.enabled) {
                await this.startAutomation();
            }
            
            logger.info('Rebalance Orchestrator initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Rebalance Orchestrator:', error);
            throw error;
        }
    }
    
    async loadUserPreferences() {
        try {
            const query = `
                SELECT user_address, preferences 
                FROM user_preferences 
                WHERE automation_enabled = 1
            `;
            
            const users = await this.database.all(query);
            
            for (const user of users) {
                this.userPreferences.set(user.user_address, {
                    ...JSON.parse(user.preferences),
                    address: user.user_address
                });
            }
            
            logger.info(`Loaded preferences for ${users.length} users`);
            
        } catch (error) {
            logger.error('Failed to load user preferences:', error);
        }
    }
    
    async startAutomation() {
        if (this.isRunning) {
            logger.warn('Automation is already running');
            return;
        }
        
        this.isRunning = true;
        logger.info(`Starting automated rebalancing (interval: ${this.automationSettings.rebalanceInterval}ms)`);
        
        // Initial scan
        await this.scanForOpportunities();
        
        // Schedule periodic scans
        this.automationInterval = setInterval(async () => {
            try {
                await this.scanForOpportunities();
            } catch (error) {
                logger.error('Error in automation cycle:', error);
            }
        }, this.automationSettings.rebalanceInterval);
    }
    
    async stopAutomation() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        if (this.automationInterval) {
            clearInterval(this.automationInterval);
        }
        
        logger.info('Stopped automated rebalancing');
    }
    
    async scanForOpportunities() {
        try {
            logger.info('Scanning for rebalance opportunities...');
            
            const opportunities = [];
            
            // Get all users with automation enabled
            for (const [userAddress, preferences] of this.userPreferences) {
                try {
                    const userOpportunities = await this.analyzeUserPositions(userAddress, preferences);
                    opportunities.push(...userOpportunities);
                } catch (error) {
                    logger.error(`Failed to analyze positions for user ${userAddress}:`, error);
                }
            }
            
            // Execute promising opportunities
            const executedCount = await this.executeOpportunities(opportunities);
            
            logger.info(`Scan complete. Found ${opportunities.length} opportunities, executed ${executedCount}`);
            
            // Send summary alerts
            if (opportunities.length > 0) {
                await this.sendOpportunitySummary(opportunities, executedCount);
            }
            
        } catch (error) {
            logger.error('Failed to scan for opportunities:', error);
        }
    }
    
    async analyzeUserPositions(userAddress, preferences) {
        try {
            const userPositions = this.positionManager.getUserPositions(userAddress);
            const opportunities = [];
            
            if (userPositions.length === 0) {
                return opportunities;
            }
            
            // Get all available Euler markets
            const availableMarkets = await this.scraperManager.getAllMarkets();
            const eulerMarkets = availableMarkets.filter(market => market.protocol === 'euler');
            
            for (const position of userPositions) {
                try {
                    const positionOpportunities = await this.findAlternativesForPosition(
                        position,
                        eulerMarkets,
                        preferences
                    );
                    
                    opportunities.push(...positionOpportunities);
                    
                } catch (error) {
                    logger.error(`Failed to analyze position ${position.id}:`, error);
                }
            }
            
            return opportunities;
            
        } catch (error) {
            logger.error(`Failed to analyze user positions for ${userAddress}:`, error);
            return [];
        }
    }
    
    async findAlternativesForPosition(position, availableMarkets, preferences) {
        try {
            // Filter markets for same asset
            const sameAssetMarkets = availableMarkets.filter(market => 
                market.asset.toLowerCase() === position.asset.toLowerCase() &&
                market.chainId !== position.chainId || market.market !== position.market
            );
            
            if (sameAssetMarkets.length === 0) {
                return [];
            }
            
            // Convert position to market format for comparison
            const currentMarket = {
                protocol: position.protocol,
                chainId: position.chainId,
                market: position.market,
                asset: position.asset,
                assetSymbol: position.assetSymbol,
                baseAPY: position.currentYield,
                rewards: position.rewards,
                totalValue: parseFloat(ethers.formatUnits(position.amount, 18)) * 
                           (await this.getAssetPrice(position.assetSymbol))
            };
            
            // Use risk calculator to compare opportunities
            const comparison = this.riskCalculator.compareOpportunities(
                currentMarket,
                sameAssetMarkets,
                preferences
            );
            
            const opportunities = [];
            
            for (const opportunity of comparison.opportunities) {
                // Additional checks before considering execution
                if (await this.shouldExecuteRebalance(position, opportunity, preferences)) {
                    opportunities.push({
                        userAddress: preferences.address,
                        currentPosition: position,
                        targetMarket: opportunity.market,
                        analysis: opportunity.analysis,
                        improvement: opportunity.netImprovement,
                        switchingCost: opportunity.switchingCost,
                        recommendation: opportunity.recommendation,
                        priority: this.calculatePriority(opportunity, preferences)
                    });
                }
            }
            
            return opportunities;
            
        } catch (error) {
            logger.error('Failed to find alternatives for position:', error);
            return [];
        }
    }
    
    async shouldExecuteRebalance(position, opportunity, preferences) {
        try {
            // Check circuit breakers
            if (this.isCircuitBreakerTripped(preferences.address)) {
                logger.warn(`Circuit breaker active for user ${preferences.address}`);
                return false;
            }
            
            // Check minimum improvement threshold
            if (opportunity.netImprovement < preferences.minImprovement) {
                return false;
            }
            
            // Check gas cost threshold
            if (opportunity.switchingCost.totalCostPercent > preferences.maxGasCostPercent) {
                return false;
            }
            
            // Check position age (don't rebalance too frequently)
            const positionAgeHours = (Date.now() - position.lastUpdated.getTime()) / (1000 * 60 * 60);
            const minAgeHours = preferences.minPositionAgeHours || 24;
            
            if (positionAgeHours < minAgeHours) {
                logger.debug(`Position ${position.id} too recent to rebalance (${positionAgeHours}h < ${minAgeHours}h)`);
                return false;
            }
            
            // Check market conditions
            const marketConditions = await this.checkMarketConditions(opportunity.targetMarket);
            if (!marketConditions.suitable) {
                logger.debug(`Market conditions not suitable: ${marketConditions.reason}`);
                return false;
            }
            
            // Check if target market has sufficient liquidity
            if (opportunity.targetMarket.liquidityDepth < this.circuitBreakers.minLiquidityUSD) {
                logger.debug(`Insufficient liquidity in target market: $${opportunity.targetMarket.liquidityDepth}`);
                return false;
            }
            
            return true;
            
        } catch (error) {
            logger.error('Error checking rebalance conditions:', error);
            return false;
        }
    }
    
    calculatePriority(opportunity, preferences) {
        // Higher numbers = higher priority
        let priority = 0;
        
        // Yield improvement weight (most important)
        priority += opportunity.netImprovement * 1000; // Scale up for better granularity
        
        // Risk preference adjustment
        const riskMultiplier = preferences.riskTolerance || 0.5;
        const riskPenalty = opportunity.analysis.riskScore * (1 - riskMultiplier) * 0.1;
        priority -= riskPenalty;
        
        // Position size weight (larger positions get priority)
        const positionValue = opportunity.currentPosition.amount ? 
            parseFloat(ethers.formatUnits(opportunity.currentPosition.amount, 18)) : 0;
        priority += Math.log10(Math.max(1, positionValue)) * 10;
        
        // Break-even time weight (faster break-even = higher priority)
        const breakEvenDays = opportunity.switchingCost.breakEvenDays || 365;
        priority += (365 - Math.min(365, breakEvenDays)) * 0.1;
        
        return Math.max(0, priority);
    }
    
    async executeOpportunities(opportunities) {
        // Sort by priority (highest first)
        opportunities.sort((a, b) => b.priority - a.priority);
        
        let executedCount = 0;
        const maxExecutionsPerCycle = 5; // Limit concurrent executions
        
        for (let i = 0; i < Math.min(opportunities.length, maxExecutionsPerCycle); i++) {
            const opportunity = opportunities[i];
            
            try {
                const success = await this.executeRebalance(opportunity);
                if (success) {
                    executedCount++;
                }
            } catch (error) {
                logger.error('Failed to execute rebalance:', error);
                await this.recordFailure(opportunity.userAddress);
            }
        }
        
        return executedCount;
    }
    
    async executeRebalance(opportunity) {
        const { userAddress, currentPosition, targetMarket, analysis, improvement } = opportunity;
        
        try {
            logger.info(`Executing rebalance for ${userAddress}: ${improvement.toFixed(4)}% improvement`);
            
            if (this.automationSettings.dryRun) {
                logger.info('DRY RUN: Would execute rebalance', {
                    user: userAddress,
                    from: `${currentPosition.protocol}/${currentPosition.chainId}`,
                    to: `${targetMarket.protocol}/${targetMarket.chainId}`,
                    improvement: `${improvement.toFixed(4)}%`
                });
                
                // Send notification about what would be done
                await this.alertSystem.sendAlert(
                    'DRY RUN: Rebalance Opportunity',
                    `Would rebalance ${userAddress} for ${improvement.toFixed(4)}% improvement`,
                    'info'
                );
                
                return true;
            }
            
            // Validate execution before proceeding
            const validation = await this.transactionExecutor.validateExecution({
                currentPosition: {
                    protocol: currentPosition.protocol,
                    chainId: currentPosition.chainId,
                    market: currentPosition.market,
                    asset: currentPosition.asset
                },
                targetPosition: {
                    protocol: targetMarket.protocol,
                    chainId: targetMarket.chainId,
                    market: targetMarket.market,
                    asset: targetMarket.asset
                },
                asset: currentPosition.asset,
                amount: currentPosition.amount
            });
            
            if (!validation.valid) {
                logger.warn(`Validation failed for rebalance: ${validation.errors.join(', ')}`);
                return false;
            }
            
            // Execute the rebalance
            const result = await this.transactionExecutor.executeRebalance({
                currentPosition: {
                    protocol: currentPosition.protocol,
                    chainId: currentPosition.chainId,
                    market: currentPosition.market,
                    asset: currentPosition.asset
                },
                targetPosition: {
                    protocol: targetMarket.protocol,
                    chainId: targetMarket.chainId,
                    market: targetMarket.market,
                    asset: targetMarket.asset
                },
                asset: currentPosition.asset,
                amount: currentPosition.amount,
                strategy: 'automated_yield_optimization'
            });
            
            if (result.success) {
                // Update position in manager
                await this.positionManager.closePosition(userAddress, currentPosition.id, 'automated_rebalance');
                
                // Track new position
                await this.positionManager.trackUserPosition(userAddress, {
                    protocol: targetMarket.protocol,
                    chainId: targetMarket.chainId,
                    market: targetMarket.market,
                    asset: targetMarket.asset,
                    assetSymbol: targetMarket.assetSymbol,
                    amount: currentPosition.amount,
                    entryPrice: await this.getAssetPrice(targetMarket.assetSymbol),
                    currentYield: analysis.baseAPY,
                    riskScore: analysis.riskScore,
                    rewards: targetMarket.rewards || []
                });
                
                // Send success notification
                await this.alertSystem.sendAlert(
                    'Automated Rebalance Executed',
                    `Successfully rebalanced ${userAddress}: ${improvement.toFixed(4)}% improvement`,
                    'success'
                );
                
                // Log success
                await this.logRebalanceEvent(userAddress, 'success', {
                    fromMarket: currentPosition.market,
                    toMarket: targetMarket.market,
                    improvement,
                    txHashes: result.txHashes
                });
                
                logger.info(`Rebalance executed successfully for ${userAddress}`);
                return true;
                
            } else {
                logger.error(`Rebalance execution failed: ${result.error}`);
                await this.recordFailure(userAddress);
                return false;
            }
            
        } catch (error) {
            logger.error('Failed to execute rebalance:', error);
            await this.recordFailure(userAddress);
            
            // Send error notification
            await this.alertSystem.sendAlert(
                'Rebalance Execution Failed',
                `Failed to rebalance ${userAddress}: ${error.message}`,
                'error'
            );
            
            return false;
        }
    }
    
    async checkMarketConditions(market) {
        try {
            // Check for unusual volatility
            if (market.volatility > 0.5) { // 50%+ volatility
                return { suitable: false, reason: 'High volatility detected' };
            }
            
            // Check utilization rate
            if (market.utilization > 0.95) { // >95% utilization
                return { suitable: false, reason: 'Utilization too high' };
            }
            
            // Check if market data is fresh
            if (market.lastUpdated) {
                const staleHours = (Date.now() - new Date(market.lastUpdated)) / (1000 * 60 * 60);
                if (staleHours > 2) {
                    return { suitable: false, reason: 'Market data is stale' };
                }
            }
            
            return { suitable: true };
            
        } catch (error) {
            return { suitable: false, reason: `Error checking conditions: ${error.message}` };
        }
    }
    
    isCircuitBreakerTripped(userAddress) {
        const failures = this.circuitBreakers.failures.get(userAddress) || 0;
        return failures >= this.circuitBreakers.maxFailuresPerHour;
    }
    
    async recordFailure(userAddress) {
        const current = this.circuitBreakers.failures.get(userAddress) || 0;
        this.circuitBreakers.failures.set(userAddress, current + 1);
        
        if (current + 1 >= this.circuitBreakers.maxFailuresPerHour) {
            logger.warn(`Circuit breaker tripped for user ${userAddress}`);
            
            await this.alertSystem.sendAlert(
                'Circuit Breaker Activated',
                `Automated rebalancing temporarily disabled for ${userAddress} due to repeated failures`,
                'warning'
            );
        }
    }
    
    resetCircuitBreakers() {
        this.circuitBreakers.failures.clear();
        this.circuitBreakers.lastReset = Date.now();
        logger.debug('Circuit breakers reset');
    }
    
    async logRebalanceEvent(userAddress, type, details) {
        try {
            const query = `
                INSERT INTO rebalance_events (
                    user_address, event_type, details, created_at
                ) VALUES (?, ?, ?, ?)
            `;
            
            await this.database.run(query, [
                userAddress,
                type,
                JSON.stringify(details),
                new Date().toISOString()
            ]);
            
        } catch (error) {
            logger.error('Failed to log rebalance event:', error);
        }
    }
    
    async sendOpportunitySummary(opportunities, executedCount) {
        try {
            const summary = {
                totalOpportunities: opportunities.length,
                executedCount,
                totalImprovement: opportunities.reduce((sum, opp) => sum + opp.improvement, 0),
                averageImprovement: opportunities.reduce((sum, opp) => sum + opp.improvement, 0) / opportunities.length,
                topOpportunity: opportunities[0]
            };
            
            await this.alertSystem.sendAlert(
                'Rebalance Cycle Summary',
                `Found ${summary.totalOpportunities} opportunities, executed ${summary.executedCount}. ` +
                `Average improvement: ${summary.averageImprovement.toFixed(4)}%`,
                'info'
            );
            
        } catch (error) {
            logger.error('Failed to send opportunity summary:', error);
        }
    }
    
    async getAssetPrice(assetSymbol) {
        // This would integrate with price feeds
        // For now, return mock prices
        const prices = {
            'USDC': 1.0,
            'USDT': 1.0,
            'DAI': 1.0,
            'WETH': 2500.0,
            'WBTC': 45000.0
        };
        
        return prices[assetSymbol] || 1.0;
    }
    
    // API methods for external control
    async enableAutomationForUser(userAddress, preferences) {
        try {
            this.userPreferences.set(userAddress, {
                ...preferences,
                address: userAddress
            });
            
            // Save to database
            const query = `
                INSERT OR REPLACE INTO user_preferences (
                    user_address, preferences, automation_enabled, updated_at
                ) VALUES (?, ?, 1, ?)
            `;
            
            await this.database.run(query, [
                userAddress,
                JSON.stringify(preferences),
                new Date().toISOString()
            ]);
            
            logger.info(`Automation enabled for user ${userAddress}`);
            
        } catch (error) {
            logger.error('Failed to enable automation for user:', error);
            throw error;
        }
    }
    
    async disableAutomationForUser(userAddress) {
        try {
            this.userPreferences.delete(userAddress);
            
            // Update database
            const query = `
                UPDATE user_preferences 
                SET automation_enabled = 0, updated_at = ?
                WHERE user_address = ?
            `;
            
            await this.database.run(query, [
                new Date().toISOString(),
                userAddress
            ]);
            
            logger.info(`Automation disabled for user ${userAddress}`);
            
        } catch (error) {
            logger.error('Failed to disable automation for user:', error);
            throw error;
        }
    }
    
    async getAutomationStatus() {
        return {
            enabled: this.automationSettings.enabled,
            isRunning: this.isRunning,
            dryRun: this.automationSettings.dryRun,
            activeUsers: this.userPreferences.size,
            settings: this.automationSettings,
            circuitBreakers: {
                trippedUsers: Array.from(this.circuitBreakers.failures.entries())
                    .filter(([, count]) => count >= this.circuitBreakers.maxFailuresPerHour)
                    .map(([user]) => user)
            }
        };
    }
    
    async emergencyStop() {
        logger.warn('EMERGENCY STOP activated - halting all automation');
        
        await this.stopAutomation();
        
        // Trip circuit breaker for all users
        for (const userAddress of this.userPreferences.keys()) {
            this.circuitBreakers.failures.set(userAddress, this.circuitBreakers.maxFailuresPerHour);
        }
        
        // Send emergency notification
        await this.alertSystem.sendAlert(
            'EMERGENCY STOP - Automation Halted',
            'All automated rebalancing has been emergency stopped',
            'error'
        );
    }
}

module.exports = RebalanceOrchestrator;
