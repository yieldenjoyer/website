import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, TrendingUp, Users, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Real-time APY Tracking',
      description: 'Monitor yields across all major DeFi protocols with live updates and historical data.',
    },
    {
      icon: Zap,
      title: 'Automated Yield Optimization',
      description: 'Smart algorithms automatically rebalance your portfolio for maximum returns.',
    },
    {
      icon: Sparkles,
      title: 'Snapshot Farming',
      description: 'Earn additional rewards through strategic snapshot participation.',
    },
    {
      icon: Shield,
      title: 'Smart Rebalancing',
      description: 'Intelligent risk management with automated position adjustments.',
    },
    {
      icon: Users,
      title: 'Whale Copy Trading',
      description: 'Follow successful DeFi strategies from top performers. (Coming Soon)',
      comingSoon: true,
    },
    {
      icon: Clock,
      title: 'Strategy Marketplace',
      description: 'Discover and share proven yield strategies with the community. (Coming Soon)',
      comingSoon: true,
    },
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-mint-500/10 rounded-full blur-2xl animate-float"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              Maximize Your{' '}
              <span className="text-gradient">Crypto Yields</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Real-time yield optimization across Aave, Morpho, Pendle, and more.
              Built for DeFi power users who demand the best returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <w3m-button />
              <Link
                to="/dashboard"
                className="btn-secondary inline-flex items-center"
              >
                Explore Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Powerful Features for DeFi Optimization
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to maximize your DeFi yields in one comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`card relative ${feature.comingSoon ? 'opacity-75' : ''}`}
                >
                  {feature.comingSoon && (
                    <div className="absolute top-4 right-4 bg-violet-500/20 text-violet-400 text-xs px-2 py-1 rounded-full">
                      Coming Soon
                    </div>
                  )}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-500 to-violet-500 rounded-lg flex items-center justify-center mr-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyber-900/20 to-violet-900/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Ready to Optimize Your Yields?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of DeFi users who are already maximizing their returns with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <w3m-button />
            <Link to="/faq" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
