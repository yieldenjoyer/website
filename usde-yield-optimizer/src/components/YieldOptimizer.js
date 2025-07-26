import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import useStore from '../stores/useStore';

const YieldOptimizer = () => {
  const {
    account,
    isConnected,
    portfolio,
    selectedVault,
    isLoading,
    theme,
    setAccount,
    setProvider,
    updatePortfolio,
    setSelectedVault,
    setLoading,
    toggleTheme,
    getVaultData
  } = useStore();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');

  // Contract configuration
  const contractAddress = '0x1234567890123456789012345678901234567890'; // Replace with deployed USDEYieldVault
  const abi = [
    'function deposit(uint256 amount) external',
    'function withdraw(uint256 amount) external',
    'function getAPY() external view returns (uint256)',
    'function getRiskScore() external view returns (uint256)',
    'function userBalances(address) external view returns (uint256)'
  ];

  // Mock historical data for performance chart
  const performanceData = [
    { month: 'Jan', apy: 15.2 },
    { month: 'Feb', apy: 16.8 },
    { month: 'Mar', apy: 18.1 },
    { month: 'Apr', apy: 19.5 },
    { month: 'May', apy: 21.2 },
    { month: 'Jun', apy: 22.8 },
  ];

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        setProvider(provider);
        setTransactionStatus('Wallet connected successfully!');
        
        // Fetch initial portfolio data
        await fetchPortfolioData();
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setTransactionStatus('Failed to connect wallet');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls to your backend
      // const response = await fetch(`/api/strategies?type=${selectedVault}&address=${account}`);
      // const data = await response.json();
      
      // For now, use mock data based on vault type
      const vaultData = getVaultData(selectedVault);
      
      updatePortfolio({
        balance: 1234.56, // Mock balance
        totalDeposited: 1000,
        totalEarned: 234.56,
        apy: vaultData.apy,
        riskScore: vaultData.riskScore,
        allocations: vaultData.allocations
      });
      
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setTransactionStatus('Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isConnected || !depositAmount) return;
    
    try {
      setLoading(true);
      setTransactionStatus('Processing deposit...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const amount = ethers.utils.parseEther(depositAmount);
      const tx = await contract.deposit(amount);
      
      setTransactionStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTransactionStatus('Deposit successful!');
      setDepositAmount('');
      
      // Refresh portfolio data
      await fetchPortfolioData();
      
    } catch (error) {
      console.error('Error depositing:', error);
      setTransactionStatus('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !withdrawAmount) return;
    
    try {
      setLoading(true);
      setTransactionStatus('Processing withdrawal...');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const amount = ethers.utils.parseEther(withdrawAmount);
      const tx = await contract.withdraw(amount);
      
      setTransactionStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTransactionStatus('Withdrawal successful!');
      setWithdrawAmount('');
      
      // Refresh portfolio data
      await fetchPortfolioData();
      
    } catch (error) {
      console.error('Error withdrawing:', error);
      setTransactionStatus('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVaultChange = (vault) => {
    setSelectedVault(vault);
    if (isConnected) {
      fetchPortfolioData();
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      fetchPortfolioData();
    }
  }, [selectedVault, account, isConnected]);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">
                USDe/sUSDe Yield Optimizer
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              {/* Wallet Connection */}
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : isConnected ? (
                  `${account?.slice(0, 6)}...${account?.slice(-4)}`
                ) : (
                  'Connect Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vault Selection */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Vault Strategy
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Conservative', 'Balanced', 'Aggressive', 'Custom'].map((vault) => {
              const vaultData = getVaultData(vault);
              return (
                <button
                  key={vault}
                  onClick={() => handleVaultChange(vault)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedVault === vault
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {vault}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      APY: {vaultData.apy}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Risk Score: {vaultData.riskScore}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="metric-card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Balance
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${portfolio.balance.toFixed(2)}
            </p>
          </div>
          
          <div className="metric-card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Current APY
            </h3>
            <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
              {portfolio.apy}
            </p>
          </div>
          
          <div className="metric-card">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Earned
            </h3>
            <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
              ${portfolio.totalEarned.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strategy Allocations */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Strategy Allocations
              </h2>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolio.allocations}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {portfolio.allocations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                APY Performance
              </h2>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="apy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Deposit/Withdraw Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Deposit */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Deposit to Vault
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (USDe)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <button
                onClick={handleDeposit}
                disabled={!isConnected || !depositAmount || isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Deposit'}
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Withdraw from Vault
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (USDe)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <button
                onClick={handleWithdraw}
                disabled={!isConnected || !withdrawAmount || isLoading}
                className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {transactionStatus && (
          <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-center">
              {transactionStatus}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default YieldOptimizer;
