import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (provider: string) => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      alert(`Connecting to ${provider}...`);
    }, 2000);
  };

  const walletOptions = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      popular: true
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using WalletConnect protocol',
      popular: true
    },
    {
      name: 'Coinbase Wallet',
      icon: '🏦',
      description: 'Connect using Coinbase Wallet',
      popular: false
    },
    {
      name: 'Ledger',
      icon: '🔐',
      description: 'Connect using Ledger hardware wallet',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Connect Wallet
          </h1>
          <p className="text-gray-300 text-lg">
            Connect your wallet to start earning optimized yields
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          {walletOptions.map((wallet, index) => (
            <motion.button
              key={wallet.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              onClick={() => handleConnect(wallet.name)}
              disabled={isConnecting}
              className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-left hover:border-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{wallet.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                      {wallet.name}
                      {wallet.popular && (
                        <span className="ml-2 text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">{wallet.description}</p>
                  </div>
                </div>
                {isConnecting && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-400"></div>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-sm border border-violet-500/20 rounded-xl p-4">
              <Shield className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Secure</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4">
              <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Fast</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
              <Wallet className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Easy</p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-400">
            <p className="mb-2">New to crypto wallets?</p>
            <a 
              href="#" 
              className="text-violet-400 hover:text-violet-300 transition-colors underline"
            >
              Learn how to get started
            </a>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>By connecting a wallet, you agree to our</p>
            <div className="space-x-4 mt-1">
              <a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
