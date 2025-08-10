import { create } from 'zustand'

export const useSupervisorStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  supervisorSession: null,
  loginAttempts: 0,
  lastLoginTime: null,

  // Actions
  login: async (supervisorId) => {
    try {
      // Simulate the existing login logic
      const loginResponse = await window.SupervisorLogin?.authenticate(supervisorId)
      
      if (loginResponse?.success) {
        const session = {
          supervisorId,
          name: loginResponse.name,
          depot: loginResponse.depot,
          permissions: loginResponse.permissions,
          loginTime: new Date().toISOString()
        }

        set({
          isAuthenticated: true,
          supervisorSession: session,
          lastLoginTime: new Date(),
          loginAttempts: 0
        })

        // Update legacy systems
        if (window.SupervisorBreakdownLogger) {
          window.SupervisorBreakdownLogger.setSupervisor(session)
        }
        if (window.BreakdownAnalytics) {
          window.BreakdownAnalytics.setSupervisor(session)
        }

        return { success: true, session }
      } else {
        set(state => ({
          loginAttempts: state.loginAttempts + 1
        }))
        return { success: false, error: 'Invalid supervisor ID' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      supervisorSession: null,
      loginAttempts: 0
    })

    // Clear legacy systems
    if (window.SupervisorBreakdownLogger) {
      window.SupervisorBreakdownLogger.clearSupervisor()
    }
    if (window.BreakdownAnalytics) {
      window.BreakdownAnalytics.clearSupervisor()
    }
  },

  // Getters
  getSupervisor: () => get().supervisorSession,
  hasPermission: (permission) => {
    const session = get().supervisorSession
    return session?.permissions?.includes(permission) || false
  },

  // Session management
  refreshSession: async () => {
    const session = get().supervisorSession
    if (!session) return false

    try {
      // Validate session is still active
      const isValid = await window.SupervisorLogin?.validateSession(session.supervisorId)
      if (!isValid) {
        get().logout()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      get().logout()
      return false
    }
  }
}))

// Auto-refresh session every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useSupervisorStore.getState()
    if (store.isAuthenticated) {
      store.refreshSession()
    }
  }, 30000)
}