import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import '@styles/main.css'

// Lazy load components for better performance
const ModernApp = lazy(() => import('./components/ModernApp.jsx'))

// Import stores to make them available globally for backward compatibility
import { useSupervisorStore } from './stores/supervisorStore.js'
import { useFleetStore } from './stores/fleetStore.js'
import { useWizardStore } from './stores/wizardStore.js'

// Error boundary for graceful error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo)
    
    // Log to breakdown analytics if available
    if (window.BreakdownAnalytics) {
      window.BreakdownAnalytics.logError('APP_ERROR', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Application Error
            </h1>
            <p className="text-gray-600 mb-6">
              The breakdown guide encountered an unexpected error. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Refresh Page
            </button>
            {__DEV__ && (
              <details className="mt-4 text-left text-sm">
                <summary className="cursor-pointer text-gray-500">Error Details</summary>
                <pre className="mt-2 text-red-600 overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading Breakdown Guide...</p>
    </div>
  </div>
)

// Make stores available globally for legacy code
if (typeof window !== 'undefined') {
  window.useSupervisorStore = useSupervisorStore
  window.useFleetStore = useFleetStore
  window.useWizardStore = useWizardStore
}

// Initialize performance monitoring
if ('performance' in window && 'mark' in window.performance) {
  performance.mark('app-start')
}

// Initialize the modern React app
const initializeModernApp = () => {
  const rootElement = document.getElementById('modern-root') || document.getElementById('root')
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <ModernApp />
          </Suspense>
        </ErrorBoundary>
      </React.StrictMode>
    )
    console.log('✅ Modern Breakdown Guide initialized with performance optimizations')
  } else {
    console.error('❌ Modern root element not found')
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeModernApp)
} else {
  initializeModernApp()
}

// Report performance metrics
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      const paintEntries = performance.getEntriesByType('paint')
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      }
      
      console.log('📊 Performance Metrics:', metrics)
      
      // Log to analytics if available
      if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.logPerformance('PAGE_LOAD', metrics)
      }
    }, 1000)
  })
}

export { ModernApp, useSupervisorStore, useFleetStore, useWizardStore }