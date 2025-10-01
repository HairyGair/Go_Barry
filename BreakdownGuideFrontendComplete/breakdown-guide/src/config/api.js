// API Configuration for Standalone Breakdown Guide
// Configures endpoints to use dedicated backend at port 3003

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction

// API Base URL Configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: isProduction 
    ? '' // In production, API is served from same origin
    : 'http://localhost:3003', // In development, dedicated backend

  // Timeout configurations
  TIMEOUT: {
    DEFAULT: 10000,   // 10 seconds
    UPLOAD: 30000,    // 30 seconds for uploads
    LONG_RUNNING: 60000 // 1 minute for long operations
  },

  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000, // 1 second base delay
    BACKOFF: 1.5 // Exponential backoff multiplier
  },

  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API Endpoints
export const ENDPOINTS = {
  // Health Check
  HEALTH: '/api/health',
  HEALTH_DETAILED: '/api/health/detailed',

  // Breakdown Tracking (V2 API)
  BREAKDOWNS: {
    START: '/api/breakdowns/start',
    LOCATION: (id) => `/api/breakdowns/location/${id}`,
    STEP: '/api/breakdowns/step',
    DIAGNOSE: '/api/breakdowns/diagnose',
    RESOLVE: (id) => `/api/breakdowns/${id}/resolve`,
    LIVE: '/api/breakdowns/live',
    TODAY: '/api/breakdowns/today',
    FLEET_HISTORY: (fleetNumber) => `/api/breakdowns/fleet/${fleetNumber}/history`,
    HOTSPOTS: '/api/breakdowns/hotspots',
    STATS: '/api/breakdowns/stats',
    DASHBOARD: '/api/breakdowns/dashboard'
  },

  // Analytics
  ANALYTICS: {
    DEPOT_KPIS: '/api/breakdown-analytics/depot-kpis',
    PATTERNS: '/api/breakdown-analytics/patterns',
    FLEET_HEALTH: '/api/breakdown-analytics/fleet-health',
    SUPERVISOR_PERFORMANCE: '/api/breakdown-analytics/supervisor-performance'
  },

  // Assessments
  ASSESSMENTS: {
    LOG: '/api/breakdown-assessments/log',
    RECENT: '/api/breakdown-assessments/recent'
  },

  // Admin
  ADMIN: {
    ALL_BREAKDOWNS: '/api/admin-breakdowns',
    STATS: '/api/admin-breakdowns/stats',
    DELETE: (id) => `/api/admin-breakdowns/${id}`
  },

  // Fleet Database
  FLEET: {
    SEARCH: '/api/fleet-database/search',
    VEHICLE: (number) => `/api/fleet-database/vehicle/${number}`,
    DEPOT: (depot) => `/api/fleet-database/depot/${depot}`,
    DATABASE: '/gne-fleet-database.json' // Static file
  },

  // Supervisor Authentication
  SUPERVISOR: {
    LOGIN: '/api/supervisor/login',
    VERIFY: '/api/supervisor/verify',
    STATE: '/api/supervisor/state'
  }
}

// Create full URL for endpoint
export const createApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  // Replace URL parameters if endpoint is a function
  if (typeof endpoint === 'function') {
    url = `${API_CONFIG.BASE_URL}${endpoint(params)}`
  }

  return url
}

// HTTP Client with retry logic
export class ApiClient {
  constructor(config = {}) {
    this.config = {
      ...API_CONFIG,
      ...config
    }
  }

  async request(endpoint, options = {}) {
    const url = createApiUrl(endpoint)
    const config = {
      timeout: this.config.TIMEOUT.DEFAULT,
      headers: {
        ...this.config.HEADERS,
        ...options.headers
      },
      ...options
    }

    let lastError
    let delay = this.config.RETRY.DELAY

    for (let attempt = 0; attempt < this.config.RETRY.ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Log successful requests in development
        if (isDevelopment) {
          console.log(`✅ API Request: ${config.method || 'GET'} ${url}`, data)
        }

        return data
      } catch (error) {
        lastError = error
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            (error.message && error.message.includes('4'))) {
          break
        }

        // Wait before retrying
        if (attempt < this.config.RETRY.ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= this.config.RETRY.BACKOFF
        }
      }
    }

    console.error(`❌ API Request failed: ${url}`, lastError)
    throw lastError
  }

  // Convenience methods
  get(endpoint, params = {}) {
    const url = new URL(createApiUrl(endpoint))
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    
    return this.request(url.pathname + url.search, { method: 'GET' })
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Upload with progress
  async upload(endpoint, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
      timeout: this.config.TIMEOUT.UPLOAD
    }

    if (onProgress && typeof onProgress === 'function') {
      // Note: Progress tracking would need XMLHttpRequest for upload progress
      console.warn('Upload progress tracking not implemented with fetch API')
    }

    return this.request(endpoint, config)
  }
}

// Default API client instance
export const apiClient = new ApiClient()

// Helper function to check if API is available
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.HEALTH)
    return response.success === true
  } catch (error) {
    console.warn('API health check failed:', error)
    return false
  }
}

// Connection status monitoring
export class ConnectionMonitor {
  constructor(onStatusChange = null) {
    this.isOnline = navigator.onLine
    this.apiAvailable = false
    this.onStatusChange = onStatusChange
    this.checkInterval = null
    
    this.startMonitoring()
  }

  startMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Check API health periodically
    this.checkInterval = setInterval(() => {
      this.checkApiHealth()
    }, 30000) // Every 30 seconds
    
    // Initial check
    this.checkApiHealth()
  }

  stopMonitoring() {
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }

  async checkApiHealth() {
    const wasAvailable = this.apiAvailable
    this.apiAvailable = await checkApiHealth()
    
    if (wasAvailable !== this.apiAvailable && this.onStatusChange) {
      this.onStatusChange({
        isOnline: this.isOnline,
        apiAvailable: this.apiAvailable
      })
    }
  }

  handleOnline() {
    this.isOnline = true
    this.checkApiHealth()
  }

  handleOffline() {
    this.isOnline = false
    this.apiAvailable = false
    
    if (this.onStatusChange) {
      this.onStatusChange({
        isOnline: false,
        apiAvailable: false
      })
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      apiAvailable: this.apiAvailable
    }
  }
}

export default {
  API_CONFIG,
  ENDPOINTS,
  createApiUrl,
  ApiClient,
  apiClient,
  checkApiHealth,
  ConnectionMonitor
}