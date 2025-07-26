import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

const HomePage: React.FC = () => {
  const { theme } = useStore();
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  // Asset data from crypto-example.html
  const stablecoinYields = [
    {
      name: 'USDC',
      icon: '💰',
      apy: '26.30%',
      rewards: '100 coins',
      protocol: 'Aave',
      chain: 'Ethereum'
    },
    {
      name: 'USDT', 
      icon: '💎',
      apy: '22.15%',
      rewards: '85 coins',
      protocol: 'Compound',
      chain: 'Ethereum'
    },
    {
      name: 'DAI',
      icon: '🪙', 
      apy: '24.80%',
      rewards: '95 coins',
      protocol: 'MakerDAO',
      chain: 'Ethereum'
    }
  ];

  const cryptoAssets = [
    {
      name: 'ETH',
      icon: 'Ξ',
      apy: '18.75%',
      rewards: '50 coins',
      protocol: 'Lido',
      chain: 'Ethereum',
      featured: true
    },
    {
      name: 'WBTC',
      icon: '₿',
      apy: '15.40%', 
      rewards: '20 coins',
      protocol: 'Curve',
      chain: 'Ethereum'
    },
    {
      name: 'MATIC',
      icon: '🟣',
      apy: '12.90%',
      rewards: '150 coins', 
      protocol: 'QuickSwap',
      chain: 'Polygon'
    }
  ];

  const handleConnectWallet = () => {
    setConnectingWallet(true);
    setTimeout(() => {
      setConnectingWallet(false);
      setWalletConnected(true);
    }, 2500);
  };

  const handleAssetDetails = (asset: string) => {
    alert(`Viewing details for ${asset}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6"
          >
            DeFi Portfolio
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
          >
            Explore the Best Yields from 20+ Protocols. Maximize your DeFi returns with our comprehensive yield aggregation platform.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a href="#yields" className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg font-medium">
              Explore Yields
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stablecoin Yields Section */}
      <section id="yields" className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              Stablecoin Yields
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {stablecoinYields.map((asset, index) => (
              <motion.div
                key={asset.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-xl p-6 border hover:shadow-lg transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{asset.icon}</span>
                  <h3 className="text-xl font-semibold">{asset.name}</h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">APY</span>
                    <span className="text-2xl font-bold text-green-500">{asset.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Rewards</span>
                    <span className="font-medium">{asset.rewards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Protocol</span>
                    <span className="font-medium">{asset.protocol}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleAssetDetails(asset.name)}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  View Details
                </button>
              </motion.div>
            ))}
          </div>

          {/* Crypto Assets Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crypto Assets
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {cryptoAssets.map((asset, index) => (
              <motion.div
                key={asset.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-xl p-6 border hover:shadow-lg transition-all duration-300 relative ${
                  asset.featured 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                    : theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {asset.featured && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                    Featured
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold">{asset.icon}</span>
                  <h3 className="text-xl font-semibold">{asset.name}</h3>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">APY</span>
                    <span className="text-2xl font-bold text-green-500">{asset.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Rewards</span>
                    <span className="font-medium">{asset.rewards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Protocol</span>
                    <span className="font-medium">{asset.protocol}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleAssetDetails(asset.name)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Details
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Total Assets', value: '6+' },
              { label: 'Best APY', value: '26.30%' },
              { label: 'Protocols', value: '6+' },
              { label: 'Chains', value: '2+' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl font-bold text-green-600 mb-2">{stat.value}</div>
                <div className="text-sm opacity-70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold">Ready to Start Earning?</h2>
            <p className="text-xl opacity-80">Join thousands of users maximizing their DeFi yields</p>
            
            {!walletConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={connectingWallet}
                className="bg-green-600 text-white px-12 py-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg font-medium flex items-center gap-3 mx-auto"
              >
                {connectingWallet ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-8 py-4 rounded-lg text-lg font-medium">
                <span className="text-green-600">✅</span>
                Wallet Connected
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
