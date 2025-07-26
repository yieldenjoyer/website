import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/layout/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const VaultsPage = React.lazy(() => import('@/pages/VaultsPage'))
const FAQPage = React.lazy(() => import('@/pages/FAQPage'))

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-50 overflow-x-hidden">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 cyber-grid opacity-5 pointer-events-none" />
      
      <Layout>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomePage />
                </motion.div>
              } />
              
              <Route path="/dashboard" element={
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardPage />
                </motion.div>
              } />
              
              <Route path="/vaults" element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <VaultsPage />
                </motion.div>
              } />
              
              <Route path="/faq" element={
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FAQPage />
                </motion.div>
              } />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </Layout>
    </div>
  )
}

export default App
