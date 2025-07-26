const { ethers } = require('ethers');
const axios = require('axios');
const logger = require('../utils/logger').loggers.scraper;

class EulerScraper {
    constructor() {
        this.name = 'EulerScraper';
        this.protocol = 'euler';
        this.chains = ['ethereum'];
        
        // Euler contract addresses
        this.contracts = {
            ethereum: {
                euler: '0x27182842E098f60e3D576794A5bFFb0777E025d3',
                markets: '0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3',
                exec: '0x59828FdF7ee634AaaD3f58B19fDBa3b03E2a9d80',
                swap: '0x7123C8cBBD76c5C7fCC9f7150f23179bec0bA341'
            }
        };
        
        // Euler-specific ABIs
        this.abis = {
            euler: [
                'function moduleIdToImplementation(uint) view returns (address)',
                'function moduleIdToProxy(uint) view returns (address)'
            ],
            markets: [
                'function underlyingToEToken(address) view returns (address)',
                'function underlyingToDToken(address) view returns (address)',
                'function eTokenToUnderlying(address) view returns (address)',
                'function getAssetConfig(address) view returns (tuple(address eTokenAddress, bool borrowIsolated, uint32 collateralFactor, uint32 borrowFactor, uint24 twapWindow))'
            ],
            eToken: [
                'function balanceOf(address) view returns (uint)',
                'function totalSupply() view returns (uint)',
                'function reserveBalance() view returns (uint)',
                'function totalBorrows() view returns (uint)',
                'function interestRate() view returns (uint)',
                'function interestAccumulator() view returns (uint)',
                'function reserveFee() view returns (uint)',
                'function symbol() view returns (string)',
                'function name() view returns (string)',
                'function decimals() view returns (uint8)'
            ]
        };
        
        // Common tokens on Euler
        this.supportedTokens = [
            { symbol: 'USDC', address: '0xA0b86a33E6441B8435B662bb8f9c4E6234C87B8A' },
            { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
            { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
            { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
            { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
            { symbol: 'USDe', address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3' },
            { symbol: 'sUSDe', address: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497' },
            { symbol: 'weETH', address: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' },
            { symbol: 'ezETH', address: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110' },
            { symbol: 'FRAX', address: '0x853d955aCEf822Db058eb8505911ED77F175b99e' }
        ];
        
        this.provider = null;
        this.contracts_instances = {};
        this.lastUpdate = null;
        this.yieldCache = new Map();
    }
    
    async initialize() {
        try {
            logger.info('Initializing Euler scraper...');
            
            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
            
            // Initialize contract instances
            await this.initializeContracts();
            
            logger.info('Euler scraper initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Euler scraper:', error);
            throw error;
        }
    }
    
    async initializeContracts() {
        const { ethereum } = this.contracts;
        
        this.contracts_instances = {
            euler: new ethers.Contract(ethereum.euler, this.abis.euler, this.provider),
            markets: new ethers.Contract(ethereum.markets, this.abis.markets, this.provider)
        };
    }
    
    async scrapeYields() {
        logger.info('Starting Euler yield scraping...');
        const startTime = Date.now();
        const results = [];
        
        try {
            // Get all supported markets
            const marketData = await this.getMarketData();
            
            // Scrape yields for each market
            for (const market of marketData) {
                try {
                    const yieldData = await this.scrapeMarketYield(market);
                    if (yieldData) {
                        results.push(yieldData);
                    }
                } catch (error) {
                    logger.warn(`Error scraping market ${market.symbol}:`, error.message);
                }
            }
            
            // Get reward token information
            const rewardData = await this.getRewardTokenData();
            
            // Combine base yields with reward yields
            const enrichedResults = this.combineYieldsWithRewards(results, rewardData);
            
            // Cache results
            this.yieldCache.set('latest', {
                timestamp: Date.now(),
                data: enrichedResults
            });
            
            const duration = Date.now() - startTime;
            logger.info(`Euler scraping completed in ${duration}ms. Found ${enrichedResults.length} opportunities`);
            
            return enrichedResults;
            
        } catch (error) {
            logger.error('Error during Euler yield scraping:', error);
            throw error;
        }
    }
    
    async getMarketData() {
        const markets = [];
        
        for (const token of this.supportedTokens) {
            try {
                // Get eToken address
                const eTokenAddress = await this.contracts_instances.markets.underlyingToEToken(token.address);
                
                if (eTokenAddress !== ethers.ZeroAddress) {
                    // Get asset configuration
                    const config = await this.contracts_instances.markets.getAssetConfig(token.address);
                    
                    markets.push({
                        symbol: token.symbol,
                        underlying: token.address,
                        eToken: eTokenAddress,
                        config: config
                    });
                }
            } catch (error) {
                logger.debug(`Token ${token.symbol} not found on Euler:`, error.message);
            }
        }
        
        return markets;
    }
    
    async scrapeMarketYield(market) {
        try {
            // Create eToken contract instance
            const eToken = new ethers.Contract(market.eToken, this.abis.eToken, this.provider);
            
            // Get market metrics
            const [
                totalSupply,
                totalBorrows,
                reserveBalance,
                interestRate,
                interestAccumulator,
                reserveFee
            ] = await Promise.all([
                eToken.totalSupply(),
                eToken.totalBorrows(),
                eToken.reserveBalance(),
                eToken.interestRate(),
                eToken.interestAccumulator(),
                eToken.reserveFee()
            ]);
            
            // Calculate supply APY
            const supplyRate = this.calculateSupplyAPY(
                interestRate,
                totalBorrows,
                totalSupply,
                reserveBalance,
                reserveFee
            );
            
            // Calculate borrow APY
            const borrowRate = this.calculateBorrowAPY(interestRate);
            
            // Get utilization rate
            const utilizationRate = totalSupply > 0n ? 
                (totalBorrows * 10000n) / totalSupply : 0n;
            
            // Get TVL in USD
            const tvlUSD = await this.getTVLInUSD(market.symbol, totalSupply);
            
            return {
                protocol: 'euler',
                chain: 'ethereum',
                asset: market.symbol,
                type: 'lending',
                apy: parseFloat(ethers.formatUnits(supplyRate, 25)), // Convert to percentage
                borrowApy: parseFloat(ethers.formatUnits(borrowRate, 25)),
                tvl: tvlUSD,
                utilization: parseFloat(ethers.formatUnits(utilizationRate, 2)), // Convert to percentage
                timestamp: Date.now(),
                metadata: {
                    eTokenAddress: market.eToken,
                    underlyingAddress: market.underlying,
                    totalSupply: ethers.formatEther(totalSupply),
                    totalBorrows: ethers.formatEther(totalBorrows),
                    reserveBalance: ethers.formatEther(reserveBalance),
                    collateralFactor: market.config.collateralFactor,
                    borrowFactor: market.config.borrowFactor,
                    borrowIsolated: market.config.borrowIsolated
                }
            };
            
        } catch (error) {
            logger.error(`Error scraping yield for ${market.symbol}:`, error);
            return null;
        }
    }
    
    calculateSupplyAPY(interestRate, totalBorrows, totalSupply, reserveBalance, reserveFee) {
        // Euler uses 27-decimal precision for rates
        // Supply APY = (Borrow Rate * Utilization * (1 - Reserve Fee))
        
        if (totalSupply === 0n) return 0n;
        
        const utilization = (totalBorrows * ethers.parseUnits('1', 27)) / totalSupply;
        const reserveFeeRate = reserveFee; // Already in 27-decimal format
        const oneMinusReserveFee = ethers.parseUnits('1', 27) - reserveFeeRate;
        
        const supplyRate = (interestRate * utilization * oneMinusReserveFee) / 
                          (ethers.parseUnits('1', 27) * ethers.parseUnits('1', 27));
        
        return supplyRate;
    }
    
    calculateBorrowAPY(interestRate) {
        // Interest rate is already the borrow rate in Euler
        return interestRate;
    }
    
    async getTVLInUSD(symbol, totalSupply) {
        try {
            // Get price from CoinGecko
            const priceData = await this.getTokenPrice(symbol);
            const price = priceData ? priceData.usd : 0;
            
            // Convert total supply to decimal format (assuming 18 decimals)
            const supplyDecimal = parseFloat(ethers.formatEther(totalSupply));
            
            return supplyDecimal * price;
            
        } catch (error) {
            logger.warn(`Error getting TVL for ${symbol}:`, error.message);
            return 0;
        }
    }
    
    async getTokenPrice(symbol) {
        try {
            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoingeckoId(symbol)}&vs_currencies=usd`,
                { timeout: 10000 }
            );
            
            const coinId = this.getCoingeckoId(symbol);
            return response.data[coinId];
            
        } catch (error) {
            logger.warn(`Error fetching price for ${symbol}:`, error.message);
            return null;
        }
    }
    
    getCoingeckoId(symbol) {
        const mapping = {
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'DAI': 'dai',
            'WETH': 'ethereum',
            'WBTC': 'bitcoin',
            'USDe': 'ethena-usde',
            'sUSDe': 'ethena-staked-usde',
            'weETH': 'wrapped-eeth',
            'ezETH': 'renzo-restaked-eth',
            'FRAX': 'frax'
        };
        
        return mapping[symbol] || symbol.toLowerCase();
    }
    
    async getRewardTokenData() {
        // Euler doesn't have native reward tokens like some protocols,
        // but we can check for external reward programs
        const rewards = [];
        
        try {
            // Check for any active reward programs
            // This would need to be updated based on current Euler reward programs
            
            // Example: Check for EUL token rewards (if any)
            // For now, return empty array as Euler focuses on efficient interest rates
            
            return rewards;
            
        } catch (error) {
            logger.warn('Error fetching reward token data:', error.message);
            return [];
        }
    }
    
    combineYieldsWithRewards(baseYields, rewardData) {
        return baseYields.map(yieldData => {
            // Find matching rewards for this asset
            const assetRewards = rewardData.filter(reward => 
                reward.asset === yieldData.asset
            );
            
            if (assetRewards.length > 0) {
                const totalRewardAPY = assetRewards.reduce((sum, reward) => 
                    sum + reward.apy, 0
                );
                
                return {
                    ...yieldData,
                    totalApy: yieldData.apy + totalRewardAPY,
                    baseApy: yieldData.apy,
                    rewardApy: totalRewardAPY,
                    rewards: assetRewards.map(reward => ({
                        token: reward.token,
                        apy: reward.apy,
                        program: reward.program
                    }))
                };
            }
            
            return {
                ...yieldData,
                totalApy: yieldData.apy,
                baseApy: yieldData.apy,
                rewardApy: 0,
                rewards: []
            };
        });
    }
    
    async getOptimalYieldStrategies() {
        const yields = await this.scrapeYields();
        
        // Sort by total APY
        const sortedByAPY = [...yields].sort((a, b) => b.totalApy - a.totalApy);
        
        // Sort by risk-adjusted yield (higher collateral factor = lower risk)
        const riskAdjusted = [...yields].sort((a, b) => {
            const aRiskScore = (a.totalApy * a.metadata.collateralFactor) / 10000;
            const bRiskScore = (b.totalApy * b.metadata.collateralFactor) / 10000;
            return bRiskScore - aRiskScore;
        });
        
        return {
            highestAPY: sortedByAPY.slice(0, 5),
            bestRiskAdjusted: riskAdjusted.slice(0, 5),
            stablecoins: yields.filter(y => 
                ['USDC', 'USDT', 'DAI', 'FRAX'].includes(y.asset)
            ).sort((a, b) => b.totalApy - a.totalApy),
            ethAssets: yields.filter(y => 
                ['WETH', 'stETH', 'weETH', 'ezETH'].includes(y.asset)
            ).sort((a, b) => b.totalApy - a.totalApy)
        };
    }
    
    async getArbitrageOpportunities() {
        const yields = await this.scrapeYields();
        const opportunities = [];
        
        // Find assets where borrow rate < supply rate on other protocols
        for (const eulerYield of yields) {
            // This would compare with other protocols if we had their data
            // For now, flag potential opportunities based on utilization
            
            if (eulerYield.utilization < 50 && eulerYield.totalApy > 5) {
                opportunities.push({
                    type: 'supply',
                    asset: eulerYield.asset,
                    currentAPY: eulerYield.totalApy,
                    utilization: eulerYield.utilization,
                    tvl: eulerYield.tvl,
                    reasoning: 'Low utilization with good APY - potential for rate arbitrage'
                });
            }
        }
        
        return opportunities;
    }
    
    getLatestYields() {
        const cached = this.yieldCache.get('latest');
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
            return cached.data;
        }
        return null;
    }
}

module.exports = EulerScraper;
