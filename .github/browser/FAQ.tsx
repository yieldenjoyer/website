import { useState } from 'react';

const faqs = [
  { question: 'How does wallet-based login work?', answer: 'Connect your wallet (MetaMask, WalletConnect, etc.) to sign a message and authenticate.' },
  { question: 'What is PT/YT looping?', answer: 'PT/YT looping involves leveraging Pendle’s tokenized yield for amplified returns.' },
  { question: 'Is my crypto safe?', answer: 'We use audited smart contracts and non-custodial protocols to ensure security.' },
  { question: 'What are “snapshot points”?', answer: 'Snapshots are periodic reward calculations for farming protocols.' },
  { question: 'How are yields calculated?', answer: 'Yields are aggregated from multiple DeFi protocols in real-time.' },
  { question: 'Can I copy other users’ strategies?', answer: 'Whale copy trading is coming soon!' },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="card">
            <button
              className="w-full text-left flex justify-between items-center"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <svg
                className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && <p className="mt-2 text-gray-400">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;