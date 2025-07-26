const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const logger = require('./utils/logger');
const apyService = require('./services/apyService');
const riskAssessment = require('./services/riskAssessment');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - temporarily disabled helmet for inline scripts
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Global data store
let apyData = {
  lastUpdated: null,
  tokens: {}
};

// Update APY data
async function updateAPYData() {
  try {
    logger.info('Updating APY data...');
    
    const tokens = ['USDC', 'USDE', 'USDT', 'WETH', 'WBTC'];
    const updatedData = {
      lastUpdated: new Date().toISOString(),
      tokens: {}
    };

    for (const token of tokens) {
      try {
        const yieldOpportunities = await apyService.fetchYieldOpportunities(token);
        const processedData = riskAssessment.assessRisks(yieldOpportunities, token);
        updatedData.tokens[token] = processedData;
        logger.info(`Updated ${token} data: ${processedData.length} opportunities found`);
      } catch (error) {
        logger.error(`Failed to update ${token} data:`, error.message);
        // Keep previous data if available
        if (apyData.tokens[token]) {
          updatedData.tokens[token] = apyData.tokens[token];
        } else {
          updatedData.tokens[token] = [];
        }
      }
    }

    apyData = updatedData;
    logger.info('APY data update completed');
  } catch (error) {
    logger.error('Failed to update APY data:', error);
  }
}

// API Routes
app.get('/api/apy', (req, res) => {
  res.json(apyData);
});

app.get('/api/apy/:token', (req, res) => {
  const token = req.params.token.toUpperCase();
  if (apyData.tokens[token]) {
    res.json({
      token,
      data: apyData.tokens[token],
      lastUpdated: apyData.lastUpdated
    });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    lastUpdated: apyData.lastUpdated,
    uptime: process.uptime()
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Schedule data updates every 10 minutes
cron.schedule('*/10 * * * *', updateAPYData);

// Initial data load
updateAPYData();

app.listen(PORT, () => {
  logger.info(`APY Tracker server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
