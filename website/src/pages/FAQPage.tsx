import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Matrix Finance?",
      answer: "Matrix Finance is an advanced yield optimization platform that automatically manages your cryptocurrency investments across multiple DeFi protocols to maximize returns while minimizing risk."
    },
    {
      question: "How does the yield optimization work?",
      answer: "Our platform uses sophisticated algorithms to monitor yields across various DeFi protocols including Aave, Compound, Pendle, and others. It automatically rebalances your portfolio to capture the highest available yields while maintaining your risk preferences."
    },
    {
      question: "What are the fees?",
      answer: "We charge a performance fee of 10% on profits generated. There are no management fees, deposit fees, or withdrawal fees. You only pay when we help you earn more."
    },
    {
      question: "Is my money safe?",
      answer: "Security is our top priority. All smart contracts are audited by leading security firms, we use battle-tested protocols, and funds are secured by multi-signature wallets. However, DeFi involves inherent risks, and past performance doesn't guarantee future results."
    },
    {
      question: "What is the minimum deposit?",
      answer: "The minimum deposit varies by strategy but typically starts at $100 USD equivalent. Some advanced strategies may require higher minimums due to gas cost efficiency."
    },
    {
      question: "How do I withdraw my funds?",
      answer: "You can withdraw your funds at any time through the dashboard. Withdrawals are processed immediately for available funds, though some strategies may have a small delay for optimal exit timing."
    },
    {
      question: "What blockchain networks do you support?",
      answer: "We currently support Ethereum mainnet, Arbitrum, Optimism, and Polygon. We're continuously expanding to new networks based on yield opportunities and user demand."
    },
    {
      question: "Do I need KYC verification?",
      answer: "For basic usage up to $10,000, no KYC is required. Higher deposit limits may require identity verification in compliance with regulatory requirements in your jurisdiction."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to know about Matrix Finance and yield optimization strategies.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-violet-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-violet-400 flex-shrink-0" />
                )}
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-violet-400">Still have questions?</h2>
            <p className="text-gray-300 mb-6">
              Our team is here to help. Reach out through our community channels or support system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all duration-300">
                Join Discord
              </button>
              <button className="border border-emerald-500 hover:bg-emerald-500/10 px-8 py-3 rounded-xl font-semibold transition-all duration-300">
                Contact Support
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;
