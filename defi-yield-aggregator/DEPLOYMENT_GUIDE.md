# 🚀 Euler.finance Yield Optimization Bot - Deployment Guide

## Overview

This bot is specifically designed for **Euler.finance** yield optimization. It continuously monitors all available markets on Euler, analyzes yields (including reward tokens), and provides automated alerts when better opportunities arise. The bot helps you swap between assets to always capture the best risk-adjusted yields.

## 🎯 Key Features

### Euler.finance Focused
- **Real-time monitoring** of all Euler markets
- **Comprehensive yield analysis** including base APY + reward tokens
- **Risk assessment** for each Euler market
- **Utilization tracking** to predict rate stability
- **TVL monitoring** for liquidity analysis

### Automated Optimization
- **Smart alerts** when better yields become available
- **Risk-adjusted recommendations** based on your preferences
- **Strategy suggestions** for optimal asset allocation
- **Multi-asset comparison** across all supported Euler tokens

### Professional Features
- **Web dashboard** for real-time monitoring
- **Discord/Telegram alerts** for immediate notifications
- **Historical data tracking** for trend analysis
- **API endpoints** for integration with other tools

## 📋 Prerequisites

- **Node.js 16+** (recommended: Node.js 18 or 20)
- **npm** or **yarn** package manager
- **Ethereum RPC endpoint** (Infura, Alchemy, or your own node)
- **Optional**: Discord webhook URL for alerts
- **Optional**: Telegram bot credentials for notifications

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
cd defi-yield-aggregator
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check Node.js installation
- Install all dependencies
- Create configuration files
- Set up logging directories
- Guide you through initial configuration

### 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Create directories
mkdir -p logs data

# Start the bot
npm start
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# === REQUIRED CONFIGURATION ===
# Ethereum RPC URL (required for Euler data)
ETH_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY

# Server Configuration
PORT=3000
NODE_ENV=production

# === OPTIONAL ALERT CONFIGURATION ===
# Discord webhook for alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR-WEBHOOK-URL

# Telegram bot for alerts
TELEGRAM_BOT_TOKEN=YOUR-BOT-TOKEN
TELEGRAM_CHAT_ID=YOUR-CHAT-ID

# Email alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=alerts@yourdomain.com

# === ADVANCED CONFIGURATION ===
# Database path
DATABASE_PATH=./data/yields.db

# Logging level (info, warn, error, debug)
LOG_LEVEL=info

# Scraping intervals (in milliseconds)
SCRAPING_INTERVAL=300000  # 5 minutes
ANALYSIS_INTERVAL=900000  # 15 minutes

# Alert thresholds
HIGH_YIELD_THRESHOLD=15    # Alert for yields > 15%
YIELD_DROP_THRESHOLD=5     # Alert when yields drop > 5%
NEW_OPPORTUNITY_THRESHOLD=8 # Alert for new opportunities > 8%
```

### Supported Euler Assets

The bot monitors all major assets on Euler including:

- **Stablecoins**: USDC, USDT, DAI, FRAX
- **Ethereum**: WETH, stETH, wstETH, weETH, ezETH
- **Bitcoin**: WBTC
- **Other tokens**: USDe, sUSDe
- **Any new assets** added to Euler (auto-detected)

## 🎮 Usage

### Starting the Bot

```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev

# With PM2 (recommended for production)
npm install -g pm2
pm2 start npm --name "yield-bot" -- start
pm2 save
pm2 startup
```

### Accessing the Dashboard

Once started, access the web dashboard at:
```
http://localhost:3000
```

The dashboard provides:
- Real-time yield data for all Euler markets
- Best opportunities ranked by risk-adjusted returns
- Historical charts and trend analysis
- Current strategy recommendations
- Alert history and settings

### API Endpoints

The bot exposes several API endpoints:

```bash
# Health check
GET http://localhost:3000/health

# Latest yields
GET http://localhost:3000/api/yields

# Best opportunities
GET http://localhost:3000/api/yields/best

# Protocol-specific data
GET http://localhost:3000/api/yields/euler

# Strategy recommendations
GET http://localhost:3000/api/strategies

# Alert configuration
GET http://localhost:3000/api/alerts
POST http://localhost:3000/api/alerts/test
```

## 🔔 Alert System

### Alert Types

1. **High Yield Alerts**: When exceptional yields (>15%) are discovered
2. **New Opportunity Alerts**: When better alternatives to your current position emerge
3. **Euler-specific Alerts**: Special alerts for Euler opportunities
4. **Risk Warnings**: When utilization or other risk factors spike

### Alert Channels

- **Console**: Always active, logs to terminal
- **Discord**: Rich embeds with yield data and recommendations
- **Telegram**: Clean formatted messages with key metrics
- **Email**: Detailed reports with full analysis

### Testing Alerts

```bash
# Test all configured alert channels
curl -X POST http://localhost:3000/api/alerts/test
```

## 📊 Monitoring and Logs

### Log Files

```bash
# View real-time logs
tail -f logs/combined.log

# View only errors
tail -f logs/error.log

# View application logs
npm run logs
```

### Health Monitoring

```bash
# Check bot status
curl http://localhost:3000/health

# View detailed stats
curl http://localhost:3000/api/yields/stats
```

## 🔧 Advanced Configuration

### Custom Alert Thresholds

You can customize alert sensitivity by modifying the AlertSystem:

```javascript
// In src/utils/AlertSystem.js
this.alertThresholds = {
    highYieldThreshold: 12,     // Lower threshold for more alerts
    newOpportunityThreshold: 5, // Alert for 5%+ improvements
    utilizationThreshold: 85,   // Alert at 85% utilization
    // ... other settings
};
```

### Adding New Protocols

While focused on Euler, you can extend to other protocols:

```javascript
// In config/protocols.json
{
  "protocols": {
    "aave-v3": {
      "name": "aave-v3",
      "displayName": "Aave V3",
      "enabled": false,  // Set to true to enable
      "chains": ["ethereum"],
      // ... configuration
    }
  }
}
```

### Database Management

```bash
# View database contents
sqlite3 data/yields.db ".tables"
sqlite3 data/yields.db "SELECT * FROM yields ORDER BY timestamp DESC LIMIT 10;"

# Backup database
cp data/yields.db data/yields-backup-$(date +%Y%m%d).db

# Clean old data (keeps last 7 days)
curl -X POST http://localhost:3000/api/database/cleanup
```

## 🚨 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs yield-bot

# Restart
pm2 restart yield-bot
```

### Docker Deployment

```bash
# Build image
docker build -t euler-yield-bot .

# Run container
docker run -d \
  --name yield-bot \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  euler-yield-bot
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Cannot connect to RPC"**
   - Check your ETH_RPC_URL in .env
   - Ensure your RPC provider is working
   - Try a different RPC endpoint

2. **"No yield data found"**
   - Wait 5-10 minutes for initial data collection
   - Check RPC connection
   - Verify Euler contracts are accessible

3. **"Discord alerts not working"**
   - Verify webhook URL is correct
   - Test webhook manually
   - Check Discord server permissions

4. **High memory usage**
   - Increase Node.js memory limit: `node --max-old-space-size=4096 src/index.js`
   - Clear old data: `curl -X POST http://localhost:3000/api/database/cleanup`

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm start

# Or set in .env file
LOG_LEVEL=debug
```

### Getting Help

1. Check the logs in `logs/error.log`
2. Review the configuration in `.env`
3. Test individual components:
   ```bash
   # Test database connection
   node -e "const db = require('./src/utils/database'); db.initialize().then(() => console.log('DB OK'))"
   
   # Test RPC connection
   node -e "const { ethers } = require('ethers'); const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL); provider.getBlockNumber().then(console.log)"
   ```

## 📈 Expected Performance

### Data Collection
- **First run**: 2-5 minutes to collect initial data
- **Regular updates**: Every 5 minutes
- **Analysis cycles**: Every 15 minutes
- **Alert processing**: Every 1 minute

### Resource Usage
- **Memory**: 100-300MB typical
- **CPU**: Low (mostly waiting for RPC calls)
- **Storage**: ~10MB/day for historical data
- **Network**: Minimal (periodic RPC calls)

## 🎯 Optimization Tips

1. **Use a dedicated RPC endpoint** for reliable data
2. **Set appropriate alert thresholds** to avoid spam
3. **Monitor regularly** for the first few days to tune settings
4. **Keep the bot running 24/7** for best yield capture
5. **Review historical data** weekly to identify patterns

---

Your Euler.finance Yield Optimization Bot is now ready to help you maximize your DeFi yields! 🚀

For support or questions, check the logs first, then review this guide.
