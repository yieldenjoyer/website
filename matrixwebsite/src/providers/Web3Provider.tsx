import React, { createContext, useContext, useState } from 'react'

// Temporary Web3 context until dependencies are installed
interface Web3ContextType {
  isConnected: boolean
  address?: string
  balance?: string
  chainId?: number
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

const Web3Context = createContext<Web3ContextType | null>(null)

// Mock Web3 provider for development - replace with real implementation
const useWeb3Mock = (): Web3ContextType => {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string>()
  const [balance, setBalance] = useState<string>()
  const [chainId, setChainId] = useState<number>()

  const connect = async () => {
    // Mock connection - replace with real Web3 logic
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      } else {
        // Mock data for demo
        setAddress('0x742d35Cc4Bf4C4c0E0FdE7C13B1D4D6de0Af1234')
        setBalance('1.234')
        setChainId(1)
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(undefined)
    setBalance(undefined)
    setChainId(undefined)
  }

  const switchChain = async (targetChainId: number) => {
    setChainId(targetChainId)
  }

  return {
    isConnected,
    address,
    balance,
    chainId,
    connect,
    disconnect,
    switchChain,
  }
}

interface Web3ProviderProps {
  children: React.ReactNode
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const web3 = useWeb3Mock()

  return <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>
}

// Custom hook for DeFi-specific wallet operations
export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }

  // Add custom DeFi operations
  const defiOperations = {
    async approveToken(tokenAddress: string, spenderAddress: string, amount: string) {
      console.log('Approving token:', { tokenAddress, spenderAddress, amount })
      // TODO: Implement real token approval logic
      return { hash: '0x123...', success: true }
    },

    async getTokenBalance(tokenAddress: string, userAddress: string) {
      console.log('Getting token balance:', { tokenAddress, userAddress })
      // TODO: Implement real balance fetching
      return '1000.0'
    },

    async getYieldData(protocolAddress: string) {
      console.log('Getting yield data:', protocolAddress)
      // TODO: Implement real yield data fetching
      return { apy: 12.5, tvl: 1000000 }
    },

    async executeTransaction(tx: any) {
      console.log('Executing transaction:', tx)
      // TODO: Implement real transaction execution
      return { hash: '0x456...', success: true }
    },
  }

  return {
    ...context,
    ...defiOperations,
  }
}

// Chain configurations for different networks
export const SUPPORTED_CHAINS = {
  mainnet: {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://eth-mainnet.alchemyapi.io/v2/demo'] },
      public: { http: ['https://eth-mainnet.alchemyapi.io/v2/demo'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
    contracts: {
      ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
      ensUniversalResolver: { address: '0xE4Acdd618deED4e6d2f03b9bf62dc6118FC9A4da' },
      multicall3: { address: '0xca11bde05977b3631167028862be2a173976ca11' },
    },
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://polygon-rpc.com'] },
      public: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
    },
    contracts: {
      multicall3: { address: '0xca11bde05977b3631167028862be2a173976ca11' },
    },
  }
}

// Protocol addresses for yield farming
export const PROTOCOL_ADDRESSES = {
  ethereum: {
    aave: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    compound: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    yearn: '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804',
    curve: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
  },
  polygon: {
    quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  }
}
