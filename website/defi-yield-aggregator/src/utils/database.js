const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger').loggers.database;

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../data/yields.db');
        this.isConnected = false;
    }
    
    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Connect to database
            this.db = new sqlite3.Database(this.dbPath);
            this.isConnected = true;
            
            // Create tables
            await this.createTables();
            
            logger.info(`Database initialized at ${this.dbPath}`);
            
        } catch (error) {
            logger.error('Failed to initialize database:', error);
            throw error;
        }
    }
    
    async createTables() {
        const createTableQueries = [
            // Yields table
            `CREATE TABLE IF NOT EXISTS yields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                protocol TEXT NOT NULL,
                chain TEXT NOT NULL,
                asset TEXT NOT NULL,
                type TEXT NOT NULL,
                apy REAL NOT NULL,
                borrow_apy REAL,
                total_apy REAL,
                base_apy REAL,
                reward_apy REAL,
                tvl REAL,
                utilization REAL,
                timestamp INTEGER NOT NULL,
                metadata TEXT,
                UNIQUE(protocol, chain, asset, timestamp)
            )`,
            
            // Strategies table
            `CREATE TABLE IF NOT EXISTS strategies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                action TEXT NOT NULL,
                protocol TEXT,
                asset TEXT,
                chain TEXT,
                expected_apy REAL,
                expected_improvement REAL,
                confidence REAL,
                risk_level TEXT,
                score REAL,
                steps TEXT,
                metadata TEXT,
                created_at INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1
            )`,
            
            // Alerts table
            `CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                protocol TEXT,
                asset TEXT,
                chain TEXT,
                threshold_value REAL,
                current_value REAL,
                severity TEXT,
                is_sent BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL
            )`,
            
            // User positions table (for tracking)
            `CREATE TABLE IF NOT EXISTS user_positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_address TEXT NOT NULL,
                protocol TEXT NOT NULL,
                chain TEXT NOT NULL,
                asset TEXT NOT NULL,
                amount REAL NOT NULL,
                entry_apy REAL,
                last_updated INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1
            )`,
            
            // Price history table
            `CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset TEXT NOT NULL,
                price_usd REAL NOT NULL,
                timestamp INTEGER NOT NULL,
                source TEXT,
                UNIQUE(asset, timestamp)
            )`
        ];
        
        for (const query of createTableQueries) {
            await this.run(query);
        }
        
        // Create indexes
        const indexQueries = [
            'CREATE INDEX IF NOT EXISTS idx_yields_protocol_asset ON yields(protocol, asset)',
            'CREATE INDEX IF NOT EXISTS idx_yields_timestamp ON yields(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_yields_apy ON yields(total_apy)',
            'CREATE INDEX IF NOT EXISTS idx_strategies_score ON strategies(score)',
            'CREATE INDEX IF NOT EXISTS idx_strategies_created ON strategies(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_positions_user ON user_positions(user_address)',
            'CREATE INDEX IF NOT EXISTS idx_prices_asset ON price_history(asset, timestamp)'
        ];
        
        for (const query of indexQueries) {
            await this.run(query);
        }
    }
    
    async storeYieldData(yieldsData) {
        if (!Array.isArray(yieldsData) || yieldsData.length === 0) {
            return;
        }
        
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO yields (
                protocol, chain, asset, type, apy, borrow_apy, 
                total_apy, base_apy, reward_apy, tvl, utilization, 
                timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            for (const yieldData of yieldsData) {
                await this.runStatement(stmt, [
                    yieldData.protocol,
                    yieldData.chain,
                    yieldData.asset,
                    yieldData.type,
                    yieldData.apy,
                    yieldData.borrowApy || null,
                    yieldData.totalApy || yieldData.apy,
                    yieldData.baseApy || yieldData.apy,
                    yieldData.rewardApy || 0,
                    yieldData.tvl || 0,
                    yieldData.utilization || null,
                    yieldData.timestamp || Date.now(),
                    JSON.stringify(yieldData.metadata || {})
                ]);
            }
            
            stmt.finalize();
            logger.info(`Stored ${yieldsData.length} yield records`);
            
        } catch (error) {
            stmt.finalize();
            logger.error('Error storing yield data:', error);
            throw error;
        }
    }
    
    async getLatestYields(limit = 100) {
        const query = `
            SELECT * FROM yields 
            WHERE timestamp > ? 
            ORDER BY total_apy DESC 
            LIMIT ?
        `;
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const rows = await this.all(query, [oneHourAgo, limit]);
        
        return rows.map(this.parseYieldRow);
    }
    
    async getYieldsByProtocol(protocol, limit = 50) {
        const query = `
            SELECT * FROM yields 
            WHERE protocol = ? AND timestamp > ?
            ORDER BY total_apy DESC 
            LIMIT ?
        `;
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const rows = await this.all(query, [protocol, oneHourAgo, limit]);
        
        return rows.map(this.parseYieldRow);
    }
    
    async getBestYieldsForAsset(asset, limit = 10) {
        const query = `
            SELECT * FROM yields 
            WHERE asset = ? AND timestamp > ?
            ORDER BY total_apy DESC 
            LIMIT ?
        `;
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const rows = await this.all(query, [asset, oneHourAgo, limit]);
        
        return rows.map(this.parseYieldRow);
    }
    
    async getYieldHistory(protocol, asset, chain, hours = 24) {
        const query = `
            SELECT * FROM yields 
            WHERE protocol = ? AND asset = ? AND chain = ? 
            AND timestamp > ?
            ORDER BY timestamp ASC
        `;
        
        const startTime = Date.now() - (hours * 60 * 60 * 1000);
        const rows = await this.all(query, [protocol, asset, chain, startTime]);
        
        return rows.map(this.parseYieldRow);
    }
    
    async storeStrategies(strategies) {
        if (!Array.isArray(strategies) || strategies.length === 0) {
            return;
        }
        
        const stmt = this.db.prepare(`
            INSERT INTO strategies (
                type, action, protocol, asset, chain, expected_apy,
                expected_improvement, confidence, risk_level, score,
                steps, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            for (const strategy of strategies) {
                await this.runStatement(stmt, [
                    strategy.type,
                    strategy.action,
                    strategy.protocol || null,
                    strategy.asset || null,
                    strategy.chain || null,
                    strategy.expectedApy || null,
                    strategy.expectedImprovement || null,
                    strategy.confidence || null,
                    strategy.riskLevel || null,
                    strategy.score || null,
                    JSON.stringify(strategy.steps || []),
                    JSON.stringify(strategy),
                    Date.now()
                ]);
            }
            
            stmt.finalize();
            logger.info(`Stored ${strategies.length} strategies`);
            
        } catch (error) {
            stmt.finalize();
            logger.error('Error storing strategies:', error);
            throw error;
        }
    }
    
    async getTopStrategies(limit = 10) {
        const query = `
            SELECT * FROM strategies 
            WHERE is_active = 1 
            ORDER BY score DESC, created_at DESC 
            LIMIT ?
        `;
        
        const rows = await this.all(query, [limit]);
        return rows.map(this.parseStrategyRow);
    }
    
    async storeAlert(alertData) {
        const stmt = this.db.prepare(`
            INSERT INTO alerts (
                type, title, message, protocol, asset, chain,
                threshold_value, current_value, severity, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            await this.runStatement(stmt, [
                alertData.type,
                alertData.title,
                alertData.message,
                alertData.protocol || null,
                alertData.asset || null,
                alertData.chain || null,
                alertData.thresholdValue || null,
                alertData.currentValue || null,
                alertData.severity || 'info',
                Date.now()
            ]);
            
            stmt.finalize();
            
        } catch (error) {
            stmt.finalize();
            logger.error('Error storing alert:', error);
            throw error;
        }
    }
    
    async getPendingAlerts() {
        const query = `
            SELECT * FROM alerts 
            WHERE is_sent = 0 
            ORDER BY created_at DESC
        `;
        
        return await this.all(query);
    }
    
    async markAlertSent(alertId) {
        const query = 'UPDATE alerts SET is_sent = 1 WHERE id = ?';
        await this.run(query, [alertId]);
    }
    
    async cleanupOldData(olderThan) {
        const timestamp = olderThan.getTime();
        
        const queries = [
            ['DELETE FROM yields WHERE timestamp < ?', timestamp],
            ['DELETE FROM strategies WHERE created_at < ? AND is_active = 0', timestamp],
            ['DELETE FROM alerts WHERE created_at < ? AND is_sent = 1', timestamp],
            ['DELETE FROM price_history WHERE timestamp < ?', timestamp]
        ];
        
        let totalDeleted = 0;
        
        for (const [query, param] of queries) {
            const result = await this.run(query, [param]);
            totalDeleted += result.changes || 0;
        }
        
        return totalDeleted;
    }
    
    async getAnalyticsSummary() {
        const queries = [
            'SELECT COUNT(*) as total_yields FROM yields WHERE timestamp > ?',
            'SELECT COUNT(*) as total_strategies FROM strategies WHERE is_active = 1',
            'SELECT COUNT(*) as pending_alerts FROM alerts WHERE is_sent = 0',
            'SELECT AVG(total_apy) as avg_apy FROM yields WHERE timestamp > ?',
            'SELECT MAX(total_apy) as max_apy FROM yields WHERE timestamp > ?',
            'SELECT COUNT(DISTINCT protocol) as active_protocols FROM yields WHERE timestamp > ?'
        ];
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const results = {};
        
        results.totalYields = (await this.get(queries[0], [oneHourAgo])).total_yields;
        results.totalStrategies = (await this.get(queries[1])).total_strategies;
        results.pendingAlerts = (await this.get(queries[2])).pending_alerts;
        results.avgApy = (await this.get(queries[3], [oneHourAgo])).avg_apy;
        results.maxApy = (await this.get(queries[4], [oneHourAgo])).max_apy;
        results.activeProtocols = (await this.get(queries[5], [oneHourAgo])).active_protocols;
        
        return results;
    }
    
    // Helper methods
    parseYieldRow(row) {
        return {
            id: row.id,
            protocol: row.protocol,
            chain: row.chain,
            asset: row.asset,
            type: row.type,
            apy: row.apy,
            borrowApy: row.borrow_apy,
            totalApy: row.total_apy,
            baseApy: row.base_apy,
            rewardApy: row.reward_apy,
            tvl: row.tvl,
            utilization: row.utilization,
            timestamp: row.timestamp,
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
        };
    }
    
    parseStrategyRow(row) {
        return {
            id: row.id,
            type: row.type,
            action: row.action,
            protocol: row.protocol,
            asset: row.asset,
            chain: row.chain,
            expectedApy: row.expected_apy,
            expectedImprovement: row.expected_improvement,
            confidence: row.confidence,
            riskLevel: row.risk_level,
            score: row.score,
            steps: row.steps ? JSON.parse(row.steps) : [],
            metadata: row.metadata ? JSON.parse(row.metadata) : {},
            createdAt: row.created_at,
            isActive: row.is_active
        };
    }
    
    // Promisified database methods
    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }
    
    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    runStatement(statement, params) {
        return new Promise((resolve, reject) => {
            statement.run(params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }
    
    async close() {
        if (this.db && this.isConnected) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        logger.error('Error closing database:', err);
                    } else {
                        logger.info('Database connection closed');
                    }
                    this.isConnected = false;
                    resolve();
                });
            });
        }
    }
}

module.exports = Database;
