import React, { useState } from 'react';

const VaultsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('apy');

  const tokenCategories = [
    {
      name: 'Stablecoins',
      id: 'stablecoins',
      tokens: ['USDC', 'USDT', 'DAI', 'USDS', 'USDe'],
      maxApy: '26.30%',
      color: 'text-green-600'
    },
    {
      name: 'ETH',
      id: 'eth',
      tokens: ['WETH', 'ETH', 'stETH', 'wstETH', 'rETH'],
      maxApy: '19.59%',
      color: 'text-blue-600'
    },
    {
      name: 'BTC',
      id: 'btc',
      tokens: ['WBTC', 'LBTC', 'tBTC', 'cbBTC', 'BTCB'],
      maxApy: '3.12%',
      color: 'text-orange-600'
    }
  ];

  const vaultOpportunities = [
    {
      id: 1,
      protocol: 'Aave V3',
      asset: 'USDC',
      tvl: '$43.64M',
      apy: '22.58%',
      apyChange: '+2.1%',
      risk: 'Low',
      chain: 'Ethereum',
      verified: true,
      description: 'Optimized USDC lending with automated yield farming'
    },
    {
      id: 2,
      protocol: 'Compound V3',
      asset: 'USDT',
      tvl: '$13.61M',
      apy: '19.80%',
      apyChange: '+1.5%',
      risk: 'Low',
      chain: 'BSC',
      verified: true,
      description: 'High-yield USDT strategy with risk management'
    },
    {
      id: 3,
      protocol: 'Yearn Finance',
      asset: 'DAI',
      tvl: '$9.16M',
      apy: '13.77%',
      apyChange: '+0.8%',
      risk: 'Medium',
      chain: 'Ethereum',
      verified: true,
      description: 'Multi-protocol DAI yield optimization'
    },
    {
      id: 4,
      protocol: 'Curve Finance',
      asset: 'WETH',
      tvl: '$30.68M',
      apy: '12.38%',
      apyChange: '+3.2%',
      risk: 'Medium',
      chain: 'Ethereum',
      verified: true,
      description: 'ETH liquid staking rewards with LP tokens'
    },
    {
      id: 5,
      protocol: 'Convex Finance',
      asset: 'WBTC',
      tvl: '$12.49M',
      apy: '12.09%',
      apyChange: '-0.3%',
      risk: 'High',
      chain: 'Ethereum',
      verified: true,
      description: 'Bitcoin yield farming with boosted rewards'
    },
    {
      id: 6,
      protocol: 'Beefy Finance',
      asset: 'USDe',
      tvl: '$5.74M',
      apy: '11.69%',
      apyChange: '+4.1%',
      risk: 'Medium',
      chain: 'Arbitrum',
      verified: true,
      description: 'Ethena USDe auto-compounding strategy'
    }
  ];

  const filteredVaults = vaultOpportunities.filter(vault => {
    const matchesSearch = vault.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vault.asset.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    const category = tokenCategories.find(cat => cat.id === selectedCategory);
    const matchesCategory = category?.tokens.some(token => 
      vault.asset.toLowerCase().includes(token.toLowerCase())
    );
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'apy') return parseFloat(b.apy) - parseFloat(a.apy);
    if (sortBy === 'tvl') return parseFloat(b.tvl.replace(/[$M]/g, '')) - parseFloat(a.tvl.replace(/[$M]/g, ''));
    return 0;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-gray-900">
              The best yields from 25+ protocols
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              500+ yield strategies on stablecoins, ETH, BTC, and more...
            </p>
          </div>
        </div>
      </section>

      {/* Token Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {tokenCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {category.tokens.map((token) => (
                      <span
                        key={token}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <div className="text-sm text-gray-500">up to</div>
                    <div className={`text-3xl font-bold ${category.color}`}>
                      {category.maxApy}
                    </div>
                  </div>
                  
                  <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium">
                    Explore {category.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search protocols or assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full md:w-80"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="stablecoins">Stablecoins</option>
                  <option value="eth">ETH</option>
                  <option value="btc">BTC</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                >
                  <option value="apy">Highest APY</option>
                  <option value="tvl">Highest TVL</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vault Opportunities */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-4">
            {filteredVaults.map((vault) => (
              <div
                key={vault.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">{vault.asset}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{vault.protocol}</h3>
                        <p className="text-sm text-gray-600">{vault.description}</p>
                      </div>
                      {vault.verified && (
                        <span className="text-green-600 text-lg">🛡️</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Chain: <span className="font-medium text-gray-900">{vault.chain}</span></span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(vault.risk)}`}>
                        {vault.risk} Risk
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">TVL</div>
                      <div className="text-xl font-bold text-gray-900">{vault.tvl}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-500">APY (7d)</div>
                      <div className="text-xl font-bold text-green-600">{vault.apy}</div>
                      <div className={`text-xs ${vault.apyChange.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {vault.apyChange}
                      </div>
                    </div>
                    
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 group-hover:bg-gray-800">
                      Enter Vault
                      <span className="text-sm">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredVaults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No vaults found matching your criteria</div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-4 text-gray-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default VaultsPage;
