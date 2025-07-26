const fs = require('fs');
const path = require('path');
const logger = require('./logger').loggers.registry;

class ProtocolRegistry {
    constructor() {
        this.protocols = new Map();
        this.configPath = path.join(__dirname, '../../config/protocols.json');
        this.initialized = false;
    }
    
    async loadProtocols() {
        try {
            logger.info('Loading protocol configurations...');
            
            if (!fs.existsSync(this.configPath)) {
                logger.warn(`Protocol config file not found at ${this.configPath}, using defaults`);
                this.loadDefaultProtocols();
                return;
            }
            
            const configData = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            
            if (config.protocols) {
                for (const [name, protocolConfig] of Object.entries(config.protocols)) {
                    this.protocols.set(name, {
                        name,
                        ...protocolConfig,
                        enabled: protocolConfig.enabled !== false
                    });
                }
            }
            
            this.initialized = true;
            logger.info(`Loaded ${this.protocols.size} protocol configurations`);
            
        } catch (error) {
            logger.error('Failed to load protocol configurations:', error);
            this.loadDefaultProtocols();
        }
    }
    
    loadDefaultProtocols() {
        logger.info('Loading default protocol configurations...');
        
        // Default Euler protocol configuration
        this.protocols.set('euler', {
            name: 'euler',
            displayName: 'Euler Finance',
            enabled: true,
            chains: ['ethereum'],
            contracts: {
                ethereum: {
                    euler: '0x27182842E098f60e3D576794A5bFFb0777E025d3',
                    markets: '0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3',
                    exec: '0x59828FdF7ee634AaaD3f58B19fDBa3b03E2a9d80'
                }
            },
            supportedAssets: [
                'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 
                'USDe', 'sUSDe', 'weETH', 'ezETH', 'FRAX'
            ],
            type: 'lending',
            riskScore: 0.3,
            gasEfficiency: 0.7,
            features: ['lending', 'borrowing', 'leverage'],
            description: 'Permissionless lending protocol with risk-isolated pools'
        });
        
        this.initialized = true;
        logger.info(`Loaded ${this.protocols.size} default protocol configurations`);
    }
    
    getProtocol(name) {
        return this.protocols.get(name);
    }
    
    getEnabledProtocols() {
        return Array.from(this.protocols.values()).filter(p => p.enabled);
    }
    
    getAllProtocols() {
        return Array.from(this.protocols.values());
    }
    
    getProtocolsByChain(chain) {
        return Array.from(this.protocols.values()).filter(p => 
            p.enabled && p.chains && p.chains.includes(chain)
        );
    }
    
    getProtocolsByAsset(asset) {
        return Array.from(this.protocols.values()).filter(p => 
            p.enabled && p.supportedAssets && p.supportedAssets.includes(asset)
        );
    }
    
    getProtocolsByType(type) {
        return Array.from(this.protocols.values()).filter(p => 
            p.enabled && p.type === type
        );
    }
    
    isProtocolEnabled(name) {
        const protocol = this.protocols.get(name);
        return protocol && protocol.enabled;
    }
    
    enableProtocol(name) {
        const protocol = this.protocols.get(name);
        if (protocol) {
            protocol.enabled = true;
            logger.info(`Enabled protocol: ${name}`);
            return true;
        }
        return false;
    }
    
    disableProtocol(name) {
        const protocol = this.protocols.get(name);
        if (protocol) {
            protocol.enabled = false;
            logger.info(`Disabled protocol: ${name}`);
            return true;
        }
        return false;
    }
    
    getProtocolCount() {
        return this.protocols.size;
    }
    
    getEnabledProtocolCount() {
        return this.getEnabledProtocols().length;
    }
    
    getProtocolContract(protocolName, chain, contractType) {
        const protocol = this.protocols.get(protocolName);
        if (!protocol || !protocol.contracts || !protocol.contracts[chain]) {
            return null;
        }
        
        return protocol.contracts[chain][contractType] || null;
    }
    
    getProtocolContracts(protocolName, chain) {
        const protocol = this.protocols.get(protocolName);
        if (!protocol || !protocol.contracts) {
            return null;
        }
        
        return protocol.contracts[chain] || null;
    }
    
    getSupportedAssets(protocolName) {
        const protocol = this.protocols.get(protocolName);
        return protocol ? protocol.supportedAssets || [] : [];
    }
    
    getSupportedChains(protocolName) {
        const protocol = this.protocols.get(protocolName);
        return protocol ? protocol.chains || [] : [];
    }
    
    getProtocolRiskScore(protocolName) {
        const protocol = this.protocols.get(protocolName);
        return protocol ? protocol.riskScore || 0.5 : 0.5;
    }
    
    getProtocolGasEfficiency(protocolName) {
        const protocol = this.protocols.get(protocolName);
        return protocol ? protocol.gasEfficiency || 0.5 : 0.5;
    }
    
    hasFeature(protocolName, feature) {
        const protocol = this.protocols.get(protocolName);
        return protocol && protocol.features && protocol.features.includes(feature);
    }
    
    getProtocolFeatures(protocolName) {
        const protocol = this.protocols.get(protocolName);
        return protocol ? protocol.features || [] : [];
    }
    
    addProtocol(name, config) {
        if (this.protocols.has(name)) {
            logger.warn(`Protocol ${name} already exists, updating configuration`);
        }
        
        this.protocols.set(name, {
            name,
            enabled: true,
            ...config
        });
        
        logger.info(`Added/updated protocol: ${name}`);
        return true;
    }
    
    removeProtocol(name) {
        const removed = this.protocols.delete(name);
        if (removed) {
            logger.info(`Removed protocol: ${name}`);
        }
        return removed;
    }
    
    updateProtocol(name, updates) {
        const protocol = this.protocols.get(name);
        if (!protocol) {
            return false;
        }
        
        Object.assign(protocol, updates);
        logger.info(`Updated protocol: ${name}`);
        return true;
    }
    
    saveProtocols() {
        try {
            const config = {
                protocols: {}
            };
            
            for (const [name, protocol] of this.protocols) {
                config.protocols[name] = protocol;
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            logger.info(`Saved protocol configurations to ${this.configPath}`);
            return true;
            
        } catch (error) {
            logger.error('Failed to save protocol configurations:', error);
            return false;
        }
    }
    
    getStats() {
        const protocols = this.getAllProtocols();
        const enabled = this.getEnabledProtocols();
        
        const chainCounts = {};
        const typeCounts = {};
        const assetCounts = {};
        
        for (const protocol of protocols) {
            // Count by chains
            if (protocol.chains) {
                for (const chain of protocol.chains) {
                    chainCounts[chain] = (chainCounts[chain] || 0) + 1;
                }
            }
            
            // Count by type
            if (protocol.type) {
                typeCounts[protocol.type] = (typeCounts[protocol.type] || 0) + 1;
            }
            
            // Count by assets
            if (protocol.supportedAssets) {
                for (const asset of protocol.supportedAssets) {
                    assetCounts[asset] = (assetCounts[asset] || 0) + 1;
                }
            }
        }
        
        return {
            total: protocols.length,
            enabled: enabled.length,
            disabled: protocols.length - enabled.length,
            byChain: chainCounts,
            byType: typeCounts,
            byAsset: assetCounts,
            avgRiskScore: protocols.reduce((sum, p) => sum + (p.riskScore || 0.5), 0) / protocols.length,
            avgGasEfficiency: protocols.reduce((sum, p) => sum + (p.gasEfficiency || 0.5), 0) / protocols.length
        };
    }
    
    validateProtocol(protocol) {
        const required = ['name', 'displayName', 'chains'];
        const errors = [];
        
        for (const field of required) {
            if (!protocol[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        if (protocol.chains && !Array.isArray(protocol.chains)) {
            errors.push('chains must be an array');
        }
        
        if (protocol.supportedAssets && !Array.isArray(protocol.supportedAssets)) {
            errors.push('supportedAssets must be an array');
        }
        
        if (protocol.riskScore && (protocol.riskScore < 0 || protocol.riskScore > 1)) {
            errors.push('riskScore must be between 0 and 1');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    search(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const protocol of this.protocols.values()) {
            let matches = false;
            
            // Search in name and display name
            if (protocol.name.toLowerCase().includes(searchTerm) ||
                protocol.displayName.toLowerCase().includes(searchTerm)) {
                matches = true;
            }
            
            // Search in supported assets
            if (protocol.supportedAssets) {
                for (const asset of protocol.supportedAssets) {
                    if (asset.toLowerCase().includes(searchTerm)) {
                        matches = true;
                        break;
                    }
                }
            }
            
            // Search in chains
            if (protocol.chains) {
                for (const chain of protocol.chains) {
                    if (chain.toLowerCase().includes(searchTerm)) {
                        matches = true;
                        break;
                    }
                }
            }
            
            if (matches) {
                results.push(protocol);
            }
        }
        
        return results;
    }
    
    isInitialized() {
        return this.initialized;
    }
}

module.exports = ProtocolRegistry;
