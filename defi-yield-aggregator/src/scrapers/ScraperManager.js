const EulerScraper = require('./EulerScraper');
const logger = require('../utils/logger').loggers.scraper;

class ScraperManager {
    constructor() {
        this.scrapers = new Map();
        this.isInitialized = false;
        this.protocolRegistry = null;
    }
    
    async initialize(protocolRegistry) {
        try {
            logger.info('Initializing Scraper Manager...');
            
            this.protocolRegistry = protocolRegistry;
            
            // Initialize Euler scraper (primary focus)
            const eulerScraper = new EulerScraper();
            await eulerScraper.initialize();
            this.scrapers.set('euler', eulerScraper);
            
            this.isInitialized = true;
            logger.info(`Initialized ${this.scrapers.size} scrapers`);
            
        } catch (error) {
            logger.error('Failed to initialize scraper manager:', error);
            throw error;
        }
    }
    
    async scrapeAll() {
        if (!this.isInitialized) {
            throw new Error('Scraper manager not initialized');
        }
        
        const results = [];
        const startTime = Date.now();
        
        logger.info('Starting comprehensive yield scraping...');
        
        for (const [protocolName, scraper] of this.scrapers) {
            try {
                logger.info(`Scraping ${protocolName}...`);
                const scraperResults = await scraper.scrapeYields();
                results.push(...scraperResults);
                
                logger.info(`${protocolName}: Found ${scraperResults.length} opportunities`);
                
            } catch (error) {
                logger.error(`Error scraping ${protocolName}:`, error);
            }
        }
        
        const duration = Date.now() - startTime;
        logger.info(`Scraping completed in ${duration}ms. Total opportunities: ${results.length}`);
        
        return results;
    }
    
    async scrapeProtocol(protocolName) {
        const scraper = this.scrapers.get(protocolName);
        if (!scraper) {
            throw new Error(`Scraper for ${protocolName} not found`);
        }
        
        return await scraper.scrapeYields();
    }
    
    getSupportedProtocols() {
        return Array.from(this.scrapers.keys());
    }
    
    async getOptimalStrategies() {
        const strategies = {};
        
        for (const [protocolName, scraper] of this.scrapers) {
            if (scraper.getOptimalYieldStrategies) {
                try {
                    strategies[protocolName] = await scraper.getOptimalYieldStrategies();
                } catch (error) {
                    logger.warn(`Error getting strategies from ${protocolName}:`, error.message);
                }
            }
        }
        
        return strategies;
    }
    
    async stop() {
        logger.info('Stopping all scrapers...');
        
        for (const [protocolName, scraper] of this.scrapers) {
            try {
                if (scraper.stop) {
                    await scraper.stop();
                }
            } catch (error) {
                logger.warn(`Error stopping ${protocolName} scraper:`, error.message);
            }
        }
        
        this.scrapers.clear();
        this.isInitialized = false;
    }
}

module.exports = ScraperManager;
