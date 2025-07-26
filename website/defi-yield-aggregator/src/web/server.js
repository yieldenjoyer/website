const express = require('express');
const path = require('path');
const cors = require('cors');
const UniversalYieldOptimizer = require('../core/UniversalYieldOptimizer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize optimizer
let optimizer = null;

async function initializeOptimizer() {
    optimizer = new UniversalYieldOptimizer({
        feeCollectorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e',
        baseFeePercent: 0.001,
        mockMode: true
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
}

// API Routes
app.get('/api/markets', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        const markets = Array.from(optimizer.marketDataCache.values()).slice(0, 100);
        res.json({
            success: true,
            data: markets,
            total: optimizer.marketDataCache.size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/protocols', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        res.json({
            success: true,
            data: optimizer.supportedProtocols
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/opportunities', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        const { userAddress, currentPosition } = req.body;
        
        if (!userAddress || !currentPosition) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const opportunities = await optimizer.findBestOpportunities(userAddress, currentPosition);
        
        res.json({
            success: true,
            data: opportunities.slice(0, 10), // Top 10 opportunities
            count: opportunities.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/fee-estimate', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        const { amount, userAddress } = req.body;
        
        if (!amount || !userAddress) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const feeEstimate = optimizer.calculateDynamicFee(amount, userAddress);
        
        res.json({
            success: true,
            data: feeEstimate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bridge-routes', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        const { fromChain, toChain, asset, amount } = req.body;
        
        if (!fromChain || !toChain || !asset || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const routes = await optimizer.bridgeRouter.getRouteOptions(fromChain, toChain, asset, amount);
        
        res.json({
            success: true,
            data: routes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/execute-swap', async (req, res) => {
    try {
        if (!optimizer) {
            return res.status(503).json({ error: 'Optimizer not initialized' });
        }

        const { userAddress, opportunity } = req.body;
        
        if (!userAddress || !opportunity) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Mock execution for demo
        const result = await optimizer.executeOptimalRebalance(userAddress, opportunity);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: optimizer ? 'initialized' : 'initializing',
        markets: optimizer ? optimizer.marketDataCache.size : 0,
        protocols: optimizer ? Object.keys(optimizer.supportedProtocols).length : 0
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, async () => {
    console.log(`🌐 DeFi Yield Aggregator Web Server running on port ${port}`);
    console.log(`🔗 Access at: http://localhost:${port}`);
    
    console.log('🚀 Initializing Universal Yield Optimizer...');
    await initializeOptimizer();
    console.log('✅ Server ready to accept requests');
});

module.exports = app;
