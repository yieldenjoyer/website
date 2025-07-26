import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@web3modal/react';
import { useEffect } from 'react';

const Login: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { signMessage, data: signature } = useSignMessage();

  useEffect(() => {
    if (isConnected && address) {
      signMessage({ message: `Login to DeFi Yield Optimizer: ${address}` });
    }
  }, [isConnected, address, signMessage]);

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-8">Connect Your Wallet</h1>
      <p className="text-gray-400 mb-6">Use your wallet to securely log in to the platform.</p>
      <ConnectButton />
      {isConnected && (
        <div className="mt-6">
          <p>Connected Address: <span className="text-blue-500">{address}</span></p>
          {signature && <p>Signature: <span className="text-blue-500">{signature.slice(0, 10)}...</span></p>}
        </div>
      )}
    </div>
  );
};

export default Login;