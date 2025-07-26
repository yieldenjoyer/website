import { useState } from 'react';
import { TrendingUp, DollarSign, PieChart, Activity, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const [selectedTab, setSelectedTab] = useState('positions');

  const tabs = [
    { id: 'positions', label: 'Your Positions', icon: PieChart },
    { id: 'strategies', label: 'Strategies', icon: TrendingUp },
    { id: 'snapshots', label: 'Latest Snapshots', icon: Activity },
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Monitor your DeFi positions and optimize your yields</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-dark-800/50 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-cyber-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                  <p className="text-gray-400">
                    Dashboard features are currently in development. Connect your wallet to get started.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-white font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h Change</span>
                  <span className="text-mint-400 font-semibold">+0.00%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Positions</span>
                  <span className="text-white font-semibold">0</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn-primary text-sm py-2">
                  Connect Wallet
                </button>
                <button className="w-full btn-secondary text-sm py-2">
                  View Strategies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
