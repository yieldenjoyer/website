# 🚀 APY Tracker - DeFi Yield Monitor

A comprehensive Docker-based application that tracks APY rates for stablecoins (USDC, USDE, USDT), WETH, and WBTC across multiple DeFi protocols with comprehensive risk analysis.

## 📋 Features

### 📊 Token Coverage
- **Stablecoins**: USDC, USDe, USDT
- **Crypto Assets**: WETH, WBTC

### 🔍 Data Sources
- **DeFi Llama**: Comprehensive protocol and yield data
- **Vaults.fyi**: Additional vault and yield opportunities

### 🛡️ Risk Assessment
- **Multi-factor Risk Scoring**: Protocol, TVL, APY, Chain, and IL risk
- **Risk Ratings**: Very Low, Low, Medium, High, Very High
- **Risk Factors**: Detailed breakdown of potential risks
- **Warnings System**: Real-time alerts for suspicious yields

### 🗺️ Step-by-step Routes
- **Clear Instructions**: How to access each yield opportunity
- **Time Estimates**: Expected completion time for each route
- **Direct Links**: URLs to protocol interfaces

### ⚡ Real-time Updates
- **Auto-refresh**: Data updates every 10 minutes
- **Live Dashboard**: Real-time web interface
- **Health Monitoring**: Built-in health checks

## 🐳 Docker Deployment

### Quick Start
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run with npm after installing dependencies
npm install
npm start
```

### Docker Commands
```bash
# Build the Docker image
docker build -t apy-tracker .

# Run the container
docker run -p 3000:3000 apy-tracker

# Run with Docker Compose (recommended)
docker-compose up -d
```

## 📈 API Endpoints

### Get All APY Data
```
GET /api/apy
```

### Get Token-specific Data
```
GET /api/apy/USDC
GET /api/apy/USDE
GET /api/apy/USDT
GET /api/apy/WETH
GET /api/apy/WBTC
```

### Health Check
```
GET /api/health
```

## 🌐 Web Interface

Access the web dashboard at `http://localhost:3000`

### Dashboard Features
- **Token Tabs**: Switch between different tokens
- **APY Display**: Large, easy-to-read APY percentages
- **Risk Badges**: Color-coded risk levels
- **Detailed Cards**: Protocol info, TVL, and risk factors
- **Route Instructions**: Step-by-step access guides
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

```
apy-tracker/
├── src/
│   ├── index.js                 # Main application server
│   ├── services/
│   │   ├── apyService.js        # Data fetching from APIs
│   │   └── riskAssessment.js    # Risk scoring and analysis
│   └── utils/
│       └── logger.js            # Logging configuration
├── public/
│   └── index.html              # Web dashboard
├── Dockerfile                  # Container configuration
├── docker-compose.yml         # Multi-container setup
└── package.json               # Dependencies and scripts
```

## ⚙️ Configuration

### Environment Variables
```bash
NODE_ENV=production      # Environment mode
PORT=3000               # Server port
LOG_LEVEL=info          # Logging level
```

### Risk Assessment Parameters
- **Protocol Risk**: Based on protocol maturity and audit status
- **TVL Risk**: Higher TVL = lower risk
- **APY Risk**: Extremely high APYs flagged as risky
- **Chain Risk**: Ethereum < L2s < Alt chains
- **IL Risk**: Impermanent loss potential

## 🔒 Risk Ratings Explained

### Risk Levels
- 🟢 **Very Low (0-15)**: Blue-chip protocols, reasonable APYs
- 🟢 **Low (15-30)**: Established protocols, moderate risk
- 🟡 **Medium (30-50)**: Some risk factors present
- 🔴 **High (50-70)**: Significant risk, high APYs
- 🚨 **Very High (70+)**: Extremely risky, potential rug pulls

### Risk Factors Considered
1. **Protocol Maturity**: Age, audit status, track record
2. **Total Value Locked**: Higher TVL = more trust/liquidity
3. **APY Sustainability**: Unrealistic APYs flagged
4. **Blockchain Risk**: Network reliability and decentralization
5. **Impermanent Loss**: For liquidity pool positions

## 📊 Data Flow

1. **Data Collection**: Fetch from DeFi Llama and Vaults.fyi APIs
2. **Risk Analysis**: Apply multi-factor scoring algorithm
3. **Route Generation**: Create step-by-step access instructions
4. **Web Display**: Serve via responsive dashboard
5. **Auto-refresh**: Update every 10 minutes

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Docker Development
```bash
# Build and run development container
docker-compose up --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 📋 API Response Format

```json
{
  "lastUpdated": "2024-01-01T12:00:00Z",
  "tokens": {
    "USDC": [
      {
        "protocol": "Aave",
        "pool": "USDC",
        "apy": 4.5,
        "tvl": 1000000000,
        "chain": "ethereum",
        "riskRating": "LOW",
        "riskScore": 20,
        "riskFactors": ["Medium liquidity"],
        "recommendation": "✅ Generally safe...",
        "warnings": [],
        "route": {
          "totalSteps": 4,
          "estimatedTime": "5-10 minutes",
          "steps": [...]
        }
      }
    ]
  }
}
```

## 🚨 Disclaimers

⚠️ **Investment Risk Warning**: 
- This tool is for informational purposes only
- DeFi investments carry significant risks including total loss
- Always do your own research before investing
- Past performance does not guarantee future results

⚠️**Data Accuracy**:
- APY rates can change rapidly
- Risk assessments are algorithmic estimates
- Always verify information on protocol websites

## 📞 Support

For technical issues or questions:
- Check the logs: `docker-compose logs`
- Review the health endpoint: `/api/health`
- Verify API connectivity to data sources

## 🔄 Updates

The application automatically updates data every 10 minutes. For manual updates, restart the container:

```bash
docker-compose restart
```

## 📜 License

MIT License - Feel free to use and modify for your needs.

---

**Happy Yield Farming! 🌾💰**
