const logger = require('../utils/logger').loggers.positions;

class PositionManager {
    constructor(database, transactionExecutor) {
        this.database = database;
        this.executor = transactionExecutor;
        this.positions = new Map(); // address -> positions
        this.positionLimits = {
            maxPositionPerMarket: 1000000, // $1M max per market
            maxTotalPosition: 10000000,    // $10M total max
            maxMarketsPerAsset: 5,         // Max 5 markets per asset
            minPositionSize: 1000          // $1K minimum position
        };
    }
    
    async initialize() {
        try {
            await this.loadPositionsFromDatabase();
            logger.info(`Loaded ${this.positions.size} user positions`);
        } catch (error) {
            logger.error('Failed to initialize position manager:', error);
            throw error;
        }
    }
    
    async loadPositionsFromDatabase() {
        const query = `
            SELECT * FROM user_positions 
            WHERE status = 'active' 
            ORDER BY updated_at DESC
        `;
        
        const positions = await this.database.all(query);
        
        for (const position of positions) {
            const userAddress = position.user_address;
            if (!this.positions.has(userAddress)) {
                this.positions.set(userAddress, []);
            }
            
            this.positions.get(userAddress).push({
                id: position.id,
                protocol: position.protocol,
                chainId: position.chain_id,
                market: position.market_address,
                asset: position.asset_address,
                assetSymbol: position.asset_symbol,
                amount: BigInt(position.amount),
                entryPrice: parseFloat(position.entry_price),
                currentYield: parseFloat(position.current_yield),
                riskScore: parseFloat(position.risk_score),
                entryTime: new Date(position.entry_time),
                lastUpdated: new Date(position.updated_at),
                rewards: JSON.parse(position.rewards || '[]'),
                metadata: JSON.parse(position.metadata || '{}')
            });
        }
    }
    
    async trackUserPosition(userAddress, positionData) {
        const {
            protocol,
            chainId,
            market,
            asset,
            assetSymbol,
            amount,
            entryPrice,
            currentYield,
            riskScore,
            rewards = [],
            metadata = {}
        } = positionData;
        
        try {
            // Validate position limits
            const validation = await this.validatePositionLimits(userAddress, positionData);
            if (!validation.valid) {
                throw new Error(`Position validation failed: ${validation.errors.join(', ')}`);
            }
            
            const position = {
                protocol,
                chainId,
                market,
                asset,
                assetSymbol,
                amount: BigInt(amount),
                entryPrice,
                currentYield,
                riskScore,
                entryTime: new Date(),
                lastUpdated: new Date(),
                rewards,
                metadata
            };
            
            // Save to database
            const positionId = await this.savePositionToDatabase(userAddress, position);
            position.id = positionId;
            
            // Add to memory
            if (!this.positions.has(userAddress)) {
                this.positions.set(userAddress, []);
            }
            this.positions.get(userAddress).push(position);
            
            logger.info(`Tracked new position for ${userAddress}: ${assetSymbol} in ${protocol}/${chainId}`);
            
            return { success: true, positionId };
            
        } catch (error) {
            logger.error('Failed to track position:', error);
            return { success: false, error: error.message };
        }
    }
    
    async savePositionToDatabase(userAddress, position) {
        const query = `
            INSERT INTO user_positions (
                user_address, protocol, chain_id, market_address, 
                asset_address, asset_symbol, amount, entry_price,
                current_yield, risk_score, entry_time, updated_at,
                rewards, metadata, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;
        
        const values = [
            userAddress,
            position.protocol,
            position.chainId,
            position.market,
            position.asset,
            position.assetSymbol,
            position.amount.toString(),
            position.entryPrice,
            position.currentYield,
            position.riskScore,
            position.entryTime.toISOString(),
            position.lastUpdated.toISOString(),
            JSON.stringify(position.rewards),
            JSON.stringify(position.metadata)
        ];
        
        const result = await this.database.run(query, values);
        return result.lastID;
    }
    
    async updatePosition(userAddress, positionId, updates) {
        try {
            const userPositions = this.positions.get(userAddress);
            if (!userPositions) {
                throw new Error('User positions not found');
            }
            
            const position = userPositions.find(p => p.id === positionId);
            if (!position) {
                throw new Error('Position not found');
            }
            
            // Update position data
            Object.assign(position, updates, { lastUpdated: new Date() });
            
            // Update in database
            await this.updatePositionInDatabase(positionId, position);
            
            logger.debug(`Updated position ${positionId} for ${userAddress}`);
            
        } catch (error) {
            logger.error('Failed to update position:', error);
            throw error;
        }
    }
    
    async updatePositionInDatabase(positionId, position) {
        const query = `
            UPDATE user_positions 
            SET current_yield = ?, risk_score = ?, updated_at = ?,
                rewards = ?, metadata = ?
            WHERE id = ?
        `;
        
        const values = [
            position.currentYield,
            position.riskScore,
            position.lastUpdated.toISOString(),
            JSON.stringify(position.rewards),
            JSON.stringify(position.metadata),
            positionId
        ];
        
        await this.database.run(query, values);
    }
    
    async closePosition(userAddress, positionId, reason = 'manual') {
        try {
            const userPositions = this.positions.get(userAddress);
            if (!userPositions) {
                throw new Error('User positions not found');
            }
            
            const positionIndex = userPositions.findIndex(p => p.id === positionId);
            if (positionIndex === -1) {
                throw new Error('Position not found');
            }
            
            const position = userPositions[positionIndex];
            
            // Remove from memory
            userPositions.splice(positionIndex, 1);
            
            // Update in database
            const query = `
                UPDATE user_positions 
                SET status = 'closed', close_reason = ?, updated_at = ?
                WHERE id = ?
            `;
            
            await this.database.run(query, [
                reason,
                new Date().toISOString(),
                positionId
            ]);
            
            logger.info(`Closed position ${positionId} for ${userAddress}: ${reason}`);
            
            return { success: true, position };
            
        } catch (error) {
            logger.error('Failed to close position:', error);
            return { success: false, error: error.message };
        }
    }
    
    getUserPositions(userAddress) {
        return this.positions.get(userAddress) || [];
    }
    
    getUserPositionsByAsset(userAddress, asset) {
        const userPositions = this.getUserPositions(userAddress);
        return userPositions.filter(p => p.asset.toLowerCase() === asset.toLowerCase());
    }
    
    getUserPositionsByProtocol(userAddress, protocol) {
        const userPositions = this.getUserPositions(userAddress);
        return userPositions.filter(p => p.protocol === protocol);
    }
    
    getUserTotalValue(userAddress, assetPrices = {}) {
        const userPositions = this.getUserPositions(userAddress);
        let totalValue = 0;
        
        for (const position of userPositions) {
            const price = assetPrices[position.assetSymbol] || position.entryPrice;
            const positionValue = parseFloat(ethers.formatUnits(position.amount, 18)) * price;
            totalValue += positionValue;
        }
        
        return totalValue;
    }
    
    async validatePositionLimits(userAddress, newPosition) {
        const validation = { valid: true, errors: [], warnings: [] };
        
        try {
            const userPositions = this.getUserPositions(userAddress);
            const assetPrices = await this.getAssetPrices([newPosition.assetSymbol]);
            
            // Check max position per market
            const existingInMarket = userPositions.filter(p => 
                p.market === newPosition.market && p.chainId === newPosition.chainId
            );
            
            const totalInMarket = existingInMarket.reduce((sum, p) => {
                const price = assetPrices[p.assetSymbol] || p.entryPrice;
                return sum + (parseFloat(ethers.formatUnits(p.amount, 18)) * price);
            }, 0);
            
            const newPositionValue = parseFloat(ethers.formatUnits(newPosition.amount, 18)) * 
                (assetPrices[newPosition.assetSymbol] || newPosition.entryPrice);
            
            if (totalInMarket + newPositionValue > this.positionLimits.maxPositionPerMarket) {
                validation.valid = false;
                validation.errors.push(`Exceeds max position per market: $${this.positionLimits.maxPositionPerMarket}`);
            }
            
            // Check total position limit
            const totalValue = this.getUserTotalValue(userAddress, assetPrices);
            if (totalValue + newPositionValue > this.positionLimits.maxTotalPosition) {
                validation.valid = false;
                validation.errors.push(`Exceeds max total position: $${this.positionLimits.maxTotalPosition}`);
            }
            
            // Check minimum position size
            if (newPositionValue < this.positionLimits.minPositionSize) {
                validation.valid = false;
                validation.errors.push(`Below minimum position size: $${this.positionLimits.minPositionSize}`);
            }
            
            // Check max markets per asset
            const assetPositions = userPositions.filter(p => p.asset === newPosition.asset);
            const uniqueMarkets = new Set(assetPositions.map(p => `${p.chainId}-${p.market}`));
            
            if (uniqueMarkets.size >= this.positionLimits.maxMarketsPerAsset) {
                validation.warnings.push(`Approaching max markets per asset: ${this.positionLimits.maxMarketsPerAsset}`);
            }
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    async getAssetPrices(assets) {
        // This would integrate with price feeds like Chainlink, CoinGecko, etc.
        // For now, return mock prices
        const prices = {};
        for (const asset of assets) {
            switch (asset) {
                case 'USDC':
                case 'USDT':
                case 'DAI':
                    prices[asset] = 1.0;
                    break;
                case 'WETH':
                    prices[asset] = 2500.0;
                    break;
                case 'WBTC':
                    prices[asset] = 45000.0;
                    break;
                default:
                    prices[asset] = 1.0;
            }
        }
        return prices;
    }
    
    async calculatePositionPerformance(userAddress, positionId) {
        try {
            const userPositions = this.getUserPositions(userAddress);
            const position = userPositions.find(p => p.id === positionId);
            
            if (!position) {
                throw new Error('Position not found');
            }
            
            const currentTime = new Date();
            const timeHeld = currentTime - position.entryTime; // milliseconds
            const daysHeld = timeHeld / (1000 * 60 * 60 * 24);
            
            // Get current asset price
            const assetPrices = await this.getAssetPrices([position.assetSymbol]);
            const currentPrice = assetPrices[position.assetSymbol];
            
            // Calculate returns
            const priceReturn = (currentPrice - position.entryPrice) / position.entryPrice;
            const yieldReturn = (position.currentYield / 100) * (daysHeld / 365); // Annualized yield
            const totalReturn = priceReturn + yieldReturn;
            
            // Calculate rewards value
            let rewardsValue = 0;
            for (const reward of position.rewards) {
                if (reward.value && reward.claimed) {
                    rewardsValue += reward.value;
                }
            }
            
            const positionValueUSD = parseFloat(ethers.formatUnits(position.amount, 18)) * currentPrice;
            const rewardsReturnPercent = rewardsValue / positionValueUSD;
            
            return {
                positionId,
                assetSymbol: position.assetSymbol,
                entryPrice: position.entryPrice,
                currentPrice,
                priceReturn: priceReturn * 100, // as percentage
                yieldReturn: yieldReturn * 100, // as percentage
                rewardsReturn: rewardsReturnPercent * 100, // as percentage
                totalReturn: (totalReturn + rewardsReturnPercent) * 100,
                daysHeld: Math.round(daysHeld * 100) / 100,
                positionValue: positionValueUSD,
                rewardsValue,
                currentYield: position.currentYield,
                riskScore: position.riskScore
            };
            
        } catch (error) {
            logger.error('Failed to calculate position performance:', error);
            throw error;
        }
    }
    
    async getPortfolioSummary(userAddress) {
        const userPositions = this.getUserPositions(userAddress);
        
        if (userPositions.length === 0) {
            return {
                totalPositions: 0,
                totalValue: 0,
                averageYield: 0,
                averageRiskScore: 0,
                assetAllocation: {},
                protocolAllocation: {},
                chainAllocation: {}
            };
        }
        
        const assetPrices = await this.getAssetPrices([...new Set(userPositions.map(p => p.assetSymbol))]);
        
        let totalValue = 0;
        let weightedYield = 0;
        let weightedRiskScore = 0;
        
        const assetAllocation = {};
        const protocolAllocation = {};
        const chainAllocation = {};
        
        for (const position of userPositions) {
            const price = assetPrices[position.assetSymbol];
            const positionValue = parseFloat(ethers.formatUnits(position.amount, 18)) * price;
            
            totalValue += positionValue;
            weightedYield += position.currentYield * positionValue;
            weightedRiskScore += position.riskScore * positionValue;
            
            // Asset allocation
            assetAllocation[position.assetSymbol] = (assetAllocation[position.assetSymbol] || 0) + positionValue;
            
            // Protocol allocation
            protocolAllocation[position.protocol] = (protocolAllocation[position.protocol] || 0) + positionValue;
            
            // Chain allocation
            chainAllocation[position.chainId] = (chainAllocation[position.chainId] || 0) + positionValue;
        }
        
        return {
            totalPositions: userPositions.length,
            totalValue,
            averageYield: totalValue > 0 ? weightedYield / totalValue : 0,
            averageRiskScore: totalValue > 0 ? weightedRiskScore / totalValue : 0,
            assetAllocation,
            protocolAllocation,
            chainAllocation
        };
    }
    
    async setPositionLimits(newLimits) {
        Object.assign(this.positionLimits, newLimits);
        logger.info('Updated position limits:', this.positionLimits);
    }
    
    getPositionLimits() {
        return { ...this.positionLimits };
    }
    
    async getAllActivePositions() {
        const allPositions = [];
        for (const [userAddress, positions] of this.positions) {
            for (const position of positions) {
                allPositions.push({
                    userAddress,
                    ...position
                });
            }
        }
        return allPositions;
    }
    
    async getPositionsRequiringRebalance(yieldThreshold = 0.05) {
        // This would be called by the rebalance optimizer
        // to find positions that might benefit from rebalancing
        const allPositions = await this.getAllActivePositions();
        const rebalanceCandidates = [];
        
        for (const position of allPositions) {
            // This is a simplified example - the actual logic would be more sophisticated
            const timeSinceUpdate = Date.now() - position.lastUpdated.getTime();
            const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
            
            if (hoursSinceUpdate > 24) { // Haven't been updated in 24 hours
                rebalanceCandidates.push(position);
            }
        }
        
        return rebalanceCandidates;
    }
}

module.exports = PositionManager;
