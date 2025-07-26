# Euler Cross-Chain Optimizer - Docker Test Guide

## Quick Start

This guide will help you test the Euler Cross-Chain Optimizer using Docker.

## Prerequisites

1. Docker and Docker Compose installed
2. Basic terminal/command line knowledge

## Testing Steps

### 1. Navigate to the directory
```bash
cd defi-yield-aggregator
```

### 2. Run the test using one of these methods:

#### Option A: Direct Docker Test (Recommended)
```bash
# Make the script executable (if not already done)
chmod +x docker-euler-run.sh

# Start the optimizer in test mode
./docker-euler-run.sh up
```

#### Option B: Using npm scripts
```bash
# Build the Docker image
npm run euler:docker:build

# Start the optimizer
npm run euler:docker
```

### 3. Monitor the optimizer

Once running, you can:

- **View logs**: `./docker-euler-run.sh logs`
- **Check status**: `./docker-euler-run.sh status`
- **View opportunities**: `./docker-euler-run.sh opportunities`
- **Access dashboard**: http://localhost:3001
- **Check health**: http://localhost:3001/health

### 4. Test Features

The test environment will:

1. **Mock Euler Markets**: Simulate Euler deployments on Ethereum, Arbitrum, Base, and Optimism
2. **Generate Test Data**: Create sample market conditions with varying APYs
3. **Find Opportunities**: Identify yield optimization opportunities
4. **Simulate Execution**: Show what rebalances would occur (dry-run mode)

### 5. Advanced Testing

#### Run with all services (PostgreSQL, Redis, Grafana):
```bash
./docker-euler-run.sh up-all
```

This provides:
- **PostgreSQL**: Database for persistent storage (port 5433)
- **Redis**: Caching layer (port 6380)
- **Grafana**: Monitoring dashboard (port 3002, admin/admin)

#### Access the container shell:
```bash
./docker-euler-run.sh shell
```

### 6. Stop the optimizer
```bash
./docker-euler-run.sh down
```

### 7. Clean up everything
```bash
./docker-euler-run.sh clean
```

## What You'll See

When running the test, you'll see:

1. **Initialization**:
   ```
   🚀 Starting Euler Cross-Chain Optimizer Test...
   ✅ Optimizer initialized successfully
   ```

2. **Market Data**:
   ```
   📈 Market Data Summary:
   ethereum-prime:
     - USDC: 5.2% base + 1.60% rewards
   arbitrum-prime:
     - USDC: 7.5% base + 1.70% rewards
   base-yield:
     - USDC: 8.0% base + 3.50% rewards
   ```

3. **Opportunities**:
   ```
   💡 Found 2 opportunities:
   
   Opportunity 1:
     From: ethereum/prime
     To: base/yield
     Current APY: 6.80%
     Target APY: 11.50%
     Net Improvement: 4.45%
     Break-even: 2.5 days
   ```

4. **Health Check API**:
   ```json
   {
     "status": "healthy",
     "optimizer": "running",
     "chains": ["ethereum", "arbitrum", "base", "optimism"],
     "cache": 4,
     "users": 1
   }
   ```

## Configuration

The test uses these default settings:

- **Min Yield Improvement**: 2%
- **Max Gas Cost**: 1% of position value
- **Rebalance Interval**: 5 minutes
- **Max LTV**: 80%
- **Mode**: Dry-run (no real transactions)

You can modify these in the `.env` file.

## Troubleshooting

### Docker not running
```bash
# Start Docker daemon
# On Mac: Open Docker Desktop
# On Linux: sudo systemctl start docker
```

### Port conflicts
```bash
# Change ports in docker-compose.euler.yml
# Default ports: 3001 (API), 3002 (Grafana), 5433 (PostgreSQL), 6380 (Redis)
```

### Permission issues
```bash
# Fix permissions
chmod +x docker-euler-run.sh
sudo chown -R $USER:$USER data logs
```

### Container fails to start
```bash
# Check logs
docker-compose -f docker-compose.euler.yml logs euler-optimizer

# Rebuild image
./docker-euler-run.sh build
```

## Next Steps

After testing, you can:

1. **Customize Settings**: Edit `.env` to change thresholds and parameters
2. **Add Real Addresses**: Update contract addresses in `EulerCrossChainOptimizer.js`
3. **Enable Real Execution**: Set `DRY_RUN=false` and `USE_MOCK_EXECUTOR=false`
4. **Deploy to Production**: Use proper RPC endpoints and security measures

## Important Notes

- This test environment uses mock data and doesn't execute real transactions
- Public RPC endpoints are used by default - replace with your own for production
- The optimizer simulates finding and executing yield optimization opportunities
- All bridge operations and transactions are mocked in test mode

Happy testing! 🚀
