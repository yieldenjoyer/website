import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    {
      question: 'How does wallet-based login work?',
      answer: 'Our platform uses Web3 wallet authentication, which means you connect your crypto wallet (like MetaMask, WalletConnect, or Coinbase Wallet) to access the platform. This eliminates the need for traditional email/password registration and provides secure, decentralized authentication.',
    },
    {
      question: 'What is PT/YT looping?',
      answer: 'PT/YT looping refers to Principal Token and Yield Token strategies on platforms like Pendle. This involves splitting yield-bearing assets into their principal and yield components, then using leverage to maximize returns through strategic looping mechanisms.',
    },
    {
      question: 'Is my crypto safe?',
      answer: 'Security is our top priority. We use non-custodial smart contracts, meaning you always maintain control of your funds. Our contracts are audited by leading security firms, and we implement best practices including multi-signature wallets and time-locked upgrades.',
    },
    {
      question: 'What are "snapshot points"?',
      answer: 'Snapshot points are rewards distributed by DeFi protocols based on your holdings at specific block heights. Our platform helps you optimize for these snapshots by strategically positioning your assets before snapshot dates to maximize additional rewards.',
    },
    {
      question: 'How are yields calculated?',
      answer: 'Yields are calculated in real-time using on-chain data from multiple DeFi protocols. We factor in base APY, additional rewards, compounding effects, and gas costs to provide accurate net yield estimates. Historical performance and risk metrics are also considered.',
    },
    {
      question: 'Can I copy other users\' strategies?',
      answer: 'Yes! Our upcoming Strategy Marketplace will allow you to discover and copy successful strategies from top performers. This feature is currently in development and will include performance metrics, risk assessments, and automated copying mechanisms.',
    },
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about DeFi yield optimization
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex justify-between items-center text-left"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-cyber-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-gray-700 mt-4">
                      <p className="text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-400 mb-6">
              Join our community or reach out to our support team for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="btn-primary inline-flex items-center justify-center"
              >
                Join Discord
              </a>
              <a
                href="#"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
