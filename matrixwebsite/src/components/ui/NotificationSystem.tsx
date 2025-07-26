import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react'

interface NotificationProps {
  notification: {
    id: string
    type: 'info' | 'success' | 'warning' | 'error' | 'yield' | 'transaction'
    message: string
    timestamp: number
    data?: any
  }
  onClose: (id: string) => void
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'yield':
        return <TrendingUp className="w-5 h-5 text-matrix-green" />
      case 'transaction':
        return <DollarSign className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'from-green-900/20 to-green-800/10 border-green-500/30'
      case 'warning':
        return 'from-yellow-900/20 to-yellow-800/10 border-yellow-500/30'
      case 'error':
        return 'from-red-900/20 to-red-800/10 border-red-500/30'
      case 'yield':
        return 'from-matrix-green/20 to-matrix-green/5 border-matrix-green/30'
      case 'transaction':
        return 'from-blue-900/20 to-blue-800/10 border-blue-500/30'
      default:
        return 'from-slate-900/20 to-slate-800/10 border-slate-500/30'
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notification.id, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        relative overflow-hidden backdrop-blur-lg rounded-lg border
        bg-gradient-to-r ${getBackgroundColor()}
        shadow-lg shadow-black/20 min-w-[300px] max-w-[400px]
      `}
    >
      {/* Matrix-style scan line animation */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            'linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.1) 50%, transparent 100%)',
            'linear-gradient(90deg, transparent 100%, rgba(0,255,65,0.1) 150%, transparent 200%)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white font-matrix">
            {notification.message}
          </p>
          
          {notification.data && (
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              {notification.data.hash && (
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  <span className="font-mono">
                    {notification.data.hash.slice(0, 10)}...
                  </span>
                </div>
              )}
              {notification.data.amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span>{notification.data.amount}</span>
                </div>
              )}
              {notification.data.apy && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>APY: {notification.data.apy}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onClose(notification.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-matrix-green to-cyan-400"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
      />
    </motion.div>
  )
}

export const NotificationSystem: React.FC = () => {
  const notifications = useStore((state) => state.notifications)
  const removeNotification = useStore((state) => state.removeNotification)

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Notification
              notification={notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Enhanced notification hook with DeFi-specific types
export const useNotifications = () => {
  const addNotification = useStore((state) => state.addNotification)

  const showNotification = (
    type: 'info' | 'success' | 'warning' | 'error' | 'yield' | 'transaction',
    message: string,
    data?: any
  ) => {
    addNotification({ type, message, data })
  }

  // DeFi-specific notification helpers
  const showTransactionPending = (hash: string, amount?: string) => {
    showNotification('transaction', 'Transaction submitted to blockchain', {
      hash,
      amount,
      status: 'pending'
    })
  }

  const showTransactionSuccess = (hash: string, amount?: string) => {
    showNotification('success', 'Transaction confirmed successfully', {
      hash,
      amount,
      status: 'confirmed'
    })
  }

  const showTransactionError = (error: string) => {
    showNotification('error', `Transaction failed: ${error}`)
  }

  const showYieldUpdate = (protocol: string, apy: number, change: number) => {
    const message = change > 0 
      ? `${protocol} APY increased to ${apy}%` 
      : `${protocol} APY decreased to ${apy}%`
    
    showNotification('yield', message, {
      protocol,
      apy,
      change
    })
  }

  const showConnectionStatus = (status: 'connected' | 'disconnected', address?: string) => {
    if (status === 'connected') {
      showNotification('success', `Wallet connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`)
    } else {
      showNotification('info', 'Wallet disconnected')
    }
  }

  const showGasAlert = (gasPrice: number, threshold: number) => {
    if (gasPrice > threshold) {
      showNotification('warning', `High gas prices detected: ${gasPrice} gwei`, {
        gasPrice,
        threshold
      })
    }
  }

  return {
    showNotification,
    showTransactionPending,
    showTransactionSuccess,
    showTransactionError,
    showYieldUpdate,
    showConnectionStatus,
    showGasAlert
  }
}

// Matrix-style notification sound effects
export const useNotificationSounds = () => {
  const soundEnabled = useStore((state) => state.soundEnabled)

  const playNotificationSound = (type: string) => {
    if (!soundEnabled) return

    // Create audio context for matrix-style sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const createTone = (frequency: number, duration: number, volume: number = 0.1) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      }

      switch (type) {
        case 'success':
          // Success: ascending tones
          createTone(523.25, 0.15) // C5
          setTimeout(() => createTone(659.25, 0.15), 100) // E5
          setTimeout(() => createTone(783.99, 0.2), 200) // G5
          break
        case 'error':
          // Error: descending harsh tones
          createTone(400, 0.3, 0.15)
          setTimeout(() => createTone(300, 0.3, 0.15), 150)
          break
        case 'warning':
          // Warning: pulsing tone
          createTone(440, 0.1)
          setTimeout(() => createTone(440, 0.1), 200)
          break
        case 'transaction':
          // Transaction: digital beep
          createTone(800, 0.1)
          setTimeout(() => createTone(1000, 0.1), 100)
          break
        default:
          // Info: soft beep
          createTone(600, 0.15)
      }
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  return { playNotificationSound }
}
