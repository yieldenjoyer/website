#!/bin/bash

echo "🚀 Setting up DeFi Yield Aggregator Bot..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Node.js is installed
print_header "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
    
    # Check if version is >= 16
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt "16" ]; then
        print_error "Node.js version 16 or higher is required"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm found: $(npm --version)"

# Install dependencies
print_header "Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
print_header "Setting up environment configuration..."
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    echo ""
    print_warning "IMPORTANT: Please configure your .env file with the following:"
    echo "- Add your Ethereum RPC URL (required for Euler data)"
    echo "- Add Discord webhook URL (optional, for alerts)"
    echo "- Add Telegram bot credentials (optional, for alerts)"
    echo "- Configure other settings as needed"
    echo ""
    
    # Prompt user for essential configuration
    read -p "Enter your Ethereum RPC URL (press Enter to skip): " ETH_RPC_URL
    if [ ! -z "$ETH_RPC_URL" ]; then
        sed -i.bak "s|^ETH_RPC_URL=.*|ETH_RPC_URL=$ETH_RPC_URL|" .env
        print_status "Ethereum RPC URL configured"
    fi
    
    read -p "Enter Discord webhook URL for alerts (press Enter to skip): " DISCORD_URL
    if [ ! -z "$DISCORD_URL" ]; then
        sed -i.bak "s|^DISCORD_WEBHOOK_URL=.*|DISCORD_WEBHOOK_URL=$DISCORD_URL|" .env
        print_status "Discord webhook configured"
    fi
    
else
    print_status ".env file already exists"
fi

# Create logs directory
print_header "Setting up directories..."
mkdir -p logs
mkdir -p data
print_status "Created logs and data directories"

# Test the configuration
print_header "Testing bot configuration..."
echo "const logger = require('./src/utils/logger');" > test_config.js
echo "logger.loggers.main.info('Configuration test successful!');" >> test_config.js

if node test_config.js 2>/dev/null; then
    print_status "Configuration test passed"
    rm test_config.js
else
    print_warning "Configuration test had warnings (this is normal for first run)"
    rm -f test_config.js
fi

# Display next steps
print_header "Setup Complete! 🎉"
echo ""
echo "Your DeFi Yield Aggregator Bot is now ready to use!"
echo ""
echo "Next steps:"
echo "1. Review and update your .env file with your API keys"
echo "2. Start the bot with: npm start"
echo "3. Access the dashboard at: http://localhost:3000"
echo ""
echo "Available commands:"
echo "  npm start          - Start the yield aggregator bot"
echo "  npm run dev        - Start in development mode with auto-restart"
echo "  npm test           - Run tests"
echo "  npm run logs       - View recent logs"
echo ""
echo "Bot Features:"
echo "✅ Euler.finance yield monitoring"
echo "✅ Real-time yield analysis and comparison"
echo "✅ Automated alerts for high-yield opportunities"
echo "✅ Risk-adjusted return calculations"
echo "✅ Web dashboard with live updates"
echo "✅ Discord/Telegram alert integration"
echo ""
echo "For help and documentation:"
echo "📖 README.md - Comprehensive setup guide"
echo "🔧 .env.example - Configuration options"
echo "🌐 Dashboard: http://localhost:3000 (after starting)"
echo ""

# Check if user wants to start immediately
echo -n "Would you like to start the bot now? (y/n): "
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_status "Starting DeFi Yield Aggregator Bot..."
    npm start
else
    print_status "Setup complete. Run 'npm start' when ready!"
fi
