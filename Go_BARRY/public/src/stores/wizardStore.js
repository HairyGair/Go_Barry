import { create } from 'zustand'

export const useWizardStore = create((set, get) => ({
  // State
  currentWizard: null,
  currentStep: 1,
  responses: {},
  assessmentId: null,
  selectedVehicle: null,
  showFleetModal: false,
  pendingWizardType: null,
  assessmentHistory: [],

  // Wizard management
  startWizard: (wizardType, vehicle) => {
    const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    set({
      currentWizard: wizardType,
      currentStep: 1,
      responses: {},
      assessmentId,
      selectedVehicle: vehicle,
      showFleetModal: false,
      pendingWizardType: null
    })

    // Initialize breakdown tracker
    if (window.breakdownTracker) {
      window.breakdownTracker.startAssessment(assessmentId, {
        category: wizardType,
        fleetNumber: vehicle?.fleetNumber,
        depot: vehicle?.depot,
        supervisor: get().getCurrentSupervisor()?.supervisorId
      })
    }

    return assessmentId
  },

  showFleetSelection: (wizardType) => {
    set({
      showFleetModal: true,
      pendingWizardType: wizardType
    })
  },

  selectVehicleForWizard: (vehicle) => {
    const { pendingWizardType } = get()
    if (pendingWizardType) {
      get().startWizard(pendingWizardType, vehicle)
    }
  },

  closeFleetModal: () => {
    set({
      showFleetModal: false,
      pendingWizardType: null
    })
  },

  // Step navigation
  nextStep: () => {
    set(state => ({
      currentStep: state.currentStep + 1
    }))
  },

  prevStep: () => {
    set(state => ({
      currentStep: Math.max(1, state.currentStep - 1)
    }))
  },

  goToStep: (stepNumber) => {
    set({ currentStep: stepNumber })
  },

  // Response management
  updateResponse: (key, value) => {
    set(state => ({
      responses: {
        ...state.responses,
        [key]: value
      }
    }))

    // Update breakdown tracker
    if (window.breakdownTracker && get().assessmentId) {
      window.breakdownTracker.updateAssessment(get().assessmentId, key, value)
    }
  },

  updateMultipleResponses: (updates) => {
    set(state => ({
      responses: {
        ...state.responses,
        ...updates
      }
    }))
  },

  // Assessment completion
  completeAssessment: async (decision, summary = '') => {
    const state = get()
    const { currentWizard, assessmentId, selectedVehicle, responses } = state

    if (!assessmentId || !currentWizard) {
      throw new Error('No active assessment to complete')
    }

    try {
      const assessment = {
        id: assessmentId,
        category: currentWizard,
        vehicle: selectedVehicle,
        responses,
        decision,
        summary,
        completedAt: new Date().toISOString(),
        supervisor: get().getCurrentSupervisor()
      }

      // Log to SupervisorBreakdownLogger
      if (window.SupervisorBreakdownLogger) {
        await window.SupervisorBreakdownLogger.completeAssessment(assessment)
      }

      // Complete breakdown tracker
      if (window.breakdownTracker) {
        window.breakdownTracker.completeAssessment(assessmentId, decision)
      }

      // Add to history
      set(state => ({
        assessmentHistory: [assessment, ...state.assessmentHistory.slice(0, 49)], // Keep last 50
        // Reset wizard state
        currentWizard: null,
        currentStep: 1,
        responses: {},
        assessmentId: null,
        selectedVehicle: null
      }))

      return assessment
    } catch (error) {
      console.error('Failed to complete assessment:', error)
      throw error
    }
  },

  cancelWizard: () => {
    const { assessmentId } = get()
    
    // Cancel breakdown tracker
    if (window.breakdownTracker && assessmentId) {
      window.breakdownTracker.cancelAssessment(assessmentId)
    }

    set({
      currentWizard: null,
      currentStep: 1,
      responses: {},
      assessmentId: null,
      selectedVehicle: null,
      showFleetModal: false,
      pendingWizardType: null
    })
  },

  // Progress tracking
  getProgress: () => {
    const { currentStep, currentWizard, responses } = get()
    
    if (!currentWizard) return 0

    // Get wizard definition to calculate total steps
    const wizardComponent = window[`${currentWizard}Wizard`]
    const totalSteps = wizardComponent?.totalSteps || 5 // Default estimate
    
    return Math.min((currentStep / totalSteps) * 100, 100)
  },

  getResponseSummary: () => {
    const { responses } = get()
    
    return {
      totalResponses: Object.keys(responses).length,
      yesResponses: Object.values(responses).filter(r => r === 'yes' || r === true).length,
      noResponses: Object.values(responses).filter(r => r === 'no' || r === false).length,
      responses
    }
  },

  // Helper functions
  getCurrentSupervisor: () => {
    // Get from supervisor store if available
    if (window.useSupervisorStore) {
      return window.useSupervisorStore.getState().supervisorSession
    }
    // Fallback to legacy system
    return window.currentSupervisorSession || null
  },

  // Assessment history
  getAssessmentHistory: () => get().assessmentHistory,

  getAssessmentsByVehicle: (fleetNumber) => {
    return get().assessmentHistory.filter(a => 
      a.vehicle?.fleetNumber === fleetNumber
    )
  },

  getAssessmentsByCategory: (category) => {
    return get().assessmentHistory.filter(a => a.category === category)
  }
}))

// Available wizard types
export const WIZARD_TYPES = {
  STEERING: 'Steering',
  BRAKES: 'Brakes',
  ABS_LIGHT: 'ABSLight',
  OIL_WARNING_LIGHT: 'OilWarningLight',
  INTERIOR_LIGHTS: 'InteriorLights',
  EXTERIOR_LIGHTS: 'ExteriorLights',
  WHEELCHAIR_RAMP: 'WheelchairRamp',
  DESTINATION_DISPLAY: 'DestinationDisplay',
  BATTERY: 'Battery',
  COOLING_SYSTEM: 'CoolingSystem',
  DEMISTERS_HEATERS: 'DemistersHeaters',
  REPEAT_DEFECTS: 'RepeatDefects',
  ROAD_TRAFFIC_INCIDENTS: 'RoadTrafficIncidents',
  TRACER_IT_HELPER: 'TracerItHelper',
  LOOSE_WHEEL_NUTS: 'LooseWheelNuts',
  PUNCTURE: 'Puncture',
  NON_STARTER: 'NonStarter',
  DOORS: 'Doors',
  GEAR_SELECTION: 'GearSelection',
  GEARBOX: 'Gearbox',
  BUZZERS: 'Buzzers',
  WARNING_LIGHTS: 'WarningLights',
  EXCESSIVE_SMOKE: 'ExcessiveSmoke',
  SUSPENSION: 'Suspension',
  WIPERS_SCREENWASH: 'WipersScreenwash',
  LOW_WATER: 'LowWater',
  BROKEN_WINDOWS: 'BrokenWindows',
  WING_MIRRORS: 'WingMirrors',
  SPEEDO: 'Speedo',
  CUTTING_OUT_FUEL: 'CuttingOutFuel',
  INTERIOR_EXTERIOR_DAMAGE: 'InteriorExteriorDamage'
}