#!/bin/bash

# Euler Cross-Chain Optimizer Docker Runner
# This script sets up and runs the Euler optimizer in Docker

echo "🚀 Euler Cross-Chain Optimizer - Docker Test Runner"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p data logs scripts/db test/mocks

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file with default values...${NC}"
    cat > .env << EOL
# Euler Optimizer Environment Variables

# Chain RPC URLs (using public endpoints for testing)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
ARBITRUM_RPC_URL=https://arbitrum.llamarpc.com
BASE_RPC_URL=https://base.llamarpc.com
OPTIMISM_RPC_URL=https://optimism.llamarpc.com

# Euler Optimizer Settings
MIN_YIELD_IMPROVEMENT=0.02
MAX_GAS_COST_PERCENT=0.01
REBALANCE_INTERVAL=300000
MAX_LTV_UTILIZATION=0.8

# Test Mode
DRY_RUN=true
USE_MOCK_EXECUTOR=true

# Optional: Add your webhook URL for alerts
ALERT_WEBHOOK_URL=

# Optional: Add email for alerts
ALERT_EMAIL=
EOL
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Function to check container health
check_health() {
    local container=$1
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}🔍 Checking health of $container...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.euler.yml ps | grep -q "$container.*healthy"; then
            echo -e "${GREEN}✅ $container is healthy${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}❌ $container failed health check${NC}"
    return 1
}

# Parse command line arguments
COMMAND=${1:-up}
PROFILE=""

case $COMMAND in
    "up"|"start")
        echo -e "${GREEN}🚀 Starting Euler Optimizer...${NC}"
        docker-compose -f docker-compose.euler.yml up -d
        
        # Wait for containers to be healthy
        sleep 5
        check_health "euler-optimizer"
        
        echo -e "${GREEN}✅ Euler Optimizer is running!${NC}"
        echo -e "${YELLOW}📊 Dashboard: http://localhost:3001${NC}"
        echo -e "${YELLOW}📋 View logs: docker-compose -f docker-compose.euler.yml logs -f euler-optimizer${NC}"
        ;;
        
    "up-all")
        echo -e "${GREEN}🚀 Starting Euler Optimizer with all services...${NC}"
        docker-compose -f docker-compose.euler.yml --profile with-postgres --profile with-cache --profile monitoring up -d
        
        # Wait for containers
        sleep 10
        
        echo -e "${GREEN}✅ All services are running!${NC}"
        echo -e "${YELLOW}📊 Dashboard: http://localhost:3001${NC}"
        echo -e "${YELLOW}📈 Grafana: http://localhost:3002 (admin/admin)${NC}"
        echo -e "${YELLOW}🗄️  PostgreSQL: localhost:5433${NC}"
        echo -e "${YELLOW}💾 Redis: localhost:6380${NC}"
        ;;
        
    "down"|"stop")
        echo -e "${YELLOW}🛑 Stopping Euler Optimizer...${NC}"
        docker-compose -f docker-compose.euler.yml down
        echo -e "${GREEN}✅ Euler Optimizer stopped${NC}"
        ;;
        
    "logs")
        echo -e "${YELLOW}📋 Showing logs...${NC}"
        docker-compose -f docker-compose.euler.yml logs -f euler-optimizer
        ;;
        
    "build")
        echo -e "${YELLOW}🔨 Building Docker image...${NC}"
        docker-compose -f docker-compose.euler.yml build
        echo -e "${GREEN}✅ Build complete${NC}"
        ;;
        
    "clean")
        echo -e "${YELLOW}🧹 Cleaning up...${NC}"
        docker-compose -f docker-compose.euler.yml down -v
        rm -rf data/* logs/*
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
        
    "test")
        echo -e "${GREEN}🧪 Running test mode...${NC}"
        docker-compose -f docker-compose.euler.yml run --rm euler-optimizer npm run euler:test
        ;;
        
    "shell")
        echo -e "${YELLOW}🐚 Opening shell in container...${NC}"
        docker-compose -f docker-compose.euler.yml exec euler-optimizer /bin/sh
        ;;
        
    "status")
        echo -e "${YELLOW}📊 Checking status...${NC}"
        docker-compose -f docker-compose.euler.yml ps
        
        # Check API health
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API is responding${NC}"
            curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
        else
            echo -e "${RED}❌ API is not responding${NC}"
        fi
        ;;
        
    "opportunities")
        echo -e "${YELLOW}🔍 Checking opportunities...${NC}"
        if curl -s http://localhost:3001/opportunities > /dev/null 2>&1; then
            curl -s http://localhost:3001/opportunities | jq . 2>/dev/null || curl -s http://localhost:3001/opportunities
        else
            echo -e "${RED}❌ Cannot fetch opportunities. Is the optimizer running?${NC}"
        fi
        ;;
        
    *)
        echo "Usage: $0 {up|up-all|down|logs|build|clean|test|shell|status|opportunities}"
        echo ""
        echo "Commands:"
        echo "  up          - Start Euler optimizer (basic mode)"
        echo "  up-all      - Start with PostgreSQL, Redis, and Grafana"
        echo "  down        - Stop all containers"
        echo "  logs        - Show logs"
        echo "  build       - Build Docker image"
        echo "  clean       - Stop and remove all data"
        echo "  test        - Run in test mode"
        echo "  shell       - Open shell in container"
        echo "  status      - Check status and health"
        echo "  opportunities - Check current opportunities"
        exit 1
        ;;
esac
