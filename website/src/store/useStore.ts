import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  address: string;
  ensName?: string;
  isConnected: boolean;
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
  matrixEffects: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setMatrixEffects: (enabled: boolean) => void;
  connectWallet: (address: string, ensName?: string) => void;
  disconnectWallet: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      theme: 'dark',
      matrixEffects: true,
      
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setTheme: (theme) => set({ theme }),
      setMatrixEffects: (matrixEffects) => set({ matrixEffects }),
      
      connectWallet: (address, ensName) => set({ 
        user: { address, ensName, isConnected: true } 
      }),
      
      disconnectWallet: () => set({ user: null }),
    }),
    {
      name: 'polybets-storage',
      partialize: (state) => ({ user: state.user, theme: state.theme }),
    }
  )
);
