const { ethers } = require('ethers');
const logger = require('../utils/logger').loggers.executor;
const GasMonitor = require('../utils/GasMonitor');

class TransactionExecutor {
    constructor(providers, walletConfig) {
        this.providers = providers; // { chainId: provider }
        this.wallets = {}; // { chainId: wallet }
        this.gasMonitor = new GasMonitor(providers);
        this.gasConfig = {
            maxGasPrice: ethers.parseUnits('100', 'gwei'),
            gasLimit: {
                deposit: '300000',
                withdraw: '250000',
                bridge: '500000',
                swap: '200000'
            }
        };
        
        this.initializeWallets(walletConfig);
    }
    
    initializeWallets(walletConfig) {
        try {
            for (const [chainId, provider] of Object.entries(this.providers)) {
                if (walletConfig.privateKey) {
                    this.wallets[chainId] = new ethers.Wallet(walletConfig.privateKey, provider);
                    logger.info(`Initialized wallet for chain ${chainId}`);
                }
            }
        } catch (error) {
            logger.error('Failed to initialize wallets:', error);
            throw error;
        }
    }
    
    async executeRebalance(rebalanceParams) {
        const {
            currentPosition,
            targetPosition,
            asset,
            amount,
            strategy,
            expectedYieldImprovement
        } = rebalanceParams;
        
        try {
            logger.info('Starting rebalance execution:', {
                from: currentPosition,
                to: targetPosition,
                asset,
                amount: ethers.formatUnits(amount, 18),
                expectedYieldImprovement
            });
            
            // Pre-execution gas analysis
            const gasAnalysis = await this.analyzeExecutionProfitability(rebalanceParams);
            
            if (!gasAnalysis.shouldExecute) {
                logger.warn('Execution cancelled - gas analysis failed:', gasAnalysis);
                return {
                    success: false,
                    error: `Execution cancelled: ${gasAnalysis.recommendation}`,
                    gasAnalysis
                };
            }
            
            const execution = await this.planExecution(rebalanceParams);
            
            // Execute the planned steps with gas monitoring
            for (const step of execution.steps) {
                await this.executeStepWithGasCheck(step, expectedYieldImprovement);
                await this.sleep(2000); // Wait between transactions
            }
            
            logger.info('Rebalance execution completed successfully');
            return { 
                success: true, 
                txHashes: execution.txHashes,
                gasAnalysis
            };
            
        } catch (error) {
            logger.error('Rebalance execution failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async analyzeExecutionProfitability(rebalanceParams) {
        try {
            const { currentPosition, expectedYieldImprovement, amount } = rebalanceParams;
            const chainId = currentPosition.chainId;
            
            // Calculate expected yield in USD
            const positionValueUSD = parseFloat(ethers.formatUnits(amount, 18)) * 
                await this.getAssetPriceUSD(rebalanceParams.asset);
            const expectedYieldUSD = positionValueUSD * (expectedYieldImprovement / 100);
            
            // Analyze each execution step
            const execution = await this.planExecution(rebalanceParams);
            let totalAnalysis = null;
            
            for (const step of execution.steps) {
                const stepAnalysis = await this.gasMonitor.shouldExecuteTransaction(
                    step.chainId || step.fromChain,
                    step.type,
                    expectedYieldUSD / execution.steps.length, // Distribute expected yield across steps
                    24 // 24 hour time horizon
                );
                
                if (!stepAnalysis.shouldExecute) {
                    return stepAnalysis; // Return first failing analysis
                }
                
                if (!totalAnalysis) {
                    totalAnalysis = stepAnalysis;
                } else {
                    // Aggregate analyses
                    totalAnalysis.gasCostUSD += stepAnalysis.gasCostUSD;
                    totalAnalysis.netProfitUSD = totalAnalysis.expectedYieldUSD - totalAnalysis.gasCostUSD;
                    totalAnalysis.shouldExecute = totalAnalysis.netProfitUSD > 0;
                }
            }
            
            return totalAnalysis;
            
        } catch (error) {
            logger.error('Failed to analyze execution profitability:', error);
            return {
                shouldExecute: false,
                error: error.message,
                recommendation: 'analysis_failed'
            };
        }
    }
    
    async executeStepWithGasCheck(step, expectedYieldImprovement) {
        const chainId = step.chainId || step.fromChain;
        
        try {
            // Get current gas price
            const gasData = await this.gasMonitor.getCurrentGasPrice(chainId);
            logger.info(`Current gas price for chain ${chainId}: ${gasData.standard} gwei (source: ${gasData.source})`);
            
            // Check if gas price is acceptable
            if (!this.gasMonitor.isGasPriceAcceptable(chainId, gasData.standard)) {
                logger.warn(`Gas price too high: ${gasData.standard} gwei`);
                
                // Try to wait for lower gas (max 5 minutes)
                try {
                    const threshold = this.gasMonitor.thresholds[chainId];
                    if (threshold) {
                        await this.gasMonitor.waitForLowerGas(chainId, threshold.medium, 5);
                        logger.info('Gas price dropped to acceptable level');
                    }
                } catch (waitError) {
                    logger.warn('Timeout waiting for lower gas, proceeding anyway');
                }
            }
            
            return await this.executeStep(step);
            
        } catch (error) {
            logger.error(`Failed to execute step ${step.type} with gas check:`, error);
            throw error;
        }
    }
    
    async planExecution(params) {
        const steps = [];
        const { currentPosition, targetPosition, asset, amount } = params;
        
        // Step 1: Withdraw from current position
        if (currentPosition.protocol === 'euler') {
            steps.push({
                type: 'withdraw',
                protocol: 'euler',
                chainId: currentPosition.chainId,
                market: currentPosition.market,
                asset,
                amount
            });
        }
        
        // Step 2: Bridge if different chains
        if (currentPosition.chainId !== targetPosition.chainId) {
            steps.push({
                type: 'bridge',
                fromChain: currentPosition.chainId,
                toChain: targetPosition.chainId,
                asset,
                amount
            });
        }
        
        // Step 3: Deposit to target position
        if (targetPosition.protocol === 'euler') {
            steps.push({
                type: 'deposit',
                protocol: 'euler',
                chainId: targetPosition.chainId,
                market: targetPosition.market,
                asset,
                amount
            });
        }
        
        return { steps, txHashes: [] };
    }
    
    async executeStep(step) {
        logger.info('Executing step:', step.type);
        
        switch (step.type) {
            case 'withdraw':
                return await this.executeWithdraw(step);
            case 'deposit':
                return await this.executeDeposit(step);
            case 'bridge':
                return await this.executeBridge(step);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    
    async executeWithdraw(step) {
        const { protocol, chainId, market, asset, amount } = step;
        
        try {
            if (protocol === 'euler') {
                return await this.executeEulerWithdraw(chainId, market, asset, amount);
            }
            throw new Error(`Unsupported protocol: ${protocol}`);
        } catch (error) {
            logger.error('Withdraw execution failed:', error);
            throw error;
        }
    }
    
    async executeDeposit(step) {
        const { protocol, chainId, market, asset, amount } = step;
        
        try {
            if (protocol === 'euler') {
                return await this.executeEulerDeposit(chainId, market, asset, amount);
            }
            throw new Error(`Unsupported protocol: ${protocol}`);
        } catch (error) {
            logger.error('Deposit execution failed:', error);
            throw error;
        }
    }
    
    async executeEulerWithdraw(chainId, market, asset, amount) {
        const wallet = this.wallets[chainId];
        if (!wallet) {
            throw new Error(`No wallet configured for chain ${chainId}`);
        }
        
        // Euler withdraw logic
        const eulerContract = new ethers.Contract(
            market,
            [
                'function withdraw(uint256 subAccountId, uint256 amount) external',
                'function balanceOf(address account) external view returns (uint256)'
            ],
            wallet
        );
        
        // Check current balance
        const balance = await eulerContract.balanceOf(wallet.address);
        logger.info(`Current Euler balance: ${ethers.formatUnits(balance, 18)}`);
        
        const gasPrice = await this.getOptimalGasPrice(chainId);
        const tx = await eulerContract.withdraw(0, amount, {
            gasLimit: this.gasConfig.gasLimit.withdraw,
            gasPrice
        });
        
        logger.info(`Euler withdraw tx submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        logger.info(`Euler withdraw confirmed in block: ${receipt.blockNumber}`);
        
        return { txHash: tx.hash, receipt };
    }
    
    async executeEulerDeposit(chainId, market, asset, amount) {
        const wallet = this.wallets[chainId];
        if (!wallet) {
            throw new Error(`No wallet configured for chain ${chainId}`);
        }
        
        // First approve the token
        const tokenContract = new ethers.Contract(
            asset,
            ['function approve(address spender, uint256 amount) external returns (bool)'],
            wallet
        );
        
        const gasPrice = await this.getOptimalGasPrice(chainId);
        
        // Approve
        const approveTx = await tokenContract.approve(market, amount, {
            gasLimit: '50000',
            gasPrice
        });
        await approveTx.wait();
        logger.info(`Approval confirmed: ${approveTx.hash}`);
        
        // Euler deposit logic
        const eulerContract = new ethers.Contract(
            market,
            ['function deposit(uint256 subAccountId, uint256 amount) external'],
            wallet
        );
        
        const tx = await eulerContract.deposit(0, amount, {
            gasLimit: this.gasConfig.gasLimit.deposit,
            gasPrice
        });
        
        logger.info(`Euler deposit tx submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        logger.info(`Euler deposit confirmed in block: ${receipt.blockNumber}`);
        
        return { txHash: tx.hash, receipt };
    }
    
    async executeBridge(step) {
        const { fromChain, toChain, asset, amount } = step;
        
        try {
            logger.info(`Bridging ${ethers.formatUnits(amount, 18)} from chain ${fromChain} to ${toChain}`);
            
            const bridgeResult = await this.executeCrossChainBridge({
                fromChain,
                toChain,
                asset,
                amount,
                recipient: this.wallets[toChain].address
            });
            
            return bridgeResult;
            
        } catch (error) {
            logger.error('Bridge execution failed:', error);
            throw error;
        }
    }
    
    async executeCrossChainBridge({ fromChain, toChain, asset, amount, recipient }) {
        const wallet = this.wallets[fromChain];
        
        // Example bridge contract interaction
        const bridgeContract = new ethers.Contract(
            '0x...', // Bridge contract address
            [
                'function bridge(address token, uint256 amount, uint16 dstChain, address to) external payable'
            ],
            wallet
        );
        
        const gasPrice = await this.getOptimalGasPrice(fromChain);
        const bridgeFee = ethers.parseEther('0.01'); // Example bridge fee
        
        const tx = await bridgeContract.bridge(asset, amount, toChain, recipient, {
            value: bridgeFee,
            gasLimit: this.gasConfig.gasLimit.bridge,
            gasPrice
        });
        
        logger.info(`Bridge tx submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Wait for bridge completion
        await this.waitForBridgeCompletion(tx.hash, toChain);
        
        return { txHash: tx.hash, receipt };
    }
    
    async waitForBridgeCompletion(txHash, targetChain) {
        logger.info(`Waiting for bridge completion on chain ${targetChain}...`);
        await this.sleep(60000); // 1 minute wait
        logger.info('Bridge completion detected');
    }
    
    async getOptimalGasPrice(chainId, urgency = 'standard') {
        try {
            // Use gas monitor for optimal pricing
            const optimalPrice = await this.gasMonitor.getOptimalGasPrice(chainId, urgency);
            const gasPrice = ethers.parseUnits(optimalPrice.toString(), 'gwei');
            
            // Cap gas price to avoid excessive fees
            if (gasPrice > this.gasConfig.maxGasPrice) {
                const cappedPrice = this.gasConfig.maxGasPrice;
                logger.warn(`Gas price capped at ${ethers.formatUnits(cappedPrice, 'gwei')} gwei`);
                return cappedPrice;
            }
            
            return gasPrice;
            
        } catch (error) {
            logger.error('Failed to get optimal gas price:', error);
            // Fallback to a reasonable default
            return ethers.parseUnits('20', 'gwei');
        }
    }
    
    async estimateExecutionCost(rebalanceParams) {
        try {
            const execution = await this.planExecution(rebalanceParams);
            let totalCostUSD = 0;
            let totalCostWei = BigInt(0);
            
            for (const step of execution.steps) {
                const stepCost = await this.gasMonitor.calculateTransactionCost(
                    step.chainId || step.fromChain,
                    step.type
                );
                
                totalCostUSD += stepCost.costInUSD;
                totalCostWei += BigInt(stepCost.costInWei);
            }
            
            return {
                totalCost: totalCostWei,
                totalCostEth: ethers.formatEther(totalCostWei),
                totalCostUSD,
                steps: execution.steps.length
            };
            
        } catch (error) {
            logger.error('Failed to estimate execution cost:', error);
            return { 
                totalCost: BigInt(0), 
                totalCostEth: '0', 
                totalCostUSD: 0,
                steps: 0 
            };
        }
    }
    
    async validateExecution(rebalanceParams) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        try {
            // Check wallet balances
            const balanceCheck = await this.checkWalletBalances(rebalanceParams);
            if (!balanceCheck.sufficient) {
                validation.valid = false;
                validation.errors.push('Insufficient balance for execution');
            }
            
            // Check gas profitability
            const gasAnalysis = await this.analyzeExecutionProfitability(rebalanceParams);
            if (!gasAnalysis.shouldExecute) {
                validation.warnings.push(`Gas cost concerns: ${gasAnalysis.recommendation}`);
            }
            
            // Check market conditions
            const marketCheck = await this.checkMarketConditions(rebalanceParams);
            if (!marketCheck.suitable) {
                validation.warnings.push('Market conditions may not be optimal');
            }
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    async checkWalletBalances(params) {
        try {
            const { currentPosition, asset, amount } = params;
            const wallet = this.wallets[currentPosition.chainId];
            
            if (!wallet) {
                return { sufficient: false, reason: 'No wallet configured' };
            }
            
            // Check token balance
            const tokenContract = new ethers.Contract(
                asset,
                ['function balanceOf(address) external view returns (uint256)'],
                wallet
            );
            
            const balance = await tokenContract.balanceOf(wallet.address);
            
            return {
                sufficient: balance >= amount,
                balance: ethers.formatUnits(balance, 18),
                required: ethers.formatUnits(amount, 18)
            };
            
        } catch (error) {
            logger.error('Balance check failed:', error);
            return { sufficient: false, reason: error.message };
        }
    }
    
    async checkMarketConditions(params) {
        return { suitable: true, conditions: 'normal' };
    }
    
    async getAssetPriceUSD(assetAddress) {
        // Simplified price mapping - in production integrate with price feeds
        const prices = {
            'USDC': 1.0,
            'USDT': 1.0,
            'DAI': 1.0,
            'WETH': 2500.0,
            'WBTC': 45000.0
        };
        
        // This would integrate with actual price feeds like Chainlink
        return prices[assetAddress] || 1.0;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Gas monitoring API methods
    async getCurrentGasPrices() {
        const gasStats = this.gasMonitor.getGasStats();
        return gasStats;
    }
    
    async getGasAnalysis(chainId, operationType, expectedYieldUSD, timeHours = 24) {
        return await this.gasMonitor.shouldExecuteTransaction(
            chainId,
            operationType,
            expectedYieldUSD,
            timeHours
        );
    }
    
    // Emergency functions
    async emergencyStop() {
        logger.warn('Emergency stop activated - halting all operations');
        this.emergencyMode = true;
    }
    
    async emergencyWithdrawAll() {
        logger.warn('Emergency withdraw initiated');
        // Implementation would withdraw from all positions
    }
    
    isEmergencyMode() {
        return this.emergencyMode || false;
    }
}

module.exports = TransactionExecutor;
