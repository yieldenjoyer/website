import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, AlertTriangle } from 'lucide-react';

interface DataPoint {
  id: string;
  protocol: string;
  type: 'YIELD' | 'TVL' | 'TRANSACTION' | 'ALERT' | 'OPTIMIZATION';
  value: string;
  change: number;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high';
}

interface StreamProps {
  maxItems?: number;
  updateInterval?: number;
}

export const RealTimeDataStream: React.FC<StreamProps> = ({ 
  maxItems = 15, 
  updateInterval = 2000 
}) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const protocols = ['AAVE', 'COMPOUND', 'UNISWAP', 'CURVE', 'YEARN', 'SUSHI', 'MAKER'];
  const dataTypes: DataPoint['type'][] = ['YIELD', 'TVL', 'TRANSACTION', 'ALERT', 'OPTIMIZATION'];

  const generateDataPoint = (): DataPoint => {
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const type = dataTypes[Math.floor(Math.random() * dataTypes.length)];
    const change = (Math.random() - 0.5) * 20; // -10% to +10%
    
    let value = '';
    let severity: DataPoint['severity'] = undefined;

    switch (type) {
      case 'YIELD':
        value = `${(Math.random() * 25 + 5).toFixed(2)}% APY`;
        break;
      case 'TVL':
        value = `$${(Math.random() * 999 + 100).toFixed(0)}M`;
        break;
      case 'TRANSACTION':
        value = `${Math.floor(Math.random() * 50 + 10)} TXN/s`;
        break;
      case 'ALERT':
        severity = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
        value = severity === 'high' ? 'CRITICAL' : severity === 'medium' ? 'WARNING' : 'INFO';
        break;
      case 'OPTIMIZATION':
        value = `GAS: ${Math.floor(Math.random() * 100 + 50)} GWEI`;
        break;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      protocol,
      type,
      value,
      change,
      timestamp: Date.now(),
      severity
    };
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newDataPoint = generateDataPoint();
      setDataPoints(prev => {
        const updated = [newDataPoint, ...prev];
        return updated.slice(0, maxItems);
      });
    }, updateInterval);

    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isActive, maxItems, updateInterval]);

  const getIcon = (type: DataPoint['type']) => {
    switch (type) {
      case 'YIELD':
        return TrendingUp;
      case 'TVL':
        return Activity;
      case 'TRANSACTION':
        return Zap;
      case 'ALERT':
        return AlertTriangle;
      case 'OPTIMIZATION':
        return Activity;
    }
  };

  const getColor = (type: DataPoint['type'], severity?: DataPoint['severity'], change?: number) => {
    if (type === 'ALERT') {
      switch (severity) {
        case 'high': return 'text-red-400 border-red-500/50';
        case 'medium': return 'text-yellow-400 border-yellow-500/50';
        case 'low': return 'text-blue-400 border-blue-500/50';
        default: return 'text-gray-400 border-gray-500/50';
      }
    }
    
    if (change !== undefined) {
      return change > 0 ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50';
    }
    
    return 'text-cyan-400 border-cyan-500/50';
  };

  return (
    <div className="bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-sm font-bold text-green-400">LIVE DATA STREAM</span>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isActive 
              ? 'bg-green-500 text-black hover:bg-green-400' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isActive ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-hidden">
        <AnimatePresence initial={false}>
          {dataPoints.map((point, index) => {
            const Icon = getIcon(point.type);
            const colorClass = getColor(point.type, point.severity, point.change);
            
            return (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -50, scale: 0.8 }}
                animate={{ 
                  opacity: Math.max(0.1, 1 - (index * 0.05)), 
                  x: 0, 
                  scale: Math.max(0.8, 1 - (index * 0.02))
                }}
                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex items-center justify-between p-2 border rounded text-xs ${colorClass} bg-black/50`}
                style={{ 
                  filter: `brightness(${Math.max(0.3, 1 - (index * 0.1))})` 
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="font-bold">{point.protocol}</span>
                  <span className="text-gray-400">•</span>
                  <span>{point.type}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold">{point.value}</span>
                  {point.change !== undefined && (
                    <span className={`text-xs ${point.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {point.change > 0 ? '+' : ''}{point.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {dataPoints.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data stream active</p>
        </div>
      )}
    </div>
  );
};
