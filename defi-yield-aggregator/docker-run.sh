#!/bin/bash

echo "🐳 Docker Setup for Euler.finance Yield Bot"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    print_warning "IMPORTANT: Please configure your .env file before starting the container"
    echo "At minimum, you need to set:"
    echo "- ETH_RPC_URL (required for Euler data)"
    echo ""
    
    # Prompt user for essential configuration
    read -p "Enter your Ethereum RPC URL: " ETH_RPC_URL
    if [ ! -z "$ETH_RPC_URL" ]; then
        sed -i.bak "s|^ETH_RPC_URL=.*|ETH_RPC_URL=$ETH_RPC_URL|" .env
        print_status "Ethereum RPC URL configured"
    else
        print_error "ETH_RPC_URL is required. Please edit .env file manually."
        exit 1
    fi
fi

# Create necessary directories
print_header "Setting up directories..."
mkdir -p data logs config
print_status "Created data, logs, and config directories"

# Choose deployment method
print_header "Choose deployment method:"
echo "1. Docker Compose (recommended)"
echo "2. Docker run command"
echo "3. Build and run manually"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_header "Starting with Docker Compose..."
        
        # Build and start with Docker Compose
        if docker compose up -d --build; then
            print_status "✅ Container started successfully!"
            echo ""
            echo "🌐 Dashboard: http://localhost:3000"
            echo "📊 Health check: http://localhost:3000/health"
            echo "📋 View logs: docker compose logs -f"
            echo "🛑 Stop container: docker compose down"
            echo ""
        else
            print_error "Failed to start container with Docker Compose"
            exit 1
        fi
        ;;
        
    2)
        print_header "Building Docker image..."
        
        if docker build -t euler-yield-bot .; then
            print_status "Image built successfully"
        else
            print_error "Failed to build Docker image"
            exit 1
        fi
        
        print_header "Starting container with docker run..."
        
        # Run container with docker run
        docker run -d \
            --name euler-yield-bot \
            -p 3000:3000 \
            -v "$(pwd)/data:/app/data" \
            -v "$(pwd)/logs:/app/logs" \
            -v "$(pwd)/config:/app/config" \
            --env-file .env \
            --restart unless-stopped \
            euler-yield-bot
            
        if [ $? -eq 0 ]; then
            print_status "✅ Container started successfully!"
            echo ""
            echo "🌐 Dashboard: http://localhost:3000"
            echo "📊 Health check: http://localhost:3000/health"
            echo "📋 View logs: docker logs -f euler-yield-bot"
            echo "🛑 Stop container: docker stop euler-yield-bot"
            echo "🗑️  Remove container: docker rm euler-yield-bot"
            echo ""
        else
            print_error "Failed to start container"
            exit 1
        fi
        ;;
        
    3)
        print_header "Manual Docker build and run..."
        
        echo "1. Build the image:"
        echo "   docker build -t euler-yield-bot ."
        echo ""
        echo "2. Run the container:"
        echo "   docker run -d \\"
        echo "     --name euler-yield-bot \\"
        echo "     -p 3000:3000 \\"
        echo "     -v \$(pwd)/data:/app/data \\"
        echo "     -v \$(pwd)/logs:/app/logs \\"
        echo "     -v \$(pwd)/config:/app/config \\"
        echo "     --env-file .env \\"
        echo "     --restart unless-stopped \\"
        echo "     euler-yield-bot"
        echo ""
        echo "3. Or use Docker Compose:"
        echo "   docker compose up -d --build"
        echo ""
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

print_header "Docker Commands Cheat Sheet:"
echo ""
echo "📋 View logs:"
echo "   docker compose logs -f                    # Docker Compose"
echo "   docker logs -f euler-yield-bot            # Docker run"
echo ""
echo "🔄 Restart container:"
echo "   docker compose restart                    # Docker Compose" 
echo "   docker restart euler-yield-bot            # Docker run"
echo ""
echo "🛑 Stop container:"
echo "   docker compose down                       # Docker Compose"
echo "   docker stop euler-yield-bot               # Docker run"
echo ""
echo "🗑️  Remove container:"
echo "   docker compose down -v                    # Docker Compose (with volumes)"
echo "   docker rm euler-yield-bot                 # Docker run"
echo ""
echo "🔧 Enter container shell:"
echo "   docker compose exec euler-yield-bot sh    # Docker Compose"
echo "   docker exec -it euler-yield-bot sh        # Docker run"
echo ""
echo "📊 Monitor resource usage:"
echo "   docker stats euler-yield-bot"
echo ""
echo "🔍 Health check:"
echo "   curl http://localhost:3000/health"
echo ""

print_status "🎉 Setup complete! Your Euler.finance yield bot is running in Docker."
