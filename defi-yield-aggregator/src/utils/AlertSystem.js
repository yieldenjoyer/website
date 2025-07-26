const logger = require('./logger').loggers.alert;

class AlertSystem {
    constructor() {
        this.alertThresholds = {
            highYieldThreshold: 15, // Alert if APY > 15%
            yieldDropThreshold: 5,  // Alert if APY drops > 5%
            newOpportunityThreshold: 8, // Alert for new opportunities > 8%
            utilizationThreshold: 90, // Alert if utilization > 90%
            tvlDropThreshold: 0.3 // Alert if TVL drops > 30%
        };
        
        this.alertChannels = [];
        this.sentAlerts = new Set();
    }
    
    async initialize() {
        logger.info('Alert System initialized');
        
        // Configure alert channels based on environment
        if (process.env.DISCORD_WEBHOOK_URL) {
            this.alertChannels.push({
                type: 'discord',
                url: process.env.DISCORD_WEBHOOK_URL
            });
        }
        
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            this.alertChannels.push({
                type: 'telegram',
                token: process.env.TELEGRAM_BOT_TOKEN,
                chatId: process.env.TELEGRAM_CHAT_ID
            });
        }
        
        if (process.env.SMTP_HOST) {
            this.alertChannels.push({
                type: 'email',
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
                to: process.env.ALERT_EMAIL
            });
        }
        
        logger.info(`Configured ${this.alertChannels.length} alert channels`);
    }
    
    async checkAlerts(strategies) {
        const alerts = [];
        
        try {
            // High APY alerts
            for (const strategy of strategies) {
                if (strategy.expectedApy && strategy.expectedApy > this.alertThresholds.highYieldThreshold) {
                    const alertId = `high_apy_${strategy.protocol}_${strategy.asset}`;
                    
                    if (!this.sentAlerts.has(alertId)) {
                        alerts.push({
                            id: alertId,
                            type: 'high_yield',
                            title: '🚀 High Yield Alert',
                            message: `Exceptional yield found: ${strategy.expectedApy.toFixed(2)}% APY on ${strategy.protocol} for ${strategy.asset}`,
                            protocol: strategy.protocol,
                            asset: strategy.asset,
                            apy: strategy.expectedApy,
                            severity: 'high',
                            action: strategy.action,
                            confidence: strategy.confidence
                        });
                        
                        this.sentAlerts.add(alertId);
                        
                        // Remove from sent alerts after 1 hour to allow re-alerting
                        setTimeout(() => {
                            this.sentAlerts.delete(alertId);
                        }, 60 * 60 * 1000);
                    }
                }
                
                // New opportunity alerts
                if (strategy.type === 'optimization' && strategy.expectedImprovement > this.alertThresholds.newOpportunityThreshold) {
                    const alertId = `new_opp_${strategy.protocol}_${strategy.asset}`;
                    
                    if (!this.sentAlerts.has(alertId)) {
                        alerts.push({
                            id: alertId,
                            type: 'new_opportunity',
                            title: '💡 New Opportunity Alert',
                            message: `New ${strategy.expectedImprovement.toFixed(2)}% improvement opportunity found on ${strategy.protocol} for ${strategy.asset}`,
                            protocol: strategy.protocol,
                            asset: strategy.asset,
                            improvement: strategy.expectedImprovement,
                            severity: 'medium',
                            reasoning: strategy.reasoning || 'Good opportunity detected'
                        });
                        
                        this.sentAlerts.add(alertId);
                        setTimeout(() => {
                            this.sentAlerts.delete(alertId);
                        }, 2 * 60 * 60 * 1000); // 2 hours
                    }
                }
                
                // Euler-specific alerts
                if (strategy.protocol === 'euler' && strategy.expectedApy > 5) {
                    const alertId = `euler_${strategy.asset}`;
                    
                    if (!this.sentAlerts.has(alertId)) {
                        alerts.push({
                            id: alertId,
                            type: 'euler_opportunity',
                            title: '⚡ Euler Finance Alert',
                            message: `Euler opportunity: ${strategy.expectedApy.toFixed(2)}% APY for ${strategy.asset}`,
                            protocol: 'euler',
                            asset: strategy.asset,
                            apy: strategy.expectedApy,
                            severity: 'medium',
                            utilization: strategy.utilization,
                            tvl: strategy.tvl
                        });
                        
                        this.sentAlerts.add(alertId);
                        setTimeout(() => {
                            this.sentAlerts.delete(alertId);
                        }, 30 * 60 * 1000); // 30 minutes
                    }
                }
            }
            
            return alerts;
            
        } catch (error) {
            logger.error('Error checking alerts:', error);
            return [];
        }
    }
    
    async sendAlerts(alerts) {
        for (const alert of alerts) {
            try {
                await this.processAlert(alert);
            } catch (error) {
                logger.error(`Failed to send alert ${alert.id}:`, error);
            }
        }
    }
    
    async processAlert(alert) {
        logger.info(`Processing alert: ${alert.title}`);
        
        for (const channel of this.alertChannels) {
            try {
                await this.sendToChannel(alert, channel);
            } catch (error) {
                logger.error(`Failed to send alert to ${channel.type}:`, error);
            }
        }
    }
    
    async sendToChannel(alert, channel) {
        switch (channel.type) {
            case 'discord':
                await this.sendDiscordAlert(alert, channel);
                break;
            case 'telegram':
                await this.sendTelegramAlert(alert, channel);
                break;
            case 'email':
                await this.sendEmailAlert(alert, channel);
                break;
            case 'console':
                this.sendConsoleAlert(alert);
                break;
        }
    }
    
    async sendDiscordAlert(alert, channel) {
        const axios = require('axios');
        
        const embed = {
            title: alert.title,
            description: alert.message,
            color: this.getSeverityColor(alert.severity),
            timestamp: new Date().toISOString(),
            fields: []
        };
        
        if (alert.protocol) embed.fields.push({ name: 'Protocol', value: alert.protocol, inline: true });
        if (alert.asset) embed.fields.push({ name: 'Asset', value: alert.asset, inline: true });
        if (alert.apy) embed.fields.push({ name: 'APY', value: `${alert.apy.toFixed(2)}%`, inline: true });
        if (alert.confidence) embed.fields.push({ name: 'Confidence', value: `${(alert.confidence * 100).toFixed(0)}%`, inline: true });
        
        const payload = {
            embeds: [embed],
            username: 'DeFi Yield Bot'
        };
        
        await axios.post(channel.url, payload);
        logger.info('Discord alert sent');
    }
    
    async sendTelegramAlert(alert, channel) {
        const axios = require('axios');
        
        let message = `${alert.title}\n\n${alert.message}`;
        
        if (alert.protocol) message += `\n🔗 Protocol: ${alert.protocol}`;
        if (alert.asset) message += `\n💰 Asset: ${alert.asset}`;
        if (alert.apy) message += `\n📈 APY: ${alert.apy.toFixed(2)}%`;
        
        const url = `https://api.telegram.org/bot${channel.token}/sendMessage`;
        
        await axios.post(url, {
            chat_id: channel.chatId,
            text: message,
            parse_mode: 'HTML'
        });
        
        logger.info('Telegram alert sent');
    }
    
    async sendEmailAlert(alert, channel) {
        // Email implementation would go here
        // For now, just log
        logger.info('Email alert would be sent:', alert.title);
    }
    
    sendConsoleAlert(alert) {
        const severity = alert.severity?.toUpperCase() || 'INFO';
        logger.info(`[ALERT ${severity}] ${alert.title}: ${alert.message}`);
    }
    
    getSeverityColor(severity) {
        const colors = {
            'low': 0x00ff00,    // Green
            'medium': 0xffaa00,  // Orange
            'high': 0xff0000,    // Red
            'critical': 0x800080 // Purple
        };
        
        return colors[severity] || colors.medium;
    }
    
    // Method to manually trigger alerts for testing
    async triggerTestAlert() {
        const testAlert = {
            id: 'test_alert',
            type: 'test',
            title: '🧪 Test Alert',
            message: 'This is a test alert from the DeFi Yield Aggregator bot',
            severity: 'low',
            protocol: 'test',
            asset: 'TEST',
            apy: 25.5
        };
        
        await this.processAlert(testAlert);
        logger.info('Test alert triggered');
    }
    
    // Add custom alert thresholds
    setThresholds(newThresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
        logger.info('Alert thresholds updated:', this.alertThresholds);
    }
    
    // Get alert statistics
    getStats() {
        return {
            activeChannels: this.alertChannels.length,
            thresholds: this.alertThresholds,
            sentAlertsCount: this.sentAlerts.size
        };
    }
}

module.exports = AlertSystem;
