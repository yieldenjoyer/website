import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className,
  text
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      {/* Matrix-style spinner */}
      <div className="relative">
        <div 
          className={cn(
            'border-2 border-matrix-dark-green border-t-matrix-green rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        <div 
          className={cn(
            'absolute inset-0 border-2 border-transparent border-r-matrix-bright-green rounded-full animate-spin',
            sizeClasses[size]
          )}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>

      {/* Matrix-style loading dots */}
      <div className="loading-dots">
        <span />
        <span />
        <span />
      </div>

      {/* Loading text */}
      {text && (
        <p className="text-matrix-green font-matrix text-sm tracking-wider uppercase">
          {text}
        </p>
      )}

      {/* Matrix code stream effect */}
      <div className="flex space-x-1 opacity-60">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-matrix-green rounded-full animate-pulse"
            style={{
              height: Math.random() * 20 + 10,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Alternative matrix-style loader with falling characters
export const MatrixLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center space-y-6">
    <div className="relative w-32 h-32 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-matrix-rain text-matrix-green font-matrix opacity-60"
          style={{
            left: `${i * 16}px`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: '2s'
          }}
        >
          {[...Array(10)].map((_, j) => (
            <div key={j} className="text-xs">
              {String.fromCharCode(0x30A0 + Math.random() * 96)}
            </div>
          ))}
        </div>
      ))}
    </div>
    
    {text && (
      <div className="text-center">
        <p className="text-matrix-green font-matrix text-lg tracking-wider">
          {text}
        </p>
        <div className="mt-2 flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-matrix-green rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    )}
  </div>
)

export default LoadingSpinner
