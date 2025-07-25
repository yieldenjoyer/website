import React, { useEffect, useState } from 'react';

interface MetricData {
  tvl: string;
  activeUsers: string;
  averageAPY: string;
}

export const KeyMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData>({
    tvl: '2,978,993',
    activeUsers: '46,358',
    averageAPY: '17.35%'
  });

  useEffect(() => {
    // Simulate live updating metrics
    const updateMetrics = () => {
      setMetrics({
        tvl: Math.floor(2900000 + Math.random() * 200000).toLocaleString(),
        activeUsers: Math.floor(45000 + Math.random() * 5000).toLocaleString(),
        averageAPY: `${(15 + Math.random() * 5).toFixed(2)}%`
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-8 text-sm font-medium text-gray-700">
          <span>
            TVL: <span className="text-gray-900 font-semibold">{metrics.tvl}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>
            Users: <span className="text-gray-900 font-semibold">{metrics.activeUsers}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>
            Average APY: <span className="text-green-600 font-semibold">{metrics.averageAPY}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
