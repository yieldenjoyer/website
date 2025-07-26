const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ethers } = require('ethers');

require('dotenv').config();

const logger = require('./utils/logger');
const Database = require('./utils/database');
const ScraperManager = require('./scrapers/ScraperManager');
const YieldAnalyzer = require('./analyzers/YieldAnalyzer');
const StrategyEngine = require('./strategies/StrategyEngine');
const AlertSystem = require('./utils/AlertSystem');
const ProtocolRegistry = require('./utils/ProtocolRegistry');

// New automated execution components
const TransactionExecutor = require('./execution/TransactionExecutor');
const PositionManager = require('./managers/PositionManager');
const RiskCalculator = require('./analytics/RiskCalculator');
const RebalanceOrchestrator = require('./automation/RebalanceOrchestrator');

class DeFiYieldAggregator {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Core components
        this.database = new Database();
        this.scraperManager = new ScraperManager();
        this.yieldAnalyzer = new YieldAnalyzer();
        this.strategyEngine = new StrategyEngine();
        this.alertSystem = new AlertSystem();
        this.protocolRegistry = new ProtocolRegistry();
        
        // Automated execution components
        this.providers = {};
        this.transactionExecutor = null;
        this.positionManager = null;
        this.riskCalculator = new RiskCalculator();
        this.rebalanceOrchestrator = null;
        
        this.isRunning = false;
        this.connectedClients = new Set();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupCronJobs();
    }
    
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.url}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        
        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: require('../package.json').version,
                automation: this.rebalanceOrchestrator ? 
                    this.rebalanceOrchestrator.getAutomationStatus() : null
            });
        });
        
        // Automation management endpoints
        this.app.post('/api/automation/enable', async (req, res) => {
            try {
                const { userAddress, preferences } = req.body;
                
                if (!userAddress || !ethers.isAddress(userAddress)) {
                    return res.status(400).json({ error: 'Valid user address required' });
                }
                
                await this.rebalanceOrchestrator.enableAutomationForUser(userAddress, preferences);
                
                res.json({ 
                    success: true, 
                    message: `Automation enabled for ${userAddress}` 
                });
                
            } catch (error) {
                logger.error('Failed to enable automation:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/automation/disable', async (req, res) => {
            try {
                const { userAddress } = req.body;
                
                if (!userAddress || !ethers.isAddress(userAddress)) {
                    return res.status(400).json({ error: 'Valid user address required' });
                }
                
                await this.rebalanceOrchestrator.disableAutomationForUser(userAddress);
                
                res.json({ 
                    success: true, 
                    message: `Automation disabled for ${userAddress}` 
                });
                
            } catch (error) {
                logger.error('Failed to disable automation:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/automation/status', async (req, res) => {
            try {
                const status = await this.rebalanceOrchestrator.getAutomationStatus();
                res.json(status);
            } catch (error) {
                logger.error('Failed to get automation status:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/automation/emergency-stop', async (req, res) => {
            try {
                await this.rebalanceOrchestrator.emergencyStop();
                res.json({ 
                    success: true, 
                    message: 'Emergency stop activated' 
                });
            } catch (error) {
                logger.error('Failed to execute emergency stop:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Position management endpoints
        this.app.get('/api/positions/:userAddress', async (req, res) => {
            try {
                const { userAddress } = req.params;
                
                if (!ethers.isAddress(userAddress)) {
                    return res.status(400).json({ error: 'Invalid user address' });
                }
                
                const positions = this.positionManager.getUserPositions(userAddress);
                const portfolio = await this.positionManager.getPortfolioSummary(userAddress);
                
                res.json({
                    positions,
                    portfolio,
                    limits: this.positionManager.getPositionLimits()
                });
                
            } catch (error) {
                logger.error('Failed to get positions:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/positions/track', async (req, res) => {
            try {
                const { userAddress, positionData } = req.body;
                
                if (!ethers.isAddress(userAddress)) {
                    return res.status(400).json({ error: 'Invalid user address' });
                }
                
                const result = await this.positionManager.trackUserPosition(userAddress, positionData);
                res.json(result);
                
            } catch (error) {
                logger.error('Failed to track position:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Risk analysis endpoints
        this.app.post('/api/risk/analyze', async (req, res) => {
            try {
                const { marketData } = req.body;
                const analysis = this.riskCalculator.calculateRiskAdjustedAPY(marketData);
                res.json(analysis);
            } catch (error) {
                logger.error('Failed to analyze risk:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/risk/compare', async (req, res) => {
            try {
                const { currentPosition, alternatives, userPreferences } = req.body;
                const comparison = this.riskCalculator.compareOpportunities(
                    currentPosition,
                    alternatives,
                    userPreferences
                );
                res.json(comparison);
            } catch (error) {
                logger.error('Failed to compare opportunities:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Existing API Routes
        this.app.use('/api/yields', require('./routes/yields'));
        this.app.use('/api/protocols', require('./routes/protocols'));
        this.app.use('/api/strategies', require('./routes/strategies'));
        this.app.use('/api/portfolio', require('./routes/portfolio'));
        this.app.use('/api/alerts', require('./routes/alerts'));
        
        // Serve dashboard static files
        this.app.use('/', express.static('src/dashboard/public'));
        
        // Catch all route
        this.app.get('*', (req, res) => {
            res.sendFile(__dirname + '/dashboard/public/index.html');
        });
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);
            this.connectedClients.add(socket);
            
            // Send initial data
            this.sendYieldUpdate(socket);
            
            socket.on('subscribe', (data) => {
                const { protocols, assets, chains } = data;
                socket.join(`yields:${protocols?.join(',') || 'all'}`);
                logger.info(`Client subscribed to yields: ${socket.id}`);
            });
            
            socket.on('subscribeAutomation', (data) => {
                const { userAddress } = data;
                if (userAddress && ethers.isAddress(userAddress)) {
                    socket.join(`automation:${userAddress}`);
                    logger.info(`Client subscribed to automation updates for ${userAddress}`);
                }
            });
            
            socket.on('unsubscribe', (data) => {
                socket.leave(`yields:${data.room}`);
                logger.info(`Client unsubscribed: ${socket.id}`);
            });
            
            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket);
            });
        });
    }
    
    setupCronJobs() {
        // Main scraping job - every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            if (!this.isRunning) {
                logger.info('Starting scheduled yield scraping...');
                await this.runScrapingCycle();
            }
        });
        
        // Strategy analysis - every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            logger.info('Running strategy analysis...');
            await this.runStrategyAnalysis();
        });
        
        // Alert processing - every minute
        cron.schedule('* * * * *', async () => {
            await this.processAlerts();
        });
        
        // Position updates - every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            if (this.positionManager) {
                await this.updateUserPositions();
            }
        });
        
        // Data cleanup - daily at 3 AM
        cron.schedule('0 3 * * *', async () => {
            logger.info('Running daily data cleanup...');
            await this.cleanupOldData();
        });
    }
    
    async setupProviders() {
        try {
            // Initialize blockchain providers for different chains
            const chains = {
                1: process.env.ETH_RPC_URL,        // Ethereum
                137: process.env.POLYGON_RPC_URL,  // Polygon
                42161: process.env.ARBITRUM_RPC_URL, // Arbitrum
                10: process.env.OPTIMISM_RPC_URL,  // Optimism
                8453: process.env.BASE_RPC_URL     // Base
            };
            
            for (const [chainId, rpcUrl] of Object.entries(chains)) {
                if (rpcUrl) {
                    this.providers[chainId] = new ethers.JsonRpcProvider(rpcUrl);
                    logger.info(`Initialized provider for chain ${chainId}`);
                }
            }
            
        } catch (error) {
            logger.error('Failed to setup providers:', error);
        }
    }
    
    async initialize() {
        try {
            logger.info('Initializing DeFi Yield Aggregator...');
            
            // Initialize database
            await this.database.initialize();
            logger.info('Database initialized');
            
            // Setup blockchain providers
            await this.setupProviders();
            logger.info(`Initialized providers for ${Object.keys(this.providers).length} chains`);
            
            // Initialize transaction executor (if wallet is configured)
            if (process.env.PRIVATE_KEY && Object.keys(this.providers).length > 0) {
                const walletConfig = {
                    privateKey: process.env.PRIVATE_KEY
                };
                
                this.transactionExecutor = new TransactionExecutor(this.providers, walletConfig);
                logger.info('Transaction executor initialized');
            } else {
                logger.warn('Transaction executor not initialized - missing PRIVATE_KEY or providers');
            }
            
            // Initialize position manager
            this.positionManager = new PositionManager(this.database, this.transactionExecutor);
            await this.positionManager.initialize();
            logger.info('Position manager initialized');
            
            // Load protocol configurations
            await this.protocolRegistry.loadProtocols();
            logger.info(`Loaded ${this.protocolRegistry.getProtocolCount()} protocols`);
            
            // Initialize scrapers
            await this.scraperManager.initialize(this.protocolRegistry);
            logger.info('Scrapers initialized');
            
            // Initialize yield analyzer
            await this.yieldAnalyzer.initialize(this.database);
            logger.info('Yield analyzer initialized');
            
            // Initialize strategy engine
            await this.strategyEngine.initialize(this.database, this.yieldAnalyzer);
            logger.info('Strategy engine initialized');
            
            // Initialize alert system
            await this.alertSystem.initialize();
            logger.info('Alert system initialized');
            
            // Initialize rebalance orchestrator
            if (this.transactionExecutor) {
                this.rebalanceOrchestrator = new RebalanceOrchestrator({
                    database: this.database,
                    positionManager: this.positionManager,
                    transactionExecutor: this.transactionExecutor,
                    riskCalculator: this.riskCalculator,
                    scraperManager: this.scraperManager,
                    alertSystem: this.alertSystem
                });
                
                await this.rebalanceOrchestrator.initialize();
                logger.info('Rebalance orchestrator initialized');
            } else {
                logger.warn('Rebalance orchestrator not initialized - transaction executor unavailable');
            }
            
            logger.info('DeFi Yield Aggregator initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize aggregator:', error);
            throw error;
        }
    }
    
    async start() {
        try {
            await this.initialize();
            
            const port = process.env.PORT || 3000;
            const host = process.env.HOST || '0.0.0.0';
            
            this.server.listen(port, host, () => {
                logger.info(`DeFi Yield Aggregator listening on ${host}:${port}`);
                logger.info(`Dashboard: http://localhost:${port}`);
                logger.info(`API: http://localhost:${port}/api`);
                
                if (this.rebalanceOrchestrator) {
                    logger.info('🤖 Automated yield optimization enabled');
                } else {
                    logger.info('📊 Monitoring mode only - automation disabled');
                }
            });
            
            // Run initial scraping
            setTimeout(() => {
                this.runScrapingCycle();
            }, 5000);
            
        } catch (error) {
            logger.error('Failed to start aggregator:', error);
            process.exit(1);
        }
    }
    
    async runScrapingCycle() {
        if (this.isRunning) {
            logger.warn('Scraping cycle already running, skipping...');
            return;
        }
        
        this.isRunning = true;
        const startTime = Date.now();
        
        try {
            logger.info('Starting yield scraping cycle...');
            
            // Run all scrapers
            const results = await this.scraperManager.scrapeAll();
            
            // Store results in database
            await this.database.storeYieldData(results);
            
            // Analyze yields and update rankings
            const analysis = await this.yieldAnalyzer.analyzeAll();
            
            // Broadcast updates to connected clients
            this.broadcastYieldUpdate(analysis);
            
            const duration = Date.now() - startTime;
            logger.info(`Scraping cycle completed in ${duration}ms. Found ${results.length} yield opportunities.`);
            
        } catch (error) {
            logger.error('Error in scraping cycle:', error);
        } finally {
            this.isRunning = false;
        }
    }
    
    async runStrategyAnalysis() {
        try {
            logger.info('Running strategy analysis...');
            
            // Get latest yield data
            const latestYields = await this.database.getLatestYields();
            
            // Generate optimal strategies
            const strategies = await this.strategyEngine.generateStrategies(latestYields);
            
            // Store strategy recommendations
            await this.database.storeStrategies(strategies);
            
            // Check for alerts
            await this.checkForAlerts(strategies);
            
            logger.info(`Generated ${strategies.length} strategy recommendations`);
            
        } catch (error) {
            logger.error('Error in strategy analysis:', error);
        }
    }
    
    async updateUserPositions() {
        try {
            if (!this.positionManager) return;
            
            logger.info('Updating user positions...');
            
            const allPositions = await this.positionManager.getAllActivePositions();
            let updatedCount = 0;
            
            for (const position of allPositions) {
                try {
                    // Get latest yield data for this position's market
                    const latestYield = await this.database.getLatestYieldForMarket(
                        position.protocol,
                        position.chainId,
                        position.market
                    );
                    
                    if (latestYield) {
                        await this.positionManager.updatePosition(
                            position.userAddress,
                            position.id,
                            {
                                currentYield: latestYield.apy,
                                riskScore: latestYield.riskScore || position.riskScore,
                                rewards: latestYield.rewards || position.rewards
                            }
                        );
                        updatedCount++;
                    }
                    
                } catch (error) {
                    logger.error(`Failed to update position ${position.id}:`, error);
                }
            }
            
            if (updatedCount > 0) {
                logger.info(`Updated ${updatedCount} user positions`);
                
                // Broadcast position updates
                this.io.emit('positionsUpdated', {
                    timestamp: new Date().toISOString(),
                    updatedCount
                });
            }
            
        } catch (error) {
            logger.error('Error updating user positions:', error);
        }
    }
    
    async checkForAlerts(strategies) {
        try {
            const alerts = await this.alertSystem.checkAlerts(strategies);
            
            if (alerts.length > 0) {
                // Send alerts via configured channels
                await this.alertSystem.sendAlerts(alerts);
                
                // Broadcast to connected clients
                this.io.emit('alerts', alerts);
                
                logger.info(`Sent ${alerts.length} alerts`);
            }
            
        } catch (error) {
            logger.error('Error checking alerts:', error);
        }
    }
    
    async processAlerts() {
        try {
            const pendingAlerts = await this.database.getPendingAlerts();
            
            for (const alert of pendingAlerts) {
                await this.alertSystem.processAlert(alert);
            }
            
        } catch (error) {
            logger.error('Error processing alerts:', error);
        }
    }
    
    async cleanupOldData() {
        try {
            const olderThan = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
            const deletedCount = await this.database.cleanupOldData(olderThan);
            logger.info(`Cleaned up ${deletedCount} old records`);
            
        } catch (error) {
            logger.error('Error cleaning up old data:', error);
        }
    }
    
    broadcastYieldUpdate(analysis) {
        const update = {
            timestamp: new Date().toISOString(),
            topYields: analysis.topYields,
            bestOpportunities: analysis.bestOpportunities,
            riskAnalysis: analysis.riskAnalysis,
            summary: analysis.summary
        };
        
        this.io.emit('yieldUpdate', update);
        logger.debug('Broadcasted yield update to connected clients');
    }
    
    broadcastAutomationUpdate(userAddress, event, data) {
        this.io.to(`automation:${userAddress}`).emit('automationUpdate', {
            timestamp: new Date().toISOString(),
            event,
            data
        });
    }
    
    async sendYieldUpdate(socket) {
        try {
            const latestAnalysis = await this.yieldAnalyzer.getLatestAnalysis();
            if (latestAnalysis) {
                socket.emit('yieldUpdate', latestAnalysis);
            }
        } catch (error) {
            logger.error('Error sending yield update:', error);
        }
    }
    
    async gracefulShutdown() {
        logger.info('Shutting down DeFi Yield Aggregator...');
        
        // Stop automation
        if (this.rebalanceOrchestrator) {
            await this.rebalanceOrchestrator.stopAutomation();
        }
        
        // Close server
        this.server.close();
        
        // Stop scrapers
        await this.scraperManager.stop();
        
        // Close database connections
        await this.database.close();
        
        logger.info('Shutdown complete');
        process.exit(0);
    }
}

// Handle process signals
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM');
    if (global.aggregator) {
        global.aggregator.gracefulShutdown();
    }
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT');
    if (global.aggregator) {
        global.aggregator.gracefulShutdown();
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the application
if (require.main === module) {
    const aggregator = new DeFiYieldAggregator();
    global.aggregator = aggregator;
    aggregator.start();
}

module.exports = DeFiYieldAggregator;
