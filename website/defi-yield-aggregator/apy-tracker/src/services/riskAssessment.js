const logger = require('../utils/logger');

class RiskAssessment {
  constructor() {
    // Risk factors and their weights
    this.riskFactors = {
      protocol: 0.3,
      tvl: 0.2,
      apy: 0.2,
      chain: 0.1,
      ilRisk: 0.1,
      age: 0.1
    };
  }

  assessRisks(opportunities, token) {
    return opportunities.map(opportunity => {
      const riskScore = this.calculateRiskScore(opportunity, token);
      const riskRating = this.getRiskRating(riskScore);
      const riskFactors = this.identifyRiskFactors(opportunity, token);
      const route = this.generateRoute(opportunity);

      return {
        ...opportunity,
        riskScore,
        riskRating,
        riskFactors,
        route,
        recommendation: this.getRecommendation(riskRating, opportunity.apy),
        warnings: this.getWarnings(opportunity, token)
      };
    });
  }

  calculateRiskScore(opportunity, token) {
    let score = 0;

    // Protocol risk (0-100 scale)
    score += this.getProtocolRisk(opportunity.protocol) * this.riskFactors.protocol;

    // TVL risk (lower TVL = higher risk)
    score += this.getTVLRisk(opportunity.tvl) * this.riskFactors.tvl;

    // APY risk (extremely high APY = higher risk)
    score += this.getAPYRisk(opportunity.apy, token) * this.riskFactors.apy;

    // Chain risk
    score += this.getChainRisk(opportunity.chain) * this.riskFactors.chain;

    // Impermanent loss risk
    score += (opportunity.ilRisk || 0) * this.riskFactors.ilRisk;

    return Math.min(100, Math.max(0, score));
  }

  getProtocolRisk(protocol) {
    if (!protocol) return 80;

    const protocolLower = protocol.toLowerCase();

    // Tier 1 - Established, audited protocols (low risk)
    const tier1 = ['aave', 'compound', 'makerdao', 'lido', 'rocket pool'];
    if (tier1.some(p => protocolLower.includes(p))) return 10;

    // Tier 2 - Well-known DeFi protocols (medium-low risk)
    const tier2 = ['uniswap', 'curve', 'balancer', 'sushiswap', 'yearn', 'convex', 'frax'];
    if (tier2.some(p => protocolLower.includes(p))) return 25;

    // Tier 3 - Newer or specialized protocols (medium risk)
    const tier3 = ['harvest', 'pickle', 'beefy', 'pancakeswap', 'quickswap'];
    if (tier3.some(p => protocolLower.includes(p))) return 45;

    // Tier 4 - High-risk or experimental protocols
    const tier4 = ['alpha', 'tomb', 'ohm', 'wonderland', 'anchor', 'terra'];
    if (tier4.some(p => protocolLower.includes(p))) return 80;

    // Unknown protocols
    return 60;
  }

  getTVLRisk(tvl) {
    if (tvl >= 1000000000) return 5;   // > $1B = very low risk
    if (tvl >= 100000000) return 15;   // > $100M = low risk
    if (tvl >= 10000000) return 30;    // > $10M = medium risk
    if (tvl >= 1000000) return 50;     // > $1M = medium-high risk
    if (tvl >= 100000) return 70;      // > $100K = high risk
    return 90;                         // < $100K = very high risk
  }

  getAPYRisk(apy, token) {
    const isStablecoin = ['USDC', 'USDT', 'USDE', 'DAI'].includes(token);
    
    if (isStablecoin) {
      if (apy >= 50) return 80;        // > 50% for stablecoins = very suspicious
      if (apy >= 20) return 60;        // > 20% = high risk for stablecoins
      if (apy >= 10) return 30;        // > 10% = medium risk
      if (apy >= 5) return 15;         // 5-10% = reasonable for stablecoins
      return 5;                        // < 5% = low risk
    } else {
      if (apy >= 100) return 75;       // > 100% = very high risk
      if (apy >= 50) return 50;        // > 50% = high risk
      if (apy >= 25) return 30;        // > 25% = medium risk
      if (apy >= 10) return 15;        // > 10% = low-medium risk
      return 5;                        // < 10% = low risk
    }
  }

  getChainRisk(chain) {
    if (!chain) return 30;

    const chainLower = chain.toLowerCase();

    // Tier 1 chains (lowest risk)
    if (['ethereum', 'eth'].includes(chainLower)) return 5;

    // Tier 2 chains (low risk)
    if (['polygon', 'arbitrum', 'optimism', 'matic'].includes(chainLower)) return 15;

    // Tier 3 chains (medium risk)
    if (['avalanche', 'fantom', 'bsc', 'binance'].includes(chainLower)) return 25;

    // Other chains (higher risk)
    return 40;
  }

  getRiskRating(score) {
    if (score >= 70) return 'VERY_HIGH';
    if (score >= 50) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    if (score >= 15) return 'LOW';
    return 'VERY_LOW';
  }

  identifyRiskFactors(opportunity, token) {
    const factors = [];

    // Protocol-specific risks
    const protocolRisk = this.getProtocolRisk(opportunity.protocol);
    if (protocolRisk >= 60) factors.push('Unproven or high-risk protocol');
    else if (protocolRisk >= 45) factors.push('Experimental protocol');

    // TVL risks
    if (opportunity.tvl < 1000000) factors.push('Low liquidity (< $1M TVL)');
    else if (opportunity.tvl < 10000000) factors.push('Medium liquidity (< $10M TVL)');

    // APY risks
    const isStablecoin = ['USDC', 'USDT', 'USDE'].includes(token);
    if (isStablecoin && opportunity.apy > 20) {
      factors.push('Extremely high APY for stablecoin');
    } else if (!isStablecoin && opportunity.apy > 100) {
      factors.push('Extremely high APY - potential rug risk');
    }

    // Impermanent loss
    if (opportunity.ilRisk > 0) {
      factors.push('Impermanent loss risk');
    }

    // Chain risks
    if (!['ethereum', 'polygon', 'arbitrum', 'optimism'].includes(opportunity.chain?.toLowerCase())) {
      factors.push('Alternative chain risk');
    }

    return factors;
  }

  generateRoute(opportunity) {
    const steps = [];

    // Step 1: Get to the platform
    steps.push({
      step: 1,
      action: 'Navigate to platform',
      description: `Visit ${opportunity.protocol}`,
      url: opportunity.url
    });

    // Step 2: Connect wallet
    steps.push({
      step: 2,
      action: 'Connect wallet',
      description: `Connect your wallet to ${opportunity.chain} network`
    });

    // Step 3: Find the specific pool
    steps.push({
      step: 3,
      action: 'Locate pool',
      description: `Search for ${opportunity.pool} on ${opportunity.protocol}`
    });

    // Step 4: Deposit
    steps.push({
      step: 4,
      action: 'Deposit funds',
      description: 'Review terms and deposit your tokens'
    });

    return {
      totalSteps: steps.length,
      estimatedTime: '5-10 minutes',
      steps
    };
  }

  getRecommendation(riskRating, apy) {
    switch (riskRating) {
      case 'VERY_LOW':
        return `✅ Safe yield opportunity. APY of ${apy.toFixed(2)}% is reasonable for the risk level.`;
      case 'LOW':
        return `✅ Generally safe with acceptable risk. Good balance of risk/reward at ${apy.toFixed(2)}% APY.`;
      case 'MEDIUM':
        return `⚠️ Moderate risk. Consider your risk tolerance. ${apy.toFixed(2)}% APY comes with some risks.`;
      case 'HIGH':
        return `⚠️ High risk investment. Only invest what you can afford to lose. ${apy.toFixed(2)}% APY is risky.`;
      case 'VERY_HIGH':
        return `🚨 Very high risk! Potential rug pull or protocol failure. ${apy.toFixed(2)}% APY is extremely risky.`;
      default:
        return `Unknown risk level. Please research thoroughly before investing.`;
    }
  }

  getWarnings(opportunity, token) {
    const warnings = [];

    // High APY warnings
    const isStablecoin = ['USDC', 'USDT', 'USDE'].includes(token);
    if (isStablecoin && opportunity.apy > 30) {
      warnings.push('🚨 Extremely high APY for a stablecoin - likely unsustainable');
    }

    // Low TVL warnings
    if (opportunity.tvl < 100000) {
      warnings.push('⚠️ Very low TVL - high risk of liquidity issues');
    }

    // New or unknown protocols
    if (this.getProtocolRisk(opportunity.protocol) > 60) {
      warnings.push('⚠️ Unverified or high-risk protocol');
    }

    // Chain warnings
    if (!['ethereum', 'polygon', 'arbitrum', 'optimism'].includes(opportunity.chain?.toLowerCase())) {
      warnings.push('ℹ️ Alternative blockchain - ensure you understand the risks');
    }

    return warnings;
  }
}

module.exports = new RiskAssessment();
