import React from 'react';
import { useStore } from '../store/useStore';

export const LoginPage: React.FC = () => {
  const { setCurrentPage } = useStore();

  return (
    <div className="min-h-screen bg-background-dark text-matrix-green font-matrix flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-background-dark/50 border border-matrix-green/30 rounded-lg p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-3xl font-bold text-matrix-green hover:text-matrix-green/80 mb-2"
            >
              MATRIX FINANCE
            </button>
            <p className="text-matrix-green/80">Connect your wallet to enter the matrix</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full flex items-center justify-between p-4 bg-background-dark/50 border border-matrix-green/30 rounded-lg hover:border-matrix-green/60 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded"></div>
                <span className="font-bold">MetaMask</span>
              </div>
              <span className="text-matrix-green/60">→</span>
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full flex items-center justify-between p-4 bg-background-dark/50 border border-matrix-green/30 rounded-lg hover:border-matrix-green/60 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded"></div>
                <span className="font-bold">WalletConnect</span>
              </div>
              <span className="text-matrix-green/60">→</span>
            </button>

            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full flex items-center justify-between p-4 bg-background-dark/50 border border-matrix-green/30 rounded-lg hover:border-matrix-green/60 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded"></div>
                <span className="font-bold">Coinbase Wallet</span>
              </div>
              <span className="text-matrix-green/60">→</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-matrix-green/20">
            <p className="text-sm text-matrix-green/60 text-center mb-4">
              Don't have a wallet yet?
            </p>
            <button className="w-full px-4 py-2 border border-matrix-green/30 text-matrix-green/80 rounded-lg hover:border-matrix-green/60 hover:text-matrix-green transition-colors">
              Learn about wallets
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-matrix-green/60 hover:text-matrix-green transition-colors text-sm"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
