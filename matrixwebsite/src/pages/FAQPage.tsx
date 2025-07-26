import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const FAQPage: React.FC = () => {
  const { setCurrentPage } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What is Matrix Finance?',
      answer: 'Matrix Finance is an advanced DeFi yield optimization platform that uses AI-powered algorithms to maximize your returns across multiple protocols including USDE staking and Pendle PT/YT strategies.'
    },
    {
      question: 'How does the yield optimization work?',
      answer: 'Our quantum-optimized algorithms continuously monitor yield opportunities across DeFi protocols, automatically rebalancing your portfolio to capture the highest returns while managing risk through diversification.'
    },
    {
      question: 'What are the risks involved?',
      answer: 'All DeFi investments carry smart contract risks, market volatility, and protocol-specific risks. We categorize our vaults by risk level (Low, Medium, High) and implement multiple security measures including audited contracts and risk management algorithms.'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply connect your wallet, choose a vault that matches your risk tolerance, and deposit your assets. Our system will automatically optimize your yields. You can withdraw your funds at any time.'
    },
    {
      question: 'What fees do you charge?',
      answer: 'We charge a performance fee of 10% on profits generated. There are no management fees or deposit/withdrawal fees. You only pay when we make you money.'
    },
    {
      question: 'Is my money safe?',
      answer: 'Security is our top priority. All contracts are audited by leading security firms, we use multi-signature wallets, and implement time-locked upgrades. However, DeFi always carries inherent risks.'
    },
    {
      question: 'Can I withdraw anytime?',
      answer: 'Yes, you can withdraw your funds at any time. Some strategies may have small delays for optimal execution, but your funds are never locked for extended periods.'
    },
    {
      question: 'What wallets are supported?',
      answer: 'We support all major Ethereum wallets including MetaMask, WalletConnect, Coinbase Wallet, and hardware wallets like Ledger and Trezor.'
    }
  ];

  return (
    <div className="min-h-screen bg-background-dark text-matrix-green font-matrix">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-background-dark/90 backdrop-blur-sm border-b border-matrix-green/20">
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentPage('home')}
            className="text-2xl font-bold text-matrix-green hover:text-matrix-green/80"
          >
            MATRIX FINANCE
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="px-4 py-2 text-matrix-green hover:bg-matrix-green/10 rounded"
            >
              HOME
            </button>
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center text-matrix-green">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          
          <p className="text-lg text-matrix-green/80 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to know about Matrix Finance and our yield optimization strategies.
          </p>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-background-dark/50 border border-matrix-green/30 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-matrix-green/5 transition-colors"
                >
                  <h3 className="text-lg font-bold text-matrix-green">
                    {faq.question}
                  </h3>
                  <span className="text-2xl text-matrix-green transition-transform duration-300" style={{
                    transform: openFaq === index ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}>
                    +
                  </span>
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-matrix-green/80 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 text-center bg-background-dark/50 border border-matrix-green/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-matrix-green">
              Still Have Questions?
            </h2>
            <p className="text-matrix-green/80 mb-6">
              Our team is here to help. Join our community or reach out directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-matrix-green text-background-dark font-bold rounded-lg hover:bg-matrix-green/90 transition-colors">
                JOIN DISCORD
              </button>
              <button className="px-6 py-3 border border-matrix-green text-matrix-green font-bold rounded-lg hover:bg-matrix-green/10 transition-colors">
                READ DOCS
              </button>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <h2 className="text-3xl font-bold mb-6 text-matrix-green">
              READY TO START?
            </h2>
            <button
              onClick={() => setCurrentPage('vaults')}
              className="px-8 py-4 bg-matrix-green text-background-dark font-bold text-lg rounded-lg hover:bg-matrix-green/90 transition-all duration-300 transform hover:scale-105"
            >
              EXPLORE VAULTS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;
