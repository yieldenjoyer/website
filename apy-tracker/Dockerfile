# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for some npm packages
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files first for better layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/public && \
    chown -R nodejs:nodejs /app

# Copy application files
COPY src/ ./src/
COPY public/ ./public/

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const http = require('http'); \
                 const options = { hostname: 'localhost', port: 3000, path: '/api/health', timeout: 5000 }; \
                 const req = http.request(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); \
                 req.on('error', () => process.exit(1)); \
                 req.on('timeout', () => process.exit(1)); \
                 req.end();"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Start the application
CMD ["npm", "start"]
