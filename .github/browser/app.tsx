import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Slider from './components/Slider';
import './index.css';

const cryptoItems = [
  { id: '0000', title: 'ETH Staking', price: '5.2% APY', desc: 'Stake Ethereum for stable returns.' },
  { id: '0001', title: 'BTC Wrapped', price: '3.8% APY', desc: 'Wrapped Bitcoin for DeFi yield.' },
  { id: '0002', title: 'AAVE Lending', price: '4.5% APY', desc: 'Lend assets on AAVE protocol.' },
  { id: '0003', title: 'Uniswap LP', price: '6.1% APY', desc: 'Provide liquidity on Uniswap.' },
  { id: '0004', title: 'NFT Yield', price: '8.0% APY', desc: 'Stake NFTs for unique rewards.' },
  { id: '0005', title: 'Curve Stable', price: '2.9% APY', desc: 'Stablecoin yield on Curve.' },
];

const App: React.FC = () => {
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-inter">
      <header className="container mx-auto py-12 text-center">
        <h1 ref={titleRef} className="text-5xl font-bold mb-4">Crypto Yield Slider</h1>
        <p className="text-xl text-gray-400">Explore DeFi yield opportunities with smooth animations.</p>
      </header>
      <main className="container mx-auto px-4">
        <Slider items={cryptoItems} />
        <section className="py-12">
          <h2 className="text-3xl font-bold mb-8">Configure Your Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold">CSS Styling</h3>
              <p className="text-gray-400">Style slides with full CSS control for sizes and offsets.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Infinite Loop</h3>
              <p className="text-gray-400">Seamlessly loop through crypto strategies or set endpoints.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Snapping</h3>
              <p className="text-gray-400">Enable self-centering slides or free dragging.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Drag Speed</h3>
              <p className="text-gray-400">Adjust drag sensitivity for trackpad and mouse.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Smooth Lerping</h3>
              <p className="text-gray-400">Settle slides smoothly across different refresh rates.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Extensible API</h3>
              <p className="text-gray-400">Extend functionality with a clean event API.</p>
            </div>
          </div>
        </section>
        <section className="py-12">
          <h2 className="text-3xl font-bold mb-8">WebGL & Framework Support</h2>
          <p className="text-gray-400 mb-6">Built to work with modern frameworks and WebGL animations.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold">Vanilla JS</h3>
              <p className="text-gray-400">Pure JavaScript and TypeScript compatibility.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Framework Agnostic</h3>
              <p className="text-gray-400">Works with React, Vue, and more.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold">Webflow Ready</h3>
              <p className="text-gray-400">Easily integrate with Webflow projects.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-12 text-center text-gray-400">
        <p>Open source. <a href="https://github.com" className="text-blue-500 hover:underline">Contribute on GitHub</a>.</p>
        <p>© 2025 Crypto Slider. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;