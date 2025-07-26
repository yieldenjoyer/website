import { create } from 'zustand';

const useStore = create((set, get) => ({
  // User wallet state
  account: null,
  isConnected: false,
  provider: null,
  
  // Portfolio data
  portfolio: {
    balance: 0,
    apy: 'Loading...',
    allocations: [],
    totalDeposited: 0,
    totalEarned: 0,
    riskScore: 0,
  },
  
  // Vault selection
  selectedVault: 'Conservative',
  
  // UI state
  isLoading: false,
  theme: 'dark',
  
  // Actions
  setAccount: (account) => set({ account, isConnected: !!account }),
  setProvider: (provider) => set({ provider }),
  
  updatePortfolio: (portfolioData) => set({ 
    portfolio: { ...get().portfolio, ...portfolioData } 
  }),
  
  setSelectedVault: (vault) => set({ selectedVault: vault }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'dark' ? 'light' : 'dark' 
  })),
  
  // Mock data functions for different vault types
  getVaultData: (vaultType) => {
    const vaultConfigs = {
      Conservative: {
        apy: '18.5%',
        riskScore: 1.2,
        allocations: [
          { name: 'sUSDe Staking', value: 90, color: '#00C49F' },
          { name: 'Strata Leverage', value: 10, color: '#FF8042' },
        ]
      },
      Balanced: {
        apy: '22.3%',
        riskScore: 1.8,
        allocations: [
          { name: 'sUSDe', value: 40, color: '#00C49F' },
          { name: 'Strata Leverage', value: 35, color: '#FF8042' },
          { name: 'Other Strategies', value: 25, color: '#FFBB28' },
        ]
      },
      Aggressive: {
        apy: '28.7%',
        riskScore: 2.5,
        allocations: [
          { name: 'Leveraged Strategies', value: 60, color: '#FF8042' },
          { name: 'High-Yield Farming', value: 40, color: '#FFBB28' },
        ]
      },
      Custom: {
        apy: '25.1%',
        riskScore: 2.0,
        allocations: [
          { name: 'Custom Strategy 1', value: 50, color: '#8884d8' },
          { name: 'Custom Strategy 2', value: 30, color: '#82ca9d' },
          { name: 'Custom Strategy 3', value: 20, color: '#ffc658' },
        ]
      }
    };
    
    return vaultConfigs[vaultType] || vaultConfigs.Conservative;
  },
}));

export default useStore;
