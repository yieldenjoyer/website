import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  // Real-time state management
  const [config, setConfig] = useState({
    autoRebalance: true,
    riskManagement: true,
    compoundRewards: true,
    slippageProtection: false,
    mevProtection: true,
    liquidityMinimum: true
  });

  const [metrics, setMetrics] = useState({
    totalValue: 0,
    currentApy: 0,
    targetApy: 0,
    progress: 0,
    riskScore: 0,
    gasOptimization: 0,
    rebalanceSpeed: 0,
    protocolCount: 0
  });

  const [events, setEvents] = useState<string[]>([
    '[PROTOCOL] AAVE v3 CONNECTED',
    '[YIELD] COMPOUND STRATEGY ACTIVE',
    '[REBALANCE] POSITION OPTIMIZED',
    '[RISK] LOW VOLATILITY DETECTED',
    '[GAS] OPTIMIZATION ENABLED'
  ]);

  const [portfolioData, setPortfolioData] = useState([
    { protocol: 'AAVE', allocation: 45.2, apy: 12.7, risk: 0.23 },
    { protocol: 'COMPOUND', allocation: 32.1, apy: 8.9, risk: 0.15 },
    { protocol: 'YEARN', allocation: 22.7, apy: 15.4, risk: 0.41 }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        totalValue: prev.totalValue + (Math.random() - 0.5) * 1000,
        currentApy: 12.4 + (Math.random() - 0.5) * 2,
        targetApy: 15.8 + (Math.random() - 0.5) * 1,
        progress: Math.min(100, prev.progress + Math.random() * 2),
        riskScore: 0.12 + (Math.random() - 0.5) * 0.1,
        gasOptimization: 87.3 + (Math.random() - 0.5) * 5,
        rebalanceSpeed: 1.2 + (Math.random() - 0.5) * 0.3,
        protocolCount: 7
      }));

      // Add random events
      if (Math.random() < 0.1) {
        const newEvents = [
          '[YIELD] NEW OPPORTUNITY DETECTED',
          '[REBALANCE] TRIGGERED AT 2% DRIFT',
          '[SECURITY] PROTOCOL AUDIT PASSED',
          '[OPTIMIZATION] GAS SAVED 23%',
          '[ALERT] HIGH APY OPPORTUNITY',
          '[COMPOUND] REWARDS HARVESTED'
        ];
        const randomEvent = newEvents[Math.floor(Math.random() * newEvents.length)];
        setEvents(prev => [randomEvent, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleConfig = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono pt-16">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">
            Matrix Finance
          </h1>
          <p className="text-gray-400 text-lg">
            Advanced DeFi yield strategies powered by cutting-edge algorithms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Configuration Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold mb-6 text-white">CONFIGURE</h2>
            
            <div className="space-y-4">
              {Object.entries(config).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-300 uppercase text-sm tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </span>
                  <button
                    onClick={() => toggleConfig(key as keyof typeof config)}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      value 
                        ? 'bg-green-600 text-black' 
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    [{value ? 'ON' : 'OFF'}]
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Live Metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold mb-6 text-white">METRICS</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-xs mb-1">PORTFOLIO VALUE</div>
                <div className="text-2xl font-bold text-green-400">
                  ${metrics.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400 text-xs mb-1">CURRENT APY</div>
                  <div className="text-lg font-bold text-blue-400">
                    {metrics.currentApy.toFixed(3)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">TARGET APY</div>
                  <div className="text-lg font-bold text-purple-400">
                    {metrics.targetApy.toFixed(3)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-xs mb-1">OPTIMIZATION PROGRESS</div>
                <div className="text-lg font-bold text-yellow-400">
                  {metrics.progress.toFixed(1)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400 text-xs mb-1">RISK SCORE</div>
                  <div className="text-sm font-bold text-red-400">
                    {metrics.riskScore.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">GAS EFFICIENCY</div>
                  <div className="text-sm font-bold text-green-400">
                    {metrics.gasOptimization.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Event Log */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold mb-6 text-white">EVENTS</h2>
            
            <div className="space-y-2 text-sm">
              {events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-green-400 font-mono"
                >
                  • {event}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Portfolio Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-6 text-white">PORTFOLIO BREAKDOWN</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioData.map((item, index) => (
              <div key={item.protocol} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-bold">
                    {item.protocol} #{String(index).padStart(3, '0')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ALLOCATION {item.allocation.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">APY</span>
                    <span className="text-xs text-green-400">{item.apy.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">RISK</span>
                    <span className="text-xs text-red-400">{item.risk.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">STATUS</span>
                    <span className="text-xs text-blue-400">OPTIMIZED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-6 text-white">SYSTEM STATUS</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {metrics.protocolCount}
              </div>
              <div className="text-xs text-gray-400">PROTOCOLS ACTIVE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {metrics.rebalanceSpeed.toFixed(1)}s
              </div>
              <div className="text-xs text-gray-400">AVG REBALANCE TIME</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                24/7
              </div>
              <div className="text-xs text-gray-400">UPTIME</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {(metrics.gasOptimization / 10).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-400">GAS SAVED (WEI)</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default DashboardPage;
