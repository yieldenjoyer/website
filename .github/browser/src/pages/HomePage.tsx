import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap, Users, DollarSign, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';

const HomePage: React.FC = () => {
  const { theme } = useStore();
  const features = [
    {
      icon: TrendingUp,
      title: 'Optimized Yields',
      description: 'Advanced algorithms automatically find and capitalize on the highest yield opportunities across DeFi protocols.'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Built-in risk assessment and diversification strategies to protect your capital while maximizing returns.'
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description: 'Lightning-fast execution with minimal slippage and optimized gas costs for maximum efficiency.'
    }
  ];

  const protocols = [
    { name: 'Aave', apy: '12.4%', tvl: '$1.2B' },
    { name: 'Compound', apy: '15.7%', tvl: '$850M' },
    { name: 'Yearn', apy: '18.9%', tvl: '$640M' },
    { name: 'Curve', apy: '21.3%', tvl: '$2.1B' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-5xl md:text-7xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Matrix Finance
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Intelligent yield optimization for the Converge blockchain ecosystem. 
              Maximize USDe returns while minimizing risk through automated strategies.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button className="bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 text-lg font-medium">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 transition-colors duration-200 text-lg font-medium">
                Learn More
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Value Locked', value: '$2.8B', icon: DollarSign },
              { label: 'Active Users', value: '46K+', icon: Users },
              { label: 'Average APY', value: '17.35%', icon: BarChart3 },
              { label: 'Protocols', value: '25+', icon: TrendingUp }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-2"
              >
                <stat.icon className="w-8 h-8 text-gray-700 mx-auto" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Why Choose Matrix Finance
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Our platform combines cutting-edge technology with proven DeFi strategies
              to deliver consistent, optimized returns.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <feature.icon className="w-12 h-12 text-gray-700 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Protocols Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Supported Protocols
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600"
            >
              Access the best yields across leading DeFi protocols
            </motion.p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {protocols.map((protocol, index) => (
              <motion.div
                key={protocol.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-lg p-6 text-center"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{protocol.name}</h3>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{protocol.apy}</div>
                  <div className="text-sm text-gray-500">APY</div>
                  <div className="text-sm text-gray-600 mt-2">TVL: {protocol.tvl}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Ready to optimize your yields?
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of users who trust Matrix Finance with their DeFi investments.
            </p>
            <button className="bg-gray-900 text-white px-12 py-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-lg font-medium">
              Start Earning Today
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
