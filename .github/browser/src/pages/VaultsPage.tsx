import React from 'react';
import { useStore } from '../store/useStore';

export const VaultsPage: React.FC = () => {
  const { setCurrentPage } = useStore();

  const vaults = [
    {
      name: 'USDE Staking Vault',
      apy: '28.4%',
      tvl: '$45.2M',
      risk: 'Low',
      description: 'Automated USDE staking with compound rewards'
    },
    {
      name: 'PT/YT Strategy Vault',
      apy: '34.7%',
      tvl: '$23.8M',
      risk: 'Medium',
      description: 'Advanced Pendle PT/YT split strategy'
    },
    {
      name: 'Multi-Asset Looper',
      apy: '41.2%',
      tvl: '$12.5M',
      risk: 'High',
      description: 'Multi-protocol yield farming with leverage'
    }
  ];

  return (
    <div className="min-h-screen bg-background-dark text-matrix-green font-matrix">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-background-dark/90 backdrop-blur-sm border-b border-matrix-green/20">
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentPage('home')}
            className="text-2xl font-bold text-matrix-green hover:text-matrix-green/80"
          >
            MATRIX FINANCE
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              HOME
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              DASHBOARD
            </button>
            <button
              onClick={() => setCurrentPage('faq')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              FAQ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 p-6">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-matrix-green">
            YIELD VAULTS
          </h1>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Total TVL</h3>
              <p className="text-3xl font-mono text-matrix-green">$81.5M</p>
              <p className="text-sm text-matrix-green/60 mt-2">Across all vaults</p>
            </div>
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Average APY</h3>
              <p className="text-3xl font-mono text-matrix-green">34.8%</p>
              <p className="text-sm text-matrix-green/60 mt-2">Weighted average</p>
            </div>
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Active Depositors</h3>
              <p className="text-3xl font-mono text-matrix-green">2,847</p>
              <p className="text-sm text-matrix-green/60 mt-2">Growing community</p>
            </div>
          </div>

          {/* Vault Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {vaults.map((vault, index) => (
              <div
                key={index}
                className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 hover:border-matrix-green/60 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{vault.name}</h3>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    vault.risk === 'Low' ? 'bg-green-900/30 text-green-400' :
                    vault.risk === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {vault.risk}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-matrix-green/60">APY:</span>
                    <span className="font-bold text-matrix-green">{vault.apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-green/60">TVL:</span>
                    <span className="font-bold">{vault.tvl}</span>
                  </div>
                </div>

                <p className="text-sm text-matrix-green/80 mb-6">
                  {vault.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="flex-1 px-4 py-2 bg-matrix-green text-background-dark font-bold rounded hover:bg-matrix-green/90 transition-colors"
                  >
                    DEPOSIT
                  </button>
                  <button className="px-4 py-2 border border-matrix-green text-matrix-green font-bold rounded hover:bg-matrix-green/10 transition-colors">
                    INFO
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-6 text-matrix-green">
              START EARNING TODAY
            </h2>
            <p className="text-lg text-matrix-green/80 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are maximizing their yields with our AI-optimized strategies.
            </p>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-8 py-4 bg-matrix-green text-background-dark font-bold text-lg rounded-lg hover:bg-matrix-green/90 transition-all duration-300 transform hover:scale-105"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VaultsPage;
