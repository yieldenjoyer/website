import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ethers } from 'ethers';

const YieldEngine = () => {
  const [vaultType, setVaultType] = useState('Conservative');
  const [apy, setApy] = useState('Loading...');
  const [allocations, setAllocations] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [account, setAccount] = useState(null);

  const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      setAccount(await signer.getAddress());
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    axios.get(`http://localhost:5000/api/optimize?type=${vaultType}`)
      .then(response => {
        setApy(response.data.apy);
        setAllocations(response.data.allocations);
      })
      .catch(error => setApy('Error'));
  }, [vaultType]);

  const deposit = async () => {
    if (!account) return alert('Connect wallet!');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract('VAULT_ADDRESS', abi, signer);
    await contract.deposit(ethers.utils.parseEther(depositAmount));
    alert('Deposited!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">USDe/sUSDe Yield Optimization Engine</h1>
      <button onClick={connectWallet} className="mb-4 bg-blue-600 p-2 rounded">
        {account ? `Connected: ${account.slice(0, 6)}...` : 'Connect Wallet'}
      </button>
      <select value={vaultType} onChange={(e) => setVaultType(e.target.value)} className="mb-4 p-2 bg-gray-800 rounded">
        <option>Conservative</option>
        <option>Balanced</option>
        <option>Aggressive</option>
      </select>
      <p>APY: {apy}</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={allocations} dataKey="value">
            {allocations.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Deposit Amount" className="mt-4 p-2 bg-gray-800 rounded" />
      <button onClick={deposit} className="mt-2 bg-green-600 p-2 rounded">Deposit</button>
    </div>
  );
};

export default YieldEngine;
