// React Native Compatible Store Implementation
// Uses AsyncStorage instead of localStorage for React Native

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '../components/ReactNative/PlatformUtils.js'

// Custom storage adapter for cross-platform compatibility
const createPlatformStorage = () => ({
  getItem: async (key) => {
    try {
      const item = await storage.getItem(key)
      return item
    } catch (error) {
      console.warn('Storage get error:', error)
      return null
    }
  },
  setItem: async (key, value) => {
    try {
      await storage.setItem(key, value)
    } catch (error) {
      console.warn('Storage set error:', error)
    }
  },
  removeItem: async (key) => {
    try {
      await storage.removeItem(key)
    } catch (error) {
      console.warn('Storage remove error:', error)
    }
  }
})

// Enhanced Supervisor Store for React Native
export const useSupervisorStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        isAuthenticated: false,
        supervisorSession: null,
        loginAttempts: 0,
        lastLoginTime: null,
        sessionExpiry: null,
        permissions: [],
        preferences: {
          theme: 'light',
          notifications: true,
          hapticFeedback: true,
          autoLogout: 30 // minutes
        },

        // Actions
        login: async (credentials) => {
          try {
            const { supervisorId, password } = credentials
            
            // Simulate API call
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ supervisorId, password })
            })

            if (response.ok) {
              const sessionData = await response.json()
              const expiryTime = Date.now() + (8 * 60 * 60 * 1000) // 8 hours
              
              set({
                isAuthenticated: true,
                supervisorSession: sessionData,
                loginAttempts: 0,
                lastLoginTime: Date.now(),
                sessionExpiry: expiryTime,
                permissions: sessionData.permissions || []
              })

              // Log successful login
              if (window.BreakdownAnalytics) {
                window.BreakdownAnalytics.logEvent('SUPERVISOR_LOGIN', {
                  supervisorId,
                  timestamp: Date.now()
                })
              }

              return { success: true, data: sessionData }
            } else {
              const error = await response.json()
              set(state => ({
                loginAttempts: state.loginAttempts + 1
              }))
              
              return { success: false, error: error.message }
            }
          } catch (error) {
            console.error('Login error:', error)
            set(state => ({
              loginAttempts: state.loginAttempts + 1
            }))
            
            return { success: false, error: 'Network error during login' }
          }
        },

        logout: () => {
          const currentSession = get().supervisorSession

          set({
            isAuthenticated: false,
            supervisorSession: null,
            loginAttempts: 0,
            lastLoginTime: null,
            sessionExpiry: null,
            permissions: []
          })

          // Log logout
          if (window.BreakdownAnalytics && currentSession) {
            window.BreakdownAnalytics.logEvent('SUPERVISOR_LOGOUT', {
              supervisorId: currentSession.supervisorId,
              sessionDuration: Date.now() - get().lastLoginTime,
              timestamp: Date.now()
            })
          }
        },

        updatePreferences: (newPreferences) => {
          set(state => ({
            preferences: {
              ...state.preferences,
              ...newPreferences
            }
          }))
        },

        checkSession: () => {
          const { sessionExpiry, isAuthenticated } = get()
          
          if (isAuthenticated && sessionExpiry && Date.now() > sessionExpiry) {
            get().logout()
            return false
          }
          
          return isAuthenticated
        },

        extendSession: () => {
          if (get().isAuthenticated) {
            const newExpiry = Date.now() + (8 * 60 * 60 * 1000) // 8 hours
            set({ sessionExpiry: newExpiry })
          }
        },

        hasPermission: (permission) => {
          const { permissions } = get()
          return permissions.includes(permission) || permissions.includes('admin')
        }
      }),
      {
        name: 'supervisor-session',
        storage: createJSONStorage(() => createPlatformStorage()),
        partialize: (state) => ({
          supervisorSession: state.supervisorSession,
          lastLoginTime: state.lastLoginTime,
          sessionExpiry: state.sessionExpiry,
          preferences: state.preferences,
          permissions: state.permissions
        })
      }
    )
  )
)

// Enhanced Wizard Store for React Native
export const useWizardStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        currentWizard: null,
        currentStep: 1,
        responses: {},
        assessmentId: null,
        selectedVehicle: null,
        showFleetModal: false,
        pendingWizardType: null,
        assessmentHistory: [],
        wizardProgress: {},
        lastSaveTime: null,

        // Actions
        startWizard: async (wizardType, vehicle) => {
          const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          set({
            currentWizard: wizardType,
            currentStep: 1,
            responses: {},
            assessmentId,
            selectedVehicle: vehicle,
            showFleetModal: false,
            pendingWizardType: null,
            lastSaveTime: Date.now()
          })

          // Initialize breakdown tracker
          if (window.SupervisorBreakdownLogger) {
            await window.SupervisorBreakdownLogger.startAssessment(
              wizardType,
              vehicle?.fleetNumber,
              vehicle?.depot
            )
          }

          // Log wizard start
          if (window.BreakdownAnalytics) {
            window.BreakdownAnalytics.logEvent('WIZARD_START', {
              wizardType,
              vehicleFleet: vehicle?.fleetNumber,
              assessmentId,
              timestamp: Date.now()
            })
          }

          return assessmentId
        },

        updateResponse: async (key, value, autoSave = true) => {
          set(state => ({
            responses: {
              ...state.responses,
              [key]: value
            },
            lastSaveTime: autoSave ? Date.now() : state.lastSaveTime
          }))

          // Log response update
          if (window.SupervisorBreakdownLogger) {
            await window.SupervisorBreakdownLogger.logWizardStep('response_update', {
              question: key,
              answer: value,
              step: get().currentStep,
              timestamp: Date.now()
            })
          }

          // Auto-save progress if enabled
          if (autoSave) {
            get().saveProgress()
          }
        },

        nextStep: () => {
          set(state => ({
            currentStep: state.currentStep + 1,
            lastSaveTime: Date.now()
          }))

          // Log step progression
          if (window.BreakdownAnalytics) {
            window.BreakdownAnalytics.logEvent('WIZARD_STEP_NEXT', {
              wizardType: get().currentWizard,
              step: get().currentStep,
              timestamp: Date.now()
            })
          }
        },

        prevStep: () => {
          set(state => ({
            currentStep: Math.max(1, state.currentStep - 1),
            lastSaveTime: Date.now()
          }))
        },

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
              supervisor: useSupervisorStore.getState().supervisorSession,
              duration: Date.now() - (state.lastSaveTime || Date.now())
            }

            // Complete breakdown diagnosis
            if (window.SupervisorBreakdownLogger) {
              await window.SupervisorBreakdownLogger.completeWizardDiagnosis(
                decision === 'STOP' ? 'RED' : decision === 'CONTINUE' ? 'GREEN' : 'AMBER',
                summary || `${currentWizard} assessment completed with ${decision} decision`
              )
              
              await window.SupervisorBreakdownLogger.completeAssessment(decision, responses)
            }

            // Add to history
            set(state => ({
              assessmentHistory: [assessment, ...state.assessmentHistory.slice(0, 49)],
              // Reset wizard state
              currentWizard: null,
              currentStep: 1,
              responses: {},
              assessmentId: null,
              selectedVehicle: null,
              lastSaveTime: null
            }))

            // Log completion
            if (window.BreakdownAnalytics) {
              window.BreakdownAnalytics.logEvent('WIZARD_COMPLETE', {
                ...assessment,
                timestamp: Date.now()
              })
            }

            return assessment
          } catch (error) {
            console.error('Failed to complete assessment:', error)
            throw error
          }
        },

        saveProgress: async () => {
          const state = get()
          if (!state.assessmentId) return

          const progressData = {
            assessmentId: state.assessmentId,
            wizardType: state.currentWizard,
            step: state.currentStep,
            responses: state.responses,
            vehicle: state.selectedVehicle,
            timestamp: Date.now()
          }

          try {
            // Save to backend if available
            await fetch('/api/wizard/save-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(progressData)
            })

            set({ lastSaveTime: Date.now() })
          } catch (error) {
            console.warn('Failed to save progress to backend:', error)
          }
        },

        loadProgress: async (assessmentId) => {
          try {
            const response = await fetch(`/api/wizard/load-progress/${assessmentId}`)
            if (response.ok) {
              const progressData = await response.json()
              
              set({
                currentWizard: progressData.wizardType,
                currentStep: progressData.step,
                responses: progressData.responses,
                assessmentId: progressData.assessmentId,
                selectedVehicle: progressData.vehicle,
                lastSaveTime: progressData.timestamp
              })
              
              return progressData
            }
          } catch (error) {
            console.warn('Failed to load progress:', error)
          }
          return null
        },

        cancelWizard: () => {
          const { assessmentId } = get()
          
          if (window.SupervisorBreakdownLogger && assessmentId) {
            window.SupervisorBreakdownLogger.logAction('ASSESSMENT_CANCELLED', {
              assessmentId,
              reason: 'User cancelled',
              timestamp: Date.now()
            })
          }

          set({
            currentWizard: null,
            currentStep: 1,
            responses: {},
            assessmentId: null,
            selectedVehicle: null,
            showFleetModal: false,
            pendingWizardType: null,
            lastSaveTime: null
          })
        },

        getProgress: () => {
          const { currentStep, currentWizard } = get()
          
          if (!currentWizard) return 0

          const wizardComponent = window[`${currentWizard}Wizard`]
          const totalSteps = wizardComponent?.totalSteps || 5
          
          return Math.min((currentStep / totalSteps) * 100, 100)
        }
      }),
      {
        name: 'wizard-state',
        storage: createJSONStorage(() => createPlatformStorage()),
        partialize: (state) => ({
          assessmentHistory: state.assessmentHistory,
          wizardProgress: state.wizardProgress
        })
      }
    )
  )
)

// Enhanced Fleet Store for React Native
export const useFleetStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        fleetDatabase: null,
        isLoading: false,
        lastUpdated: null,
        searchHistory: [],
        favoriteVehicles: [],
        recentVehicles: [],
        offlineData: null,

        // Actions
        loadFleetDatabase: async (forceRefresh = false) => {
          const { lastUpdated, fleetDatabase } = get()
          const cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
          
          if (!forceRefresh && fleetDatabase && lastUpdated && 
              (Date.now() - lastUpdated) < cacheExpiry) {
            return fleetDatabase
          }

          set({ isLoading: true })

          try {
            const response = await fetch('/gne-fleet-database.json')
            if (response.ok) {
              const data = await response.json()
              
              set({
                fleetDatabase: data,
                isLoading: false,
                lastUpdated: Date.now(),
                offlineData: data // Cache for offline use
              })

              return data
            } else {
              throw new Error('Failed to load fleet database')
            }
          } catch (error) {
            console.error('Fleet database load error:', error)
            
            // Use offline data if available
            const { offlineData } = get()
            if (offlineData) {
              set({
                fleetDatabase: offlineData,
                isLoading: false
              })
              return offlineData
            }
            
            set({ isLoading: false })
            throw error
          }
        },

        searchVehicle: (fleetNumber) => {
          const { fleetDatabase, searchHistory } = get()
          
          if (!fleetDatabase) return null

          const vehicle = fleetDatabase.fleet?.find(v => 
            v.fleetNumber === fleetNumber.toString()
          )

          if (vehicle) {
            // Add to search history
            const newHistory = [fleetNumber, ...searchHistory.filter(f => f !== fleetNumber)].slice(0, 10)
            set({ searchHistory: newHistory })
          }

          return vehicle
        },

        addToFavorites: (fleetNumber) => {
          set(state => ({
            favoriteVehicles: [...new Set([fleetNumber, ...state.favoriteVehicles])].slice(0, 20)
          }))
        },

        removeFromFavorites: (fleetNumber) => {
          set(state => ({
            favoriteVehicles: state.favoriteVehicles.filter(f => f !== fleetNumber)
          }))
        },

        addToRecent: (fleetNumber) => {
          set(state => ({
            recentVehicles: [fleetNumber, ...state.recentVehicles.filter(f => f !== fleetNumber)].slice(0, 10)
          }))
        },

        clearHistory: () => {
          set({
            searchHistory: [],
            recentVehicles: []
          })
        }
      }),
      {
        name: 'fleet-data',
        storage: createJSONStorage(() => createPlatformStorage()),
        partialize: (state) => ({
          favoriteVehicles: state.favoriteVehicles,
          recentVehicles: state.recentVehicles,
          searchHistory: state.searchHistory,
          offlineData: state.offlineData,
          lastUpdated: state.lastUpdated
        })
      }
    )
  )
)

// Session management with auto-logout
const setupSessionManagement = () => {
  // Check session validity periodically
  setInterval(() => {
    const supervisorStore = useSupervisorStore.getState()
    if (supervisorStore.isAuthenticated && !supervisorStore.checkSession()) {
      console.log('Session expired, logging out')
    }
  }, 60000) // Check every minute

  // Auto-save wizard progress
  let lastProgressSave = 0
  useWizardStore.subscribe(
    (state) => state.responses,
    (responses) => {
      const now = Date.now()
      if (now - lastProgressSave > 30000) { // Save every 30 seconds
        const wizardStore = useWizardStore.getState()
        if (wizardStore.assessmentId) {
          wizardStore.saveProgress()
          lastProgressSave = now
        }
      }
    }
  )
}

// Initialize session management if in browser environment
if (typeof window !== 'undefined') {
  setupSessionManagement()
}

export default {
  useSupervisorStore,
  useWizardStore,
  useFleetStore
}