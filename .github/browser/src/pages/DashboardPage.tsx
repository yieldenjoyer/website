import React from 'react';
import { useStore } from '../store/useStore';

export const DashboardPage: React.FC = () => {
  const { setCurrentPage } = useStore();

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
              onClick={() => setCurrentPage('vaults')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              VAULTS
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
            MATRIX DASHBOARD
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Total Value</h3>
              <p className="text-3xl font-mono text-matrix-green">$127,450</p>
              <p className="text-sm text-matrix-green/60 mt-2">+12.5% 24h</p>
            </div>
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Active Positions</h3>
              <p className="text-3xl font-mono text-matrix-green">8</p>
              <p className="text-sm text-matrix-green/60 mt-2">Across 4 protocols</p>
            </div>
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">APY Average</h3>
              <p className="text-3xl font-mono text-matrix-green">24.7%</p>
              <p className="text-sm text-matrix-green/60 mt-2">Optimized yield</p>
            </div>
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Rewards</h3>
              <p className="text-3xl font-mono text-matrix-green">$2,847</p>
              <p className="text-sm text-matrix-green/60 mt-2">Ready to claim</p>
            </div>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Portfolio Allocation */}
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Portfolio Allocation</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>USDE Staking</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-matrix-green/20 h-2 rounded">
                      <div className="w-20 bg-matrix-green h-2 rounded"></div>
                    </div>
                    <span className="text-sm">62%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pendle PT/YT</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-matrix-green/20 h-2 rounded">
                      <div className="w-12 bg-matrix-green h-2 rounded"></div>
                    </div>
                    <span className="text-sm">38%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-matrix-green/10">
                  <div>
                    <p className="font-bold">Deposit USDE</p>
                    <p className="text-sm text-matrix-green/60">2 hours ago</p>
                  </div>
                  <span className="text-matrix-green">+$5,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-matrix-green/10">
                  <div>
                    <p className="font-bold">Rewards Claimed</p>
                    <p className="text-sm text-matrix-green/60">1 day ago</p>
                  </div>
                  <span className="text-matrix-green">+$127.50</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-bold">PT/YT Split</p>
                    <p className="text-sm text-matrix-green/60">3 days ago</p>
                  </div>
                  <span className="text-matrix-green/60">Strategic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('vaults')}
              className="px-8 py-4 bg-matrix-green text-background-dark font-bold text-lg rounded-lg hover:bg-matrix-green/90 transition-all duration-300"
            >
              EXPLORE VAULTS
            </button>
            <button className="px-8 py-4 border-2 border-matrix-green text-matrix-green font-bold text-lg rounded-lg hover:bg-matrix-green/10 transition-all duration-300">
              OPTIMIZE PORTFOLIO
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
