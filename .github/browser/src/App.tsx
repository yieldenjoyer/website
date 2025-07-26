import React, { Suspense, lazy } from 'react'
import { useStore } from './store/useStore'
import { Web3Provider } from './providers/Web3Provider'
import { NotificationSystem } from './components/ui/NotificationSystem'
import { ThemeControls } from './components/ui/ThemeControls'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Lazy load components for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const VaultsPage = lazy(() => import('./pages/VaultsPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function App() {
  const { currentPage, isLoading } = useStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'dashboard':
        return <DashboardPage />
      case 'vaults':
        return <VaultsPage />
      case 'faq':
        return <FAQPage />
      case 'login':
        return <LoginPage />
      default:
        return <HomePage />
    }
  }

  return (
    <Web3Provider>
      <div className="min-h-screen bg-background-dark relative overflow-x-hidden">
        {/* Global Matrix Background */}
        <div className="fixed inset-0 matrix-grid-bg opacity-30 pointer-events-none" />
        
        {/* Matrix Rain Effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-matrix-rain text-matrix-green opacity-20 font-matrix text-xs"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${20 + Math.random() * 10}s`,
              }}
            >
              {Array.from({ length: 20 }).map((_, j) => (
                <div key={j} className="block">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background-dark bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="text-matrix-green font-matrix mt-4 text-lg">
                INITIALIZING NEURAL NETWORK...
              </p>
            </div>
          </div>
        )}

        {/* Notification System */}
        <NotificationSystem />

        {/* Theme Controls */}
        <ThemeControls />

        {/* Main Content */}
        <div className="relative z-10">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="large" />
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </div>

        {/* Matrix Scanlines Effect */}
        <div className="fixed inset-0 pointer-events-none z-30">
          <div
            className="w-full h-full opacity-[0.02]"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                #00FF41 2px,
                #00FF41 4px
              )`,
            }}
          />
        </div>

        {/* Enhanced Visual Effects */}
        <div className="fixed inset-0 pointer-events-none z-20">
          {/* Digital noise overlay */}
          <div 
            className="w-full h-full opacity-5 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Matrix glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-matrix-green/5" />
        </div>
      </div>
    </Web3Provider>
  )
}

export default App
