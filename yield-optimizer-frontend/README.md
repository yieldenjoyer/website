# USDe/sUSDe Yield Optimization Engine Frontend

A React-based frontend for the USDe/sUSDe Yield Optimization Engine, featuring AI-powered strategies, automated rebalancing, and institutional-grade risk management.

## 🚀 Features

- **Multi-Strategy Vault Selection**: Conservative, Balanced, Aggressive, and Custom strategies
- **Real-time Portfolio Dashboard**: Live APY tracking, allocation visualization, and performance charts
- **Web3 Integration**: MetaMask wallet connection with ethers.js
- **Interactive Charts**: Recharts-powered pie charts and line graphs
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: Zustand for efficient global state management

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yield-optimizer-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
yield-optimizer-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── YieldOptimizer.js    # Main yield optimizer component
│   ├── stores/
│   │   └── useStore.js          # Zustand global state store
│   ├── contracts/
│   │   └── USDEYieldVault.js    # Smart contract interfaces
│   ├── App.js                   # Main app with routing
│   ├── index.js                 # React entry point
│   └── index.css                # Tailwind CSS styles
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎯 Key Components

### YieldOptimizer Component
The main dashboard component featuring:
- Wallet connection interface
- Vault strategy selection (Conservative, Balanced, Aggressive, Custom)
- Portfolio metrics (balance, APY, earnings)
- Interactive allocation pie charts
- Performance history line charts
- Deposit/withdrawal interfaces

### Global State Management
Using Zustand for:
- Wallet connection state
- Portfolio data
- Vault selection
- Theme preferences
- Loading states

## 🔗 Navigation Routes

- `/` - Home page with feature overview
- `/dashboard` - User dashboard
- `/pools` - Liquidity pools
- `/governance` - DAO governance
- `/yield` - **Yield Optimizer (main feature)**

## 🎨 Styling

Built with Tailwind CSS featuring:
- Custom color palette (primary, secondary, accent)
- Dark/light theme support
- Responsive breakpoints
- Custom component classes
- Smooth transitions and animations

## 🔧 Configuration

### Smart Contract Integration

Update the contract address in `YieldOptimizer.js`:

```javascript
const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### Backend API Integration

Replace mock data calls with your backend endpoints:

```javascript
// Example: Replace mock data in fetchPortfolioData()
const response = await fetch(`/api/strategies?type=${selectedVault}&address=${account}`);
const data = await response.json();
```

## 📊 Mock Data

The application includes comprehensive mock data for:
- Vault strategies with different APY rates
- Portfolio allocation pie charts
- Historical performance data
- Risk scores and metrics

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload the `build` folder to Netlify
```

## 🔐 Smart Contract Deployment

1. **Deploy the USDEYieldVault contract** using Hardhat or Remix
2. **Update the contract address** in the frontend
3. **Test on Converge testnet** before mainnet deployment
4. **Get USDe/sUSDe test tokens** from Ethena faucet

### Example Deployment Script (Hardhat)

```javascript
// scripts/deploy.js
async function main() {
  const USDEYieldVault = await ethers.getContractFactory("USDEYieldVault");
  const vault = await USDEYieldVault.deploy(USDE_TOKEN_ADDRESS);
  await vault.deployed();
  console.log("USDEYieldVault deployed to:", vault.address);
}
```

## 🔄 Backend Integration

Create a Node.js backend for:

```javascript
// Example backend endpoints
app.get('/api/strategies', (req, res) => {
  // Return strategy data based on vault type
});

app.get('/api/apy', (req, res) => {
  // Return real-time APY data
});

app.post('/api/rebalance', (req, res) => {
  // Trigger ML-powered rebalancing
});
```

## 🤖 Machine Learning Integration

For production, integrate ML optimization:

```python
# Python ML service example
from scipy.optimize import minimize
import numpy as np

def optimize_portfolio(returns, risks):
    def objective(weights):
        portfolio_return = np.dot(weights, returns)
        portfolio_risk = np.sqrt(np.dot(weights.T, np.dot(np.cov(risks), weights)))
        return -portfolio_return / portfolio_risk  # Negative Sharpe ratio
    
    constraints = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
    bounds = [(0, 1) for _ in returns]
    result = minimize(objective, [1/len(returns)]*len(returns), bounds=bounds, constraints=constraints)
    return result.x
```

## 📈 Features Roadmap

- [ ] Cross-chain support (LayerZero integration)
- [ ] Advanced risk metrics
- [ ] Social trading features
- [ ] Mobile app (React Native)
- [ ] DeFi protocol integrations
- [ ] Automated strategy creation
- [ ] Yield farming optimization
- [ ] NFT rewards system

## 🐛 Troubleshooting

### Common Issues

1. **MetaMask not connecting**
   - Ensure MetaMask is installed
   - Check network settings
   - Clear browser cache

2. **Charts not rendering**
   - Verify Recharts installation
   - Check browser console for errors

3. **Styling issues**
   - Rebuild Tailwind CSS
   - Check dark mode settings

### Debug Mode

Enable debug logging:

```javascript
// In your component
const debug = process.env.NODE_ENV === 'development';
if (debug) console.log('Debug info:', data);
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@yieldoptimizer.com

---

**Built with ❤️ using React, Tailwind CSS, ethers.js, and Recharts**
