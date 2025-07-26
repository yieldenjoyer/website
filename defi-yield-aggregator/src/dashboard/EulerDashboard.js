const express = require('express');
const path = require('path');

class EulerDashboard {
    constructor(eulerOptimizer, port = 3333) {
        this.optimizer = eulerOptimizer;
        this.port = port;
        this.app = express();
        this.setupRoutes();
    }

    setupRoutes() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'public')));

        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                automation: this.optimizer.automationSettings,
                optimization: this.optimizer.optimizationSettings,
                chains: Object.keys(this.optimizer.supportedChains),
                lastUpdate: new Date()
            });
        });

        this.app.get('/api/markets', (req, res) => {
            const markets = [];
            for (const [key, data] of this.optimizer.marketDataCache) {
                if (Array.isArray(data)) {
                    data.forEach(market => {
                        markets.push({
                            id: `${market.chain}-${market.deployment}-${market.asset}`,
                            ...market
                        });
                    });
                }
            }
            res.json(markets);
        });

        this.app.get('/api/positions/:address', (req, res) => {
            const positions = this.optimizer.userPositions.get(req.params.address) || [];
            res.json(positions);
        });

        this.app.get('/api/opportunities/:address', async (req, res) => {
            try {
                const preferences = this.optimizer.userPreferences.get(req.params.address);
                if (!preferences) {
                    return res.json([]);
                }
                const opportunities = await this.optimizer.findOpportunitiesForUser(
                    req.params.address, 
                    preferences
                );
                res.json(opportunities);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Serve the dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }

    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Euler Cross-Chain Optimizer Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #e0e0e0;
            line-height: 1.6;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #1a1a2e;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #2a2a3e;
            transition: all 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,150,255,0.2);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #00d4ff;
            margin: 10px 0;
        }
        .markets-section {
            background: #1a1a2e;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .market-grid {
            display: grid;
            gap: 15px;
            margin-top: 20px;
        }
        .market-item {
            background: #252538;
            padding: 20px;
            border-radius: 8px;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            border: 1px solid #3a3a4e;
            transition: all 0.2s ease;
        }
        .market-item:hover {
            border-color: #00d4ff;
            background: #2a2a3e;
        }
        .chain-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-right: 10px;
        }
        .chain-ethereum { background: #627eea; }
        .chain-arbitrum { background: #28a0f0; }
        .chain-base { background: #0052ff; }
        .chain-optimism { background: #ff0420; }
        .apy-display {
            text-align: right;
        }
        .apy-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #00ff88;
        }
        .refresh-btn {
            background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .refresh-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 20px rgba(0,150,255,0.4);
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .opportunity-alert {
            background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Euler Cross-Chain Optimizer</h1>
            <p>Real-time monitoring and optimization across all Euler markets</p>
        </div>

        <div class="status-grid">
            <div class="stat-card">
                <div class="stat-label">Status</div>
                <div class="stat-value pulse" id="status">Loading...</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Markets Tracked</div>
                <div class="stat-value" id="marketCount">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Chains Active</div>
                <div class="stat-value" id="chainCount">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Best APY</div>
                <div class="stat-value" id="bestApy">0%</div>
            </div>
        </div>

        <div id="opportunities"></div>

        <div class="markets-section">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>📊 Live Market Data</h2>
                <button class="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
            </div>
            <div id="markets" class="market-grid">
                <div class="loading">Loading market data...</div>
            </div>
        </div>
    </div>

    <script>
        let autoRefresh;

        async function fetchData() {
            try {
                // Fetch status
                const statusRes = await fetch('/api/status');
                const status = await statusRes.json();
                
                document.getElementById('status').textContent = status.automation?.enabled ? '✅ Auto' : '🟢 Active';
                document.getElementById('chainCount').textContent = status.chains?.length || 0;

                // Fetch markets
                const marketsRes = await fetch('/api/markets');
                const markets = await marketsRes.json();
                
                document.getElementById('marketCount').textContent = markets.length;
                
                // Find best APY
                let bestApy = 0;
                markets.forEach(m => {
                    const apy = m.totalAPY || m.supplyAPY || 0;
                    if (apy > bestApy) bestApy = apy;
                });
                document.getElementById('bestApy').textContent = bestApy.toFixed(2) + '%';

                // Render markets
                renderMarkets(markets);

                // Check for opportunities (using test address)
                const oppRes = await fetch('/api/opportunities/0x742d35Cc6634C0532925a3b844Bc9e7595f2bD9e');
                const opportunities = await oppRes.json();
                renderOpportunities(opportunities);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        function renderMarkets(markets) {
            const container = document.getElementById('markets');
            if (markets.length === 0) {
                container.innerHTML = '<div class="loading">No market data available</div>';
                return;
            }

            // Sort by APY
            markets.sort((a, b) => (b.totalAPY || b.supplyAPY || 0) - (a.totalAPY || a.supplyAPY || 0));

            container.innerHTML = markets.map(market => {
                const apy = market.totalAPY || market.supplyAPY || 0;
                const rewards = market.rewards?.length > 0 ? ' (+ rewards)' : '';
                
                return \`
                    <div class="market-item">
                        <div>
                            <span class="chain-badge chain-\${market.chain}">\${market.chain}</span>
                            <strong>\${market.asset}</strong> - \${market.deployment}
                            \${rewards}
                        </div>
                        <div class="apy-display">
                            <div class="apy-value">\${apy.toFixed(2)}%</div>
                            <small>APY</small>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function renderOpportunities(opportunities) {
            const container = document.getElementById('opportunities');
            if (opportunities.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = opportunities.map(opp => \`
                <div class="opportunity-alert">
                    <span style="font-size: 2em;">💡</span>
                    <div>
                        <strong>Opportunity Found!</strong><br>
                        Move \${opp.currentPosition.asset} from \${opp.currentPosition.chain} to \${opp.targetMarket.chain}
                        for +\${opp.improvement.netBenefit.toFixed(2)}% APY improvement
                    </div>
                </div>
            \`).join('');
        }

        function refreshData() {
            fetchData();
        }

        // Initial load
        fetchData();

        // Auto refresh every 30 seconds
        autoRefresh = setInterval(fetchData, 30000);

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(autoRefresh);
        });
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`\n🌐 Euler Optimizer Dashboard running at: http://localhost:${this.port}\n`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = EulerDashboard;
