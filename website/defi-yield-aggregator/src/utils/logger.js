const winston = require('winston');
const path = require('path');

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../../data/logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'defi-yield-aggregator' },
    transports: [
        // File transport for all logs
        new winston.transports.File({ 
            filename: path.join(logsDir, 'app.log'),
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Separate file for errors
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 3
        }),
        
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let log = `${timestamp} ${level}: ${message}`;
                    
                    if (Object.keys(meta).length > 0 && process.env.NODE_ENV === 'development') {
                        log += ` ${JSON.stringify(meta, null, 2)}`;
                    }
                    
                    return log;
                })
            )
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
    ],
    
    // Handle unhandled rejections
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
    ]
});

// Create child loggers for different components
const createChildLogger = (component) => {
    return logger.child({ component });
};

// Utility methods
const loggers = {
    scraper: createChildLogger('scraper'),
    analyzer: createChildLogger('analyzer'),
    strategy: createChildLogger('strategy'),
    database: createChildLogger('database'),
    api: createChildLogger('api'),
    alert: createChildLogger('alert')
};

module.exports = {
    ...logger,
    loggers,
    createChildLogger
};
