import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';

interface AudioContextType {
  context: AudioContext | null;
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
}

export const MatrixSoundSystem: React.FC = () => {
  const audioRef = useRef<AudioContextType>({
    context: null,
    oscillators: [],
    gainNodes: []
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [volume, setVolume] = useState(0.1);

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioRef.current.context = new AudioContext();
    }
  }, []);

  // Matrix ambient sound generation
  const generateMatrixAmbient = () => {
    if (!audioRef.current.context || !isEnabled) return;

    const ctx = audioRef.current.context;
    
    // Low frequency digital hum
    const baseOsc = ctx.createOscillator();
    const baseGain = ctx.createGain();
    
    baseOsc.type = 'sawtooth';
    baseOsc.frequency.setValueAtTime(40, ctx.currentTime);
    baseGain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    
    baseOsc.connect(baseGain);
    baseGain.connect(ctx.destination);
    
    baseOsc.start();
    
    // Add frequency modulation for digital feel
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, ctx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(baseOsc.frequency);
    lfo.start();
    
    // Clean up after 30 seconds
    setTimeout(() => {
      baseOsc.stop();
      lfo.stop();
    }, 30000);
  };

  // Data transmission beep
  const playDataBeep = (frequency: number = 800, duration: number = 0.1) => {
    if (!audioRef.current.context || !isEnabled) return;

    const ctx = audioRef.current.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  // Protocol connection sound
  const playProtocolConnect = () => {
    if (!audioRef.current.context || !isEnabled) return;

    const frequencies = [220, 330, 440, 550];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        playDataBeep(freq, 0.15);
      }, index * 50);
    });
  };

  // Transaction confirmation sound
  const playTransactionConfirm = () => {
    if (!audioRef.current.context || !isEnabled) return;

    const ctx = audioRef.current.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  // Periodic data transmission sounds
  useEffect(() => {
    if (!isEnabled) return;

    const intervals = [
      setInterval(() => playDataBeep(Math.random() * 400 + 600, 0.05), 2000 + Math.random() * 3000),
      setInterval(() => playDataBeep(Math.random() * 200 + 300, 0.08), 5000 + Math.random() * 2000),
      setInterval(generateMatrixAmbient, 45000),
    ];

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [isEnabled, volume]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-green-500/30 p-4 rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs font-mono text-green-400">AUDIO SYS</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              isEnabled 
                ? 'bg-green-500 text-black hover:bg-green-400' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={playProtocolConnect}
            disabled={!isEnabled}
            className="px-2 py-1 text-xs font-mono rounded bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400"
          >
            TEST
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">VOL</span>
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none slider"
            disabled={!isEnabled}
          />
        </div>
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ff41;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ff41;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
