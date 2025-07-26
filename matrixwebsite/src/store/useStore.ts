import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface AppState {
  // Navigation
  currentPage: 'home' | 'dashboard' | 'vaults' | 'faq' | 'login'
  setCurrentPage: (page: AppState['currentPage']) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Theme and UI
  theme: 'matrix' | 'cyber' | 'dark'
  setTheme: (theme: AppState['theme']) => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  
  // User data
  user: {
    address?: string
    balance?: string
    portfolioValue?: number
    isConnected: boolean
  }
  setUser: (user: Partial<AppState['user']>) => void
  
  // DeFi data
  yieldData: {
    totalYield: number
    apy: number
    protocols: Array<{
      name: string
      apy: number
      tvl: number
      risk: 'low' | 'medium' | 'high'
    }>
  }
  setYieldData: (data: Partial<AppState['yieldData']>) => void
  
  // Real-time data streams
  matrixData: {
    transactions: Array<{
      hash: string
      amount: string
      type: 'deposit' | 'withdraw' | 'yield'
      timestamp: number
    }>
    networkActivity: {
      gasPrice: number
      blockNumber: number
      pendingTxs: number
    }
  }
  setMatrixData: (data: Partial<AppState['matrixData']>) => void
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error' | 'yield' | 'transaction'
    message: string
    timestamp: number
    data?: any
  }>
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Navigation
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // Loading states
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Theme and UI
      theme: 'matrix',
      setTheme: (theme) => set({ theme }),
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      // User data
      user: {
        isConnected: false,
      },
      setUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      // DeFi data
      yieldData: {
        totalYield: 0,
        apy: 0,
        protocols: []
      },
      setYieldData: (data) => set((state) => ({
        yieldData: { ...state.yieldData, ...data }
      })),
      
      // Real-time data streams
      matrixData: {
        transactions: [],
        networkActivity: {
          gasPrice: 0,
          blockNumber: 0,
          pendingTxs: 0
        }
      },
      setMatrixData: (data) => set((state) => ({
        matrixData: { ...state.matrixData, ...data }
      })),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const timestamp = Date.now()
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }]
        }))
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id)
        }, 5000)
      },
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'polybets-store',
    }
  )
)

// Utility hooks
export const useCurrentPage = () => useStore((state) => state.currentPage)
export const useSetCurrentPage = () => useStore((state) => state.setCurrentPage)
export const useTheme = () => useStore((state) => state.theme)
export const useUser = () => useStore((state) => state.user)
export const useYieldData = () => useStore((state) => state.yieldData)
export const useMatrixData = () => useStore((state) => state.matrixData)
export const useNotifications = () => useStore((state) => state.notifications)
