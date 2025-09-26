// Enhanced Supabase client configuration with comprehensive error handling and session management
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oieliubbvvdzhzvikzal.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8'

// Enhanced Supabase client options
const supabaseOptions = {
  auth: {
    // Session persistence configuration
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,

    // Storage configuration
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.warn('LocalStorage access failed:', error)
          return null
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.warn('LocalStorage write failed:', error)
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn('LocalStorage remove failed:', error)
        }
      }
    }
  },

  // Enhanced global configuration
  global: {
    headers: {
      'X-Client-Info': 'gne-breakdown-guide@1.0.0'
    }
  },

  // Database configuration
  db: {
    schema: 'public'
  },

  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// Create enhanced Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Error types and classifications
export const ERROR_TYPES = {
  NETWORK: 'network_error',
  AUTH: 'auth_error',
  PERMISSION: 'permission_error',
  VALIDATION: 'validation_error',
  RATE_LIMIT: 'rate_limit_error',
  SERVER: 'server_error',
  UNKNOWN: 'unknown_error'
}

// Network connectivity checker
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine
    this.listeners = new Set()

    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners(true)
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners(false)
    })
  }

  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners(isOnline) {
    this.listeners.forEach(callback => callback(isOnline))
  }
}

export const networkMonitor = new NetworkMonitor()

// Enhanced error handler
export const handleSupabaseError = (error, context = '') => {
  const timestamp = new Date().toISOString()

  console.group(`🔴 Supabase Error [${context}] - ${timestamp}`)
  console.error('Original error:', error)

  let errorType = ERROR_TYPES.UNKNOWN
  let userMessage = 'An unexpected error occurred. Please try again.'
  let shouldRetry = false
  let retryDelay = 1000

  if (!error) {
    console.groupEnd()
    return { type: ERROR_TYPES.UNKNOWN, message: userMessage, shouldRetry: false }
  }

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network') || !networkMonitor.isOnline) {
    errorType = ERROR_TYPES.NETWORK
    userMessage = 'Connection problem. Please check your internet connection and try again.'
    shouldRetry = true
    retryDelay = 2000
  }

  // Authentication errors - use generic message to prevent email enumeration
  else if (error.message?.includes('Invalid login credentials') || error.status === 401) {
    errorType = ERROR_TYPES.AUTH
    userMessage = 'Invalid credentials. Please check your email and password.'
    shouldRetry = false
  }

  // Permission errors
  else if (error.message?.includes('permission') || error.status === 403) {
    errorType = ERROR_TYPES.PERMISSION
    userMessage = 'You do not have permission to perform this action.'
    shouldRetry = false
  }

  // Rate limiting
  else if (error.status === 429) {
    errorType = ERROR_TYPES.RATE_LIMIT
    userMessage = 'Too many requests. Please wait a moment and try again.'
    shouldRetry = true
    retryDelay = 5000
  }

  // Server errors
  else if (error.status >= 500) {
    errorType = ERROR_TYPES.SERVER
    userMessage = 'Server error. Please try again in a few moments.'
    shouldRetry = true
    retryDelay = 3000
  }

  // Validation errors
  else if (error.message?.includes('duplicate') || error.message?.includes('constraint')) {
    errorType = ERROR_TYPES.VALIDATION
    userMessage = 'Invalid data provided. Please check your input and try again.'
    shouldRetry = false
  }

  const result = {
    type: errorType,
    message: userMessage,
    shouldRetry,
    retryDelay,
    originalError: error,
    timestamp,
    context
  }

  console.log('Processed error:', result)
  console.groupEnd()

  return result
}

// Retry mechanism with exponential backoff
export const withRetry = async (operation, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    context = 'unknown'
  } = options

  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts} for ${context}`)

      // Check network connectivity before attempting
      if (!networkMonitor.isOnline) {
        throw new Error('No internet connection')
      }

      const result = await operation()

      if (attempt > 1) {
        console.log(`✅ ${context} succeeded on attempt ${attempt}`)
      }

      return { success: true, data: result, attempt }

    } catch (error) {
      lastError = error
      const errorInfo = handleSupabaseError(error, context)

      console.warn(`❌ Attempt ${attempt} failed for ${context}:`, errorInfo.message)

      // Don't retry if it's not a retryable error
      if (!errorInfo.shouldRetry || attempt === maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )

      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  const finalError = handleSupabaseError(lastError, context)
  return {
    success: false,
    error: finalError,
    attempts: maxAttempts
  }
}

// Session management with auto-refresh
class SessionManager {
  constructor() {
    this.refreshTimer = null
    this.isRefreshing = false
    this.listeners = new Set()

    // Start monitoring session
    this.initializeSessionMonitoring()
  }

  async initializeSessionMonitoring() {
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 Auth state changed: ${event}`, session?.user?.email || 'No user')

      if (event === 'SIGNED_IN' && session) {
        this.startAutoRefresh(session)
      } else if (event === 'SIGNED_OUT') {
        this.stopAutoRefresh()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('✅ Token refreshed successfully')
        this.startAutoRefresh(session)
      }

      // Notify listeners
      this.notifyListeners(event, session)
    })

    // Check for existing session
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        this.startAutoRefresh(session)
      }
    } catch (error) {
      console.error('Failed to check existing session:', error)
    }
  }

  startAutoRefresh(session) {
    this.stopAutoRefresh()

    if (!session.expires_at) return

    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // Refresh 5 minutes before expiry
    const refreshIn = Math.max(timeUntilExpiry - (5 * 60 * 1000), 30000)

    if (refreshIn > 0) {
      console.log(`🔄 Scheduling token refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`)

      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, refreshIn)
    }
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async refreshSession() {
    if (this.isRefreshing) return

    this.isRefreshing = true

    try {
      console.log('🔄 Refreshing session...')
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      console.log('✅ Session refreshed successfully')
      return data.session

    } catch (error) {
      console.error('❌ Session refresh failed:', error)

      // If refresh fails, try to get current session
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Session is invalid, sign out
          console.log('🚪 Session invalid, signing out...')
          await supabase.auth.signOut()
        }
      } catch (getSessionError) {
        console.error('Failed to check session after refresh failure:', getSessionError)
      }

      throw error
    } finally {
      this.isRefreshing = false
    }
  }

  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners(event, session) {
    this.listeners.forEach(callback => {
      try {
        callback(event, session)
      } catch (error) {
        console.error('Session listener error:', error)
      }
    })
  }
}

export const sessionManager = new SessionManager()

// Production table mapping:
// vehicles → fleet_vehicles
// supervisors → supervisors (email authentication only)
// assessment_logs → wizard_progress

// Enhanced authentication helpers with comprehensive error handling
export const authHelpers = {
  // Sign in with email/password
  async signInWithPassword(email, password, rememberMe = true) {
    const operation = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) throw error

      // Get supervisor details after successful auth
      if (data.user) {
        const supervisor = await this.getSupervisorByEmail(data.user.email)

        // Store remember me preference
        if (rememberMe) {
          try {
            localStorage.setItem('supabase_remember_me', 'true')
          } catch (storageError) {
            console.warn('Failed to store remember me preference:', storageError)
          }
        }

        return { user: data.user, supervisor, session: data.session }
      }

      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'signInWithPassword'
    })

    if (result.success) {
      console.log('✅ Authentication successful:', result.data.user?.email)
      return result.data
    } else {
      console.error('❌ Authentication failed:', result.error.message)
      throw new Error(result.error.message)
    }
  },

  // Get current session with enhanced error handling
  async getCurrentSession() {
    const operation = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session) {
        const supervisor = await this.getSupervisorByEmail(session.user.email)
        return { session, supervisor }
      }

      return { session: null, supervisor: null }
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getCurrentSession'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('Failed to get current session:', result.error)
      return { session: null, supervisor: null }
    }
  },

  // Alias for getSession (for backward compatibility)
  async getSession() {
    try {
      const { session } = await this.getCurrentSession()
      return session
    } catch (error) {
      console.error('getSession error:', error)
      return null
    }
  },

  // Get supervisor by email with retry
  async getSupervisorByEmail(email) {
    const operation = async () => {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getSupervisorByEmail'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('Failed to get supervisor:', result.error)
      return null
    }
  },

  // Enhanced sign out with cleanup
  async signOut() {
    const operation = async () => {
      // Clear remember me preference
      try {
        localStorage.removeItem('supabase_remember_me')
      } catch (storageError) {
        console.warn('Failed to clear remember me preference:', storageError)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return true
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'signOut'
    })

    if (result.success) {
      console.log('✅ Sign out successful')
      return true
    } else {
      console.error('❌ Sign out failed:', result.error.message)

      // Force local cleanup even if server signout fails
      try {
        localStorage.removeItem('supabase_remember_me')
        // Clear any Supabase auth tokens from localStorage
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
        console.log('🧹 Local auth data cleared')
      } catch (cleanupError) {
        console.warn('Failed to clear local auth data:', cleanupError)
      }

      throw new Error(result.error.message)
    }
  },

  // Enhanced auth state change listener
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      try {
        console.log(`🔐 Auth state: ${event}`, session?.user?.email || 'No user')
        callback(event, session)
      } catch (error) {
        console.error('Auth state change callback error:', error)
      }
    })
  },

  // Check if user has remember me enabled
  hasRememberMe() {
    try {
      return localStorage.getItem('supabase_remember_me') === 'true'
    } catch (error) {
      return false
    }
  },

  // Get session health information
  async getSessionHealth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        return { healthy: false, error: error.message }
      }

      if (!session) {
        return { healthy: false, reason: 'no_session' }
      }

      const now = Date.now() / 1000
      const expiresAt = session.expires_at
      const timeUntilExpiry = (expiresAt - now) * 1000 // Convert to milliseconds

      return {
        healthy: true,
        session,
        expiresAt: new Date(expiresAt * 1000),
        timeUntilExpiry,
        expiresIn: Math.round(timeUntilExpiry / 1000 / 60), // Minutes
        needsRefresh: timeUntilExpiry < (10 * 60 * 1000) // Less than 10 minutes
      }
    } catch (error) {
      return { healthy: false, error: error.message }
    }
  }
}

// Enhanced helper functions with comprehensive error handling and retry logic
export const supabaseHelpers = {
  // Breakdown operations with enhanced error handling
  async createBreakdown(breakdown) {
    const operation = async () => {
      // Validate required fields
      if (!breakdown.fleet_no || !breakdown.supervisor_id) {
        throw new Error('Fleet number and supervisor ID are required')
      }

      const { data, error } = await supabase
        .from('breakdowns')
        .insert({
          ...breakdown,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 3,
      context: 'createBreakdown'
    })

    if (result.success) {
      console.log('✅ Breakdown created:', result.data.id)
      return result.data
    } else {
      console.error('❌ Failed to create breakdown:', result.error.message)
      throw new Error(result.error.message)
    }
  },

  async updateBreakdown(id, updates) {
    const operation = async () => {
      if (!id) {
        throw new Error('Breakdown ID is required for update')
      }

      const { data, error } = await supabase
        .from('breakdowns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 3,
      context: 'updateBreakdown'
    })

    if (result.success) {
      console.log('✅ Breakdown updated:', id)
      return result.data
    } else {
      console.error('❌ Failed to update breakdown:', result.error.message)
      throw new Error(result.error.message)
    }
  },

  async getActiveBreakdowns(limit = 100) {
    const operation = async () => {
      const { data, error } = await supabase
        .from('breakdowns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getActiveBreakdowns'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to get active breakdowns:', result.error.message)
      return []
    }
  },

  async getBreakdownHistory(supervisorId, limit = 50) {
    const operation = async () => {
      let query = supabase
        .from('breakdowns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (supervisorId) {
        query = query.eq('supervisor_id', supervisorId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getBreakdownHistory'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to get breakdown history:', result.error.message)
      return []
    }
  },

  // Enhanced vehicle operations
  async getVehicles(limit = 1000) {
    const operation = async () => {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .order('fleet_no')
        .limit(limit)

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getVehicles'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to get vehicles:', result.error.message)
      return []
    }
  },

  async getVehicleByFleetNo(fleetNo) {
    const operation = async () => {
      if (!fleetNo) {
        throw new Error('Fleet number is required')
      }

      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .eq('fleet_no', fleetNo)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getVehicleByFleetNo'
    })

    if (result.success) {
      return result.data
    } else {
      console.error(`❌ Failed to get vehicle ${fleetNo}:`, result.error.message)
      return null
    }
  },

  async searchVehicles(searchTerm, limit = 20) {
    const operation = async () => {
      if (!searchTerm) return []

      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .or(`fleet_no.ilike.%${searchTerm}%,vehicle_type.ilike.%${searchTerm}%,depot.ilike.%${searchTerm}%`)
        .order('fleet_no')
        .limit(limit)

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'searchVehicles'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to search vehicles:', result.error.message)
      return []
    }
  },

  // Enhanced assessment operations
  async saveAssessmentProgress(progress) {
    const operation = async () => {
      // Validate required fields
      if (!progress.supervisor_id || !progress.wizard_type) {
        throw new Error('Supervisor ID and wizard type are required')
      }

      const { data, error } = await supabase
        .from('wizard_progress')
        .insert({
          ...progress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 3,
      context: 'saveAssessmentProgress'
    })

    if (result.success) {
      console.log('✅ Assessment progress saved:', result.data.id)
      return result.data
    } else {
      console.error('❌ Failed to save assessment progress:', result.error.message)
      throw new Error(result.error.message)
    }
  },

  async getAssessmentHistory(supervisorId, limit = 50) {
    const operation = async () => {
      let query = supabase
        .from('wizard_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (supervisorId) {
        query = query.eq('supervisor_id', supervisorId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getAssessmentHistory'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to get assessment history:', result.error.message)
      return []
    }
  },

  // Supervisor operations
  async getSupervisors() {
    const operation = async () => {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context: 'getSupervisors'
    })

    if (result.success) {
      return result.data
    } else {
      console.error('❌ Failed to get supervisors:', result.error.message)
      return []
    }
  },

  // Health check for database connectivity
  async healthCheck() {
    const operation = async () => {
      const { data, error } = await supabase
        .from('supervisors')
        .select('count')
        .limit(1)

      if (error) throw error
      return { healthy: true, timestamp: new Date().toISOString() }
    }

    const result = await withRetry(operation, {
      maxAttempts: 1,
      context: 'healthCheck'
    })

    if (result.success) {
      return result.data
    } else {
      return {
        healthy: false,
        error: result.error.message,
        timestamp: new Date().toISOString()
      }
    }
  },

  // Generic query builder with error handling
  async executeQuery(tableName, queryBuilder, context = 'genericQuery') {
    const operation = async () => {
      const { data, error } = await queryBuilder(supabase.from(tableName))
      if (error) throw error
      return data
    }

    const result = await withRetry(operation, {
      maxAttempts: 2,
      context
    })

    if (result.success) {
      return result.data
    } else {
      console.error(`❌ Query failed for ${tableName}:`, result.error.message)
      throw new Error(result.error.message)
    }
  }
}
