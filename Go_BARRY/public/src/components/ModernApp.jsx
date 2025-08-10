import React, { useEffect, useState } from 'react'
import { useSupervisorStore } from '../stores/supervisorStore.js'
import { useWizardStore } from '../stores/wizardStore.js'
import { useFleetStore } from '../stores/fleetStore.js'
import { ErrorBoundary, WizardErrorBoundary } from './common/ErrorBoundary.jsx'

// Import existing components (they'll be gradually modernized)
const SupervisorLogin = window.SupervisorLogin
const FleetSelectionModal = window.EnhancedFleetSelectionModal || window.FleetSelectionModal

// Wizard component loader
const loadWizardComponent = (wizardType) => {
  return window[`${wizardType}Wizard`] || null
}

export const ModernApp = () => {
  // Store hooks
  const { 
    isAuthenticated, 
    supervisorSession, 
    login, 
    logout 
  } = useSupervisorStore()

  const {
    currentWizard,
    currentStep,
    selectedVehicle,
    showFleetModal,
    responses,
    startWizard,
    showFleetSelection,
    selectVehicleForWizard,
    closeFleetModal,
    nextStep,
    prevStep,
    updateResponse,
    completeAssessment,
    cancelWizard,
    getProgress
  } = useWizardStore()

  const {
    fleetDatabase,
    loadFleetDatabase,
    isLoading: fleetLoading
  } = useFleetStore()

  // Local state
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize the app
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load fleet database
        if (!fleetDatabase) {
          await loadFleetDatabase()
        }

        // Check for existing session
        const existingSession = localStorage.getItem('supervisor_session')
        if (existingSession) {
          const session = JSON.parse(existingSession)
          if (session.supervisorId) {
            await login(session.supervisorId)
          }
        }

        setIsInitializing(false)
      } catch (error) {
        console.error('App initialization error:', error)
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  // Handle login success
  const handleLoginSuccess = (session) => {
    // Store session for persistence
    localStorage.setItem('supervisor_session', JSON.stringify(session))
    console.log(`Supervisor ${session.supervisorId} authenticated successfully`)
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('supervisor_session')
    logout()
    cancelWizard()
  }

  // Handle wizard start
  const handleStartWizard = (wizardType) => {
    showFleetSelection(wizardType)
  }

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    selectVehicleForWizard(vehicle)
  }

  // Render current wizard
  const renderCurrentWizard = () => {
    if (!currentWizard) return null

    const WizardComponent = loadWizardComponent(currentWizard)
    
    if (!WizardComponent) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Wizard component '{currentWizard}' not found</p>
          <button 
            onClick={cancelWizard}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Return to Menu
          </button>
        </div>
      )
    }

    return (
      <WizardErrorBoundary wizardName={currentWizard}>
        <div className="relative">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {currentWizard} Assessment
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(getProgress())}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#ce0e2d] h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Vehicle info */}
          {selectedVehicle && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">Fleet {selectedVehicle.fleetNumber}</span>
                  <span className="text-gray-600 ml-2">({selectedVehicle.regNo})</span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedVehicle.depot}
                </div>
              </div>
            </div>
          )}

          {/* Wizard component */}
          <WizardComponent
            currentStep={currentStep}
            responses={responses}
            onNext={nextStep}
            onPrev={prevStep}
            onUpdateResponse={updateResponse}
            onComplete={completeAssessment}
            onCancel={cancelWizard}
            selectedVehicle={selectedVehicle}
          />
        </div>
      </WizardErrorBoundary>
    )
  }

  // Loading screen
  if (isInitializing || fleetLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce0e2d] mx-auto mb-4" />
          <div className="text-xl font-bold mb-2">
            <span className="text-[#1a2b5a]">Go</span>
            <span className="text-[#ce0e2d]">NorthEast</span>
          </div>
          <div className="text-gray-600">
            {fleetLoading ? 'Loading Fleet Database...' : 'Initializing Breakdown Guide...'}
          </div>
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full">
              <SupervisorLogin 
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          </div>
        </ErrorBoundary>
      </div>
    )
  }

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">
                  <span className="text-[#1a2b5a]">Go</span>
                  <span className="text-[#ce0e2d]">NorthEast</span>
                  <span className="text-gray-600 ml-2 text-lg font-normal">Breakdown Guide</span>
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-semibold">{supervisorSession?.name}</span>
                  <div className="text-xs text-gray-500">{supervisorSession?.depot}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentWizard ? (
            renderCurrentWizard()
          ) : (
            <WizardMenu onStartWizard={handleStartWizard} />
          )}
        </main>

        {/* Fleet Selection Modal */}
        {showFleetModal && (
          <ErrorBoundary>
            <FleetSelectionModal
              isOpen={showFleetModal}
              onClose={closeFleetModal}
              onSelect={handleVehicleSelect}
            />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </div>
  )
}

// Wizard menu component
const WizardMenu = ({ onStartWizard }) => {
  const wizards = [
    { id: 'Steering', name: 'Steering Issues', icon: '🚗', priority: 'high' },
    { id: 'Brakes', name: 'Brake Problems', icon: '🛑', priority: 'high' },
    { id: 'ABSLight', name: 'ABS Warning Light', icon: '⚠️', priority: 'high' },
    { id: 'OilWarningLight', name: 'Oil Warning Light', icon: '🛢️', priority: 'medium' },
    { id: 'InteriorLights', name: 'Interior Lighting', icon: '💡', priority: 'low' },
    { id: 'ExteriorLights', name: 'Exterior Lighting', icon: '🔆', priority: 'medium' },
    { id: 'WheelchairRamp', name: 'Wheelchair Ramp', icon: '♿', priority: 'high' },
    { id: 'DestinationDisplay', name: 'Destination Display', icon: '📱', priority: 'medium' },
    { id: 'Battery', name: 'Battery Issues', icon: '🔋', priority: 'high' },
    { id: 'CoolingSystem', name: 'Cooling System', icon: '🌡️', priority: 'high' },
    { id: 'Doors', name: 'Door Problems', icon: '🚪', priority: 'high' },
    { id: 'NonStarter', name: 'Vehicle Won\'t Start', icon: '🔑', priority: 'high' },
  ]

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 hover:border-red-300 bg-red-50'
      case 'medium': return 'border-yellow-200 hover:border-yellow-300 bg-yellow-50'
      case 'low': return 'border-green-200 hover:border-green-300 bg-green-50'
      default: return 'border-gray-200 hover:border-gray-300 bg-white'
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Vehicle Diagnostic Wizards
        </h2>
        <p className="text-gray-600">
          Select the appropriate diagnostic wizard for your vehicle issue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wizards.map((wizard) => (
          <button
            key={wizard.id}
            onClick={() => onStartWizard(wizard.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getPriorityColor(wizard.priority)}`}
          >
            <div className="text-4xl mb-3">{wizard.icon}</div>
            <div className="font-semibold text-gray-900 mb-1">{wizard.name}</div>
            <div className="text-sm text-gray-600 capitalize">{wizard.priority} Priority</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModernApp