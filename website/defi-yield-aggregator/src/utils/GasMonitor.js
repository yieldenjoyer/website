const axios = require('axios');
const { ethers } = require('ethers');
const logger = require('./logger').loggers.gas || require('./logger');

class GasMonitor {
    constructor(providers) {
        this.providers = providers;
        this.gasStations = {
            ethereum: {
                etherscan: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
                blockNative: 'https://api.blocknative.com/gasprices/blockprices',
                owlracle: 'https://api.owlracle.info/v4/eth/gas'
            },
            polygon: {
                gasStation: 'https://gasstation.polygon.technology/v2',
                owlracle: 'https://api.owlracle.info/v4/matic/gas'
            },
            arbitrum: {
                owlracle: 'https://api.owlracle.info/v4/arb/gas'
            },
            optimism: {
                owlracle: 'https://api.owlracle.info/v4/op/gas'
            },
            base: {
                owlracle: 'https://api.owlracle.info/v4/base/gas'
            }
        };
        
        this.gasCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        
        // Gas limits for different operations
        this.gasLimits = {
            withdraw: 150000,
            deposit: 200000,
            swap: 300000,
            bridge: 500000,
            approval: 50000
        };
        
        // Gas price thresholds (in gwei)
        this.thresholds = {
            1: { low: 15, medium: 25, high: 50 },      // Ethereum
            137: { low: 30, medium: 50, high: 100 },   // Polygon  
            42161: { low: 0.1, medium: 0.5, high: 2 }, // Arbitrum
            10: { low: 0.001, medium: 0.01, high: 0.1 }, // Optimism
            8453: { low: 0.001, medium: 0.01, high: 0.1 } // Base
        };
    }
    
    async getCurrentGasPrice(chainId) {
        const cacheKey = `gas_${chainId}`;
        const cached = this.gasCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const gasData = await this.fetchGasPrice(chainId);
            
            this.gasCache.set(cacheKey, {
                data: gasData,
                timestamp: Date.now()
            });
            
            return gasData;
            
        } catch (error) {
            logger.error(`Failed to fetch gas price for chain ${chainId}:`, error);
            
            // Fallback to provider
            try {
                const provider = this.providers[chainId];
                if (provider) {
                    const feeData = await provider.getFeeData();
                    return {
                        chainId: parseInt(chainId),
                        slow: Number(ethers.formatUnits(feeData.gasPrice || feeData.maxFeePerGas, 'gwei')),
                        standard: Number(ethers.formatUnits(feeData.gasPrice || feeData.maxFeePerGas, 'gwei')) * 1.2,
                        fast: Number(ethers.formatUnits(feeData.gasPrice || feeData.maxFeePerGas, 'gwei')) * 1.5,
                        source: 'provider',
                        timestamp: Date.now()
                    };
                }
            } catch (providerError) {
                logger.error(`Provider fallback failed for chain ${chainId}:`, providerError);
            }
            
            // Final fallback to default values
            const threshold = this.thresholds[chainId] || this.thresholds[1];
            return {
                chainId: parseInt(chainId),
                slow: threshold.low,
                standard: threshold.medium,
                fast: threshold.high,
                source: 'default',
                timestamp: Date.now()
            };
        }
    }
    
    async fetchGasPrice(chainId) {
        const chainNum = parseInt(chainId);
        
        switch (chainNum) {
            case 1: // Ethereum
                return await this.fetchEthereumGas();
            case 137: // Polygon
                return await this.fetchPolygonGas();
            case 42161: // Arbitrum
                return await this.fetchArbitrumGas();
            case 10: // Optimism
                return await this.fetchOptimismGas();
            case 8453: // Base
                return await this.fetchBaseGas();
            default:
                throw new Error(`Unsupported chain: ${chainId}`);
        }
    }
    
    async fetchEthereumGas() {
        // Try multiple sources for Ethereum
        const sources = [
            async () => {
                const response = await axios.get(this.gasStations.ethereum.etherscan, {
                    timeout: 5000
                });
                const data = response.data.result;
                return {
                    chainId: 1,
                    slow: parseFloat(data.SafeGasPrice),
                    standard: parseFloat(data.ProposeGasPrice),
                    fast: parseFloat(data.FastGasPrice),
                    source: 'etherscan'
                };
            },
            async () => {
                const response = await axios.get(this.gasStations.ethereum.owlracle, {
                    timeout: 5000
                });
                const data = response.data;
                return {
                    chainId: 1,
                    slow: data.speeds.find(s => s.acceptance === 90)?.gasPrice || data.speeds[0]?.gasPrice,
                    standard: data.speeds.find(s => s.acceptance === 60)?.gasPrice || data.speeds[1]?.gasPrice,
                    fast: data.speeds.find(s => s.acceptance === 35)?.gasPrice || data.speeds[2]?.gasPrice,
                    source: 'owlracle'
                };
            }
        ];
        
        for (const source of sources) {
            try {
                const result = await source();
                result.timestamp = Date.now();
                return result;
            } catch (error) {
                logger.debug('Gas source failed, trying next:', error.message);
            }
        }
        
        throw new Error('All Ethereum gas sources failed');
    }
    
    async fetchPolygonGas() {
        try {
            const response = await axios.get(this.gasStations.polygon.gasStation, {
                timeout: 5000
            });
            const data = response.data;
            return {
                chainId: 137,
                slow: data.safeLow.maxFee,
                standard: data.standard.maxFee,
                fast: data.fast.maxFee,
                source: 'polygon-gasstation',
                timestamp: Date.now()
            };
        } catch (error) {
            // Fallback to owlracle
            const response = await axios.get(this.gasStations.polygon.owlracle, {
                timeout: 5000
            });
            const data = response.data;
            return {
                chainId: 137,
                slow: data.speeds.find(s => s.acceptance === 90)?.gasPrice || data.speeds[0]?.gasPrice,
                standard: data.speeds.find(s => s.acceptance === 60)?.gasPrice || data.speeds[1]?.gasPrice,
                fast: data.speeds.find(s => s.acceptance === 35)?.gasPrice || data.speeds[2]?.gasPrice,
                source: 'owlracle',
                timestamp: Date.now()
            };
        }
    }
    
    async fetchArbitrumGas() {
        const response = await axios.get(this.gasStations.arbitrum.owlracle, {
            timeout: 5000
        });
        const data = response.data;
        return {
            chainId: 42161,
            slow: data.speeds.find(s => s.acceptance === 90)?.gasPrice || data.speeds[0]?.gasPrice,
            standard: data.speeds.find(s => s.acceptance === 60)?.gasPrice || data.speeds[1]?.gasPrice,
            fast: data.speeds.find(s => s.acceptance === 35)?.gasPrice || data.speeds[2]?.gasPrice,
            source: 'owlracle',
            timestamp: Date.now()
        };
    }
    
    async fetchOptimismGas() {
        const response = await axios.get(this.gasStations.optimism.owlracle, {
            timeout: 5000
        });
        const data = response.data;
        return {
            chainId: 10,
            slow: data.speeds.find(s => s.acceptance === 90)?.gasPrice || data.speeds[0]?.gasPrice,
            standard: data.speeds.find(s => s.acceptance === 60)?.gasPrice || data.speeds[1]?.gasPrice,
            fast: data.speeds.find(s => s.acceptance === 35)?.gasPrice || data.speeds[2]?.gasPrice,
            source: 'owlracle',
            timestamp: Date.now()
        };
    }
    
    async fetchBaseGas() {
        const response = await axios.get(this.gasStations.base.owlracle, {
            timeout: 5000
        });
        const data = response.data;
        return {
            chainId: 8453,
            slow: data.speeds.find(s => s.acceptance === 90)?.gasPrice || data.speeds[0]?.gasPrice,
            standard: data.speeds.find(s => s.acceptance === 60)?.gasPrice || data.speeds[1]?.gasPrice,
            fast: data.speeds.find(s => s.acceptance === 35)?.gasPrice || data.speeds[2]?.gasPrice,
            source: 'owlracle',
            timestamp: Date.now()
        };
    }
    
    async calculateTransactionCost(chainId, operationType = 'standard', gasPrice = null, speed = 'standard') {
        try {
            const gasData = gasPrice ? { [speed]: gasPrice } : await this.getCurrentGasPrice(chainId);
            const gasLimit = this.gasLimits[operationType] || 200000;
            const priceInGwei = gasData[speed] || gasData.standard;
            
            // Calculate cost in native token units
            const costInWei = ethers.parseUnits(priceInGwei.toString(), 'gwei') * BigInt(gasLimit);
            const costInEth = ethers.formatEther(costInWei);
            
            // Get native token price in USD (simplified)
            const nativeTokenPrice = await this.getNativeTokenPrice(chainId);
            const costInUSD = parseFloat(costInEth) * nativeTokenPrice;
            
            return {
                chainId: parseInt(chainId),
                operationType,
                gasLimit,
                gasPriceGwei: priceInGwei,
                costInWei: costInWei.toString(),
                costInEth: parseFloat(costInEth),
                costInUSD,
                speed,
                timestamp: Date.now()
            };
            
        } catch (error) {
            logger.error(`Failed to calculate transaction cost for chain ${chainId}:`, error);
            throw error;
        }
    }
    
    async shouldExecuteTransaction(chainId, operationType, expectedYieldUSD, timeHorizonHours = 24) {
        try {
            const gasCost = await this.calculateTransactionCost(chainId, operationType);
            
            // Calculate expected yield over time horizon
            const expectedYieldOverPeriod = (expectedYieldUSD * timeHorizonHours) / (365 * 24);
            
            const analysis = {
                shouldExecute: expectedYieldOverPeriod > gasCost.costInUSD,
                gasCostUSD: gasCost.costInUSD,
                expectedYieldUSD: expectedYieldOverPeriod,
                netProfitUSD: expectedYieldOverPeriod - gasCost.costInUSD,
                breakEvenHours: gasCost.costInUSD / (expectedYieldUSD / (365 * 24)),
                gasPriceGwei: gasCost.gasPriceGwei,
                recommendation: null
            };
            
            if (analysis.shouldExecute) {
                if (analysis.netProfitUSD > gasCost.costInUSD * 0.5) {
                    analysis.recommendation = 'highly_profitable';
                } else {
                    analysis.recommendation = 'profitable';
                }
            } else {
                if (analysis.breakEvenHours < 72) {
                    analysis.recommendation = 'wait_for_lower_gas';
                } else {
                    analysis.recommendation = 'not_profitable';
                }
            }
            
            logger.info(`Gas analysis for ${operationType} on chain ${chainId}:`, {
                shouldExecute: analysis.shouldExecute,
                gasCostUSD: analysis.gasCostUSD.toFixed(4),
                expectedYieldUSD: analysis.expectedYieldUSD.toFixed(4),
                netProfitUSD: analysis.netProfitUSD.toFixed(4),
                breakEvenHours: analysis.breakEvenHours.toFixed(2),
                recommendation: analysis.recommendation
            });
            
            return analysis;
            
        } catch (error) {
            logger.error('Failed to analyze transaction profitability:', error);
            // Default to not execute if analysis fails
            return {
                shouldExecute: false,
                error: error.message,
                recommendation: 'analysis_failed'
            };
        }
    }
    
    async getNativeTokenPrice(chainId) {
        // Simplified price mapping - in production, you'd want to fetch from price feeds
        const prices = {
            1: 2500,    // ETH
            137: 0.85,  // MATIC
            42161: 2500, // ETH on Arbitrum
            10: 2500,   // ETH on Optimism
            8453: 2500  // ETH on Base
        };
        
        return prices[chainId] || 2500;
    }
    
    async getOptimalGasPrice(chainId, urgency = 'standard') {
        const gasData = await this.getCurrentGasPrice(chainId);
        const threshold = this.thresholds[chainId];
        
        if (!threshold) {
            return gasData[urgency] || gasData.standard;
        }
        
        // Adjust based on current network conditions
        let selectedPrice = gasData[urgency] || gasData.standard;
        
        if (urgency === 'fast' && selectedPrice > threshold.high) {
            logger.warn(`Gas price ${selectedPrice} exceeds high threshold ${threshold.high} for chain ${chainId}`);
        } else if (urgency === 'standard' && selectedPrice > threshold.medium) {
            logger.warn(`Gas price ${selectedPrice} exceeds medium threshold ${threshold.medium} for chain ${chainId}`);
        }
        
        return Math.min(selectedPrice, threshold.high);
    }
    
    isGasPriceAcceptable(chainId, gasPriceGwei) {
        const threshold = this.thresholds[chainId];
        if (!threshold) return true;
        
        return gasPriceGwei <= threshold.high;
    }
    
    async waitForLowerGas(chainId, maxGasPriceGwei, timeoutMinutes = 30) {
        const startTime = Date.now();
        const timeout = timeoutMinutes * 60 * 1000;
        
        while (Date.now() - startTime < timeout) {
            try {
                const gasData = await this.getCurrentGasPrice(chainId);
                
                if (gasData.standard <= maxGasPriceGwei) {
                    logger.info(`Gas price acceptable: ${gasData.standard} <= ${maxGasPriceGwei} gwei`);
                    return gasData;
                }
                
                logger.debug(`Waiting for gas price to drop: ${gasData.standard} > ${maxGasPriceGwei} gwei`);
                
                // Wait 2 minutes before checking again
                await new Promise(resolve => setTimeout(resolve, 120000));
                
            } catch (error) {
                logger.error('Error while waiting for lower gas:', error);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
        
        throw new Error(`Timeout waiting for gas price to drop below ${maxGasPriceGwei} gwei`);
    }
    
    getGasStats() {
        const stats = {};
        
        for (const [key, cached] of this.gasCache) {
            if (key.startsWith('gas_')) {
                const chainId = key.split('_')[1];
                stats[chainId] = {
                    ...cached.data,
                    cacheAge: Date.now() - cached.timestamp
                };
            }
        }
        
        return stats;
    }
}

module.exports = GasMonitor;
