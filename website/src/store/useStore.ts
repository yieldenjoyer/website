import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface YieldData {
  protocol: string
  apy: number
  tvl: number
  risk: 'low' | 'medium' | 'high'
  chain: string
  token: string
}

export interface Portfolio {
  totalValue: number
  totalYield: number
  positions: Array<{
    id: string
    protocol: string
    amount: number
    apy: number
    value: number
    token: string
  }>
}

interface AppState {
  // UI State
  theme: 'dark' | 'matrix'
  sidebarOpen: boolean
  isLoading: boolean
  
  // Data State
  yieldData: YieldData[]
  portfolio: Portfolio
  
  // Real-time data
  prices: Record<string, number>
  totalSupply: number
  activeUsers: number
  
  // Actions
  setTheme: (theme: 'dark' | 'matrix') => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  updateYieldData: (data: YieldData[]) => void
  updatePortfolio: (portfolio: Portfolio) => void
  updatePrices: (prices: Record<string, number>) => void
  updateMetrics: (metrics: { totalSupply: number; activeUsers: number }) => void
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial UI State
    theme: 'matrix',
    sidebarOpen: false,
    isLoading: false,
    
    // Initial Data State
    yieldData: [
      {
        protocol: 'Aave V3',
        apy: 4.2,
        tvl: 12500000,
        risk: 'low',
        chain: 'Ethereum',
        token: 'USDC'
      },
      {
        protocol: 'Compound',
        apy: 3.8,
        tvl: 8200000,
        risk: 'low',
        chain: 'Ethereum',
        token: 'DAI'
      },
      {
        protocol: 'Yearn Finance',
        apy: 7.5,
        tvl: 4800000,
        risk: 'medium',
        chain: 'Ethereum',
        token: 'USDT'
      },
      {
        protocol: 'Convex',
        apy: 12.3,
        tvl: 2100000,
        risk: 'high',
        chain: 'Ethereum',
        token: 'CRV'
      },
      {
        protocol: 'Pendle',
        apy: 15.7,
        tvl: 1800000,
        risk: 'high',
        chain: 'Arbitrum',
        token: 'PT-eETH'
      }
    ],
    
    portfolio: {
      totalValue: 125000,
      totalYield: 8750,
      positions: [
        {
          id: '1',
          protocol: 'Aave V3',
          amount: 50000,
          apy: 4.2,
          value: 52100,
          token: 'USDC'
        },
        {
          id: '2',
          protocol: 'Yearn Finance',
          amount: 30000,
          apy: 7.5,
          value: 32250,
          token: 'USDT'
        },
        {
          id: '3',
          protocol: 'Pendle',
          amount: 25000,
          apy: 15.7,
          value: 28925,
          token: 'PT-eETH'
        }
      ]
    },
    
    // Real-time data
    prices: {
      ETH: 2340.50,
      BTC: 43250.00,
      USDC: 1.00,
      USDT: 0.999,
      DAI: 1.001
    },
    totalSupply: 1250000000,
    activeUsers: 15420,
    
    // Actions
    setTheme: (theme) => set({ theme }),
    
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    
    setIsLoading: (isLoading) => set({ isLoading }),
    
    updateYieldData: (yieldData) => set({ yieldData }),
    
    updatePortfolio: (portfolio) => set({ portfolio }),
    
    updatePrices: (prices) => set((state) => ({
      prices: { ...state.prices, ...prices }
    })),
    
    updateMetrics: (metrics) => set(metrics)
  }))
)

// Selectors for better performance
export const useTheme = () => useStore(state => state.theme)
export const useSidebarOpen = () => useStore(state => state.sidebarOpen)
export const useIsLoading = () => useStore(state => state.isLoading)
export const useYieldData = () => useStore(state => state.yieldData)
export const usePortfolio = () => useStore(state => state.portfolio)
export const usePrices = () => useStore(state => state.prices)
export const useMetrics = () => useStore(state => ({
  totalSupply: state.totalSupply,
  activeUsers: state.activeUsers
}))

// Real-time data simulation
if (typeof window !== 'undefined') {
  // Simulate price updates
  setInterval(() => {
    const { updatePrices, prices } = useStore.getState()
    const newPrices = { ...prices }
    
    Object.keys(newPrices).forEach(symbol => {
      const currentPrice = newPrices[symbol]
      const change = (Math.random() - 0.5) * 0.02 // ±1% change
      newPrices[symbol] = Math.max(0, currentPrice * (1 + change))
    })
    
    updatePrices(newPrices)
  }, 5000) // Update every 5 seconds
  
  // Simulate metrics updates
  setInterval(() => {
    const { updateMetrics, totalSupply, activeUsers } = useStore.getState()
    
    updateMetrics({
      totalSupply: totalSupply + Math.floor(Math.random() * 1000),
      activeUsers: activeUsers + Math.floor(Math.random() * 10) - 5
    })
  }, 10000) // Update every 10 seconds
}
