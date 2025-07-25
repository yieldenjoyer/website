import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAccount, useEnsName } from 'wagmi';
import { ConnectButton } from '@web3modal/react';

const Navbar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#0e0e0e] p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold">DeFi Yield</div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        <div className={`md:flex items-center space-x-4 ${isOpen ? 'block' : 'hidden'} md:block`}>
          <NavLink to="/" className="hover:text-blue-500 transition">Home</NavLink>
          <NavLink to="/dashboard" className="hover:text-blue-500 transition">Dashboard</NavLink>
          <NavLink to="/faq" className="hover:text-blue-500 transition">FAQ</NavLink>
          <NavLink to="/login" className="hover:text-blue-500 transition">Login</NavLink>
          <div className="mt-2 md:mt-0">
            {isConnected ? (
              <span className="text-sm text-blue-500">{ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;