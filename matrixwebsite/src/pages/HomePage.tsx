import React from 'react';
import { useStore } from '../store/useStore';

export const HomePage: React.FC = () => {
  const { setCurrentPage } = useStore();

  return (
    <div className="min-h-screen bg-background-dark text-matrix-green font-matrix relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-background-dark/90 backdrop-blur-sm border-b border-matrix-green/20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-matrix-green">MATRIX FINANCE</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              DASHBOARD
            </button>
            <button
              onClick={() => setCurrentPage('vaults')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              VAULTS
            </button>
            <button
              onClick={() => setCurrentPage('faq')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              FAQ
            </button>
          </div>
        </div>
      </nav>
      
      <main className="pt-20 relative">
        {/* Hero Section */}
        <section className="h-screen relative overflow-hidden flex items-center justify-center">
          <div className="text-center px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-7xl font-bold tracking-wider text-matrix-green animate-pulse">
                  MATRIX FINANCE
                </h1>
                <p className="text-lg md:text-2xl text-matrix-green/80 max-w-2xl mx-auto">
                  Enter the financial matrix. Optimize yields across dimensions.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="px-8 py-4 bg-matrix-green text-background-dark font-bold text-lg rounded-lg hover:bg-matrix-green/90 transition-all duration-300 transform hover:scale-105"
                >
                  ENTER MATRIX
                </button>
                <button
                  onClick={() => setCurrentPage('vaults')}
                  className="px-8 py-4 border-2 border-matrix-green text-matrix-green font-bold text-lg rounded-lg hover:bg-matrix-green/10 transition-all duration-300"
                >
                  EXPLORE VAULTS
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-matrix-green">
              MATRIX FEATURES
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 border border-matrix-green/30 rounded-lg bg-background-dark/50 backdrop-blur-sm hover:border-matrix-green/60 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 border-2 border-matrix-green rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Lightning Fast</h3>
                <p className="text-matrix-green/80 text-center">
                  Execute trades at the speed of thought with our quantum-optimized algorithms.
                </p>
              </div>
              
              <div className="p-8 border border-matrix-green/30 rounded-lg bg-background-dark/50 backdrop-blur-sm hover:border-matrix-green/60 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 border-2 border-matrix-green rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Quantum Secure</h3>
                <p className="text-matrix-green/80 text-center">
                  Your assets are protected by military-grade encryption and smart contracts.
                </p>
              </div>
              
              <div className="p-8 border border-matrix-green/30 rounded-lg bg-background-dark/50 backdrop-blur-sm hover:border-matrix-green/60 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 border-2 border-matrix-green rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Maximum Yield</h3>
                <p className="text-matrix-green/80 text-center">
                  Our AI continuously optimizes your portfolio for maximum returns.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
