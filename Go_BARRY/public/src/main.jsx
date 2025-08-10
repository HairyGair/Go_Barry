import React from 'react'
import ReactDOM from 'react-dom/client'
import ModernApp from './components/ModernApp.jsx'

// Import stores to make them available globally for backward compatibility
import { useSupervisorStore } from './stores/supervisorStore.js'
import { useFleetStore } from './stores/fleetStore.js'
import { useWizardStore } from './stores/wizardStore.js'

// Make stores available globally for legacy code
if (typeof window !== 'undefined') {
  window.useSupervisorStore = useSupervisorStore
  window.useFleetStore = useFleetStore
  window.useWizardStore = useWizardStore
}

// Initialize the modern React app
const initializeModernApp = () => {
  const rootElement = document.getElementById('modern-root')
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <ModernApp />
      </React.StrictMode>
    )
    console.log('Modern Breakdown Guide initialized')
  } else {
    console.error('Modern root element not found')
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeModernApp)
} else {
  initializeModernApp()
}

export { ModernApp, useSupervisorStore, useFleetStore, useWizardStore }