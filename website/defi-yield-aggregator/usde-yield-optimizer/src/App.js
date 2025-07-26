import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import YieldOptimizer from './components/YieldOptimizer';
import './index.css';

// Mock Dashboard component
const Dashboard = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Dashboard
      </h1>
      <div className="card">
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your DeFi dashboard. Navigate to the Yield Optimizer to start earning yield on your USDe/sUSDe tokens.
        </p>
        <div className="mt-6">
          <Link to="/yield" className="btn-primary">
            Go to Yield Optimizer
          </Link>
        </div>
      </div>
    </div>
  </div>
);

// Mock Pools component
const Pools = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Liquidity Pools
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            USDe/ETH Pool
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Provide liquidity to earn trading fees and rewards
          </p>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">APY</span>
            <span className="text-green-600 font-semibold">24.5%</span>
          </div>
          <button className="btn-primary w-full">Add Liquidity</button>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            sUSDe/USDe Pool
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Provide liquidity to earn trading fees and rewards
          </p>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">APY</span>
            <span className="text-green-600 font-semibold">19.8%</span>
          </div>
          <button className="btn-primary w-full">Add Liquidity</button>
        </div>
      </div>
    </div>
  </div>
);

// Mock Governance component
const Governance = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Governance
      </h1>
      <div className="space-y-6">
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Proposal #1: Increase USDe Vault Allocation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Increase the maximum allocation to USDe staking strategies from 70% to 85%
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">For: 85%</span>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Against: 15%</span>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{width: '15%'}}></div>
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button className="btn-secondary">Vote For</button>
            <button className="btn-outline">Vote Against</button>
          </div>
        </div>
        
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Proposal #2: New Strategy Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add Pendle PT/YT strategy integration for enhanced yield opportunities
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Pending
            </span>
          </div>
          <button className="btn-outline" disabled>
            Voting starts in 2 days
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Navigation component
const Navigation = () => (
  <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex space-x-8">
          <Link 
            to="/" 
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/pools" 
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Pools
          </Link>
          <Link 
            to="/governance" 
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Governance
          </Link>
          <Link 
            to="/yield" 
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b-2 border-primary-600"
          >
            Yield Optimizer
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

// Home component
const Home = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          USDe/sUSDe Yield Optimization Engine
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Maximize your DeFi yields with AI-powered strategies, automated rebalancing, 
          and institutional-grade risk management for USDe and sUSDe tokens.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="card text-center">
          <div className="text-3xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Optimized Strategies
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered portfolio optimization using machine learning algorithms to maximize your yield potential.
          </p>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Auto-Rebalancing
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Automated rebalancing based on market conditions and risk parameters to maintain optimal allocations.
          </p>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Risk Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced risk assessment using Sharpe ratios and real-time monitoring for safer investing.
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <Link to="/yield" className="btn-primary text-lg px-8 py-3">
          Start Optimizing →
        </Link>
      </div>
    </div>
  </div>
);

// Main App component
const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pools" element={<Pools />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/yield" element={<YieldOptimizer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                © 2025 USDe Yield Optimizer. Built with React, Tailwind CSS, and ethers.js
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
