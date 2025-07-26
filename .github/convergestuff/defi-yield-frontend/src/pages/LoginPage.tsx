import { useAccount } from 'wagmi';
import { Wallet, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const { isConnected, address } = useAccount();

  const walletFeatures = [
    {
      icon: Shield,
      title: 'Secure & Non-Custodial',
      description: 'Your keys, your crypto. We never have access to your funds.',
    },
    {
      icon: Zap,
      title: 'Instant Access',
      description: 'Connect your wallet and start optimizing yields immediately.',
    },
    {
      icon: Wallet,
      title: 'Multiple Wallets Supported',
      description: 'MetaMask, WalletConnect, Coinbase Wallet, and more.',
    },
  ];

  if (isConnected) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-cyber-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-4">
              Wallet Connected!
            </h2>
            <p className="text-gray-400 mb-6">
              Your wallet is successfully connected. You can now access all platform features.
            </p>
            <div className="space-y-4">
              <Link
                to="/dashboard"
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/"
                className="btn-secondary w-full inline-flex items-center justify-center"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-display font-bold text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Access the DeFi Yield Optimizer platform using your Web3 wallet. 
              No email or password required - just secure, decentralized authentication.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Wallet Connection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-2 lg:order-1"
          >
            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-cyber-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-gray-400 mb-8">
                Connect your wallet to access yield optimization strategies, 
                real-time analytics, and automated rebalancing.
              </p>
              <div className="space-y-4">
                <w3m-button />
                <p className="text-sm text-gray-500">
                  By connecting your wallet, you agree to our{' '}
                  <a href="#" className="text-cyber-400 hover:text-cyber-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-cyber-400 hover:text-cyber-300">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-6">
                Why Connect Your Wallet?
              </h3>
              {walletFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-500/20 to-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-cyber-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16"
        >
          <div className="card">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                New to Web3 Wallets?
              </h3>
              <p className="text-gray-400 mb-6">
                Don't have a wallet yet? We recommend starting with MetaMask, 
                one of the most popular and secure Web3 wallets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  Get MetaMask
                </a>
                <Link
                  to="/faq"
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
