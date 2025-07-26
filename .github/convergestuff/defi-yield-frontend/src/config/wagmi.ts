import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, arbitrum, polygon, optimism, base } from 'wagmi/chains';

// Get projectId from https://cloud.walletconnect.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id';

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'DeFi Yield Optimizer',
  description: 'Maximize Your Crypto Yields - Real-time yield optimization across Aave, Morpho, Pendle, and more.',
  url: 'https://defi-yield-optimizer.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmiConfig
const chains = [mainnet, arbitrum, polygon, optimism, base] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});
