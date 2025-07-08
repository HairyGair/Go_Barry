// Go_BARRY/config/api.js
// Production API configuration for gobarry.co.uk deployment

// Force production URL - never use localhost in production
const PRODUCTION_API_URL = 'https://go-barry.onrender.com';
const isDevelopment = false; // Force production mode

export const API_CONFIG = {
  // Always use production backend
  baseURL: PRODUCTION_API_URL,
  
  // Remove localhost from fallback URLs
  fallbackURLs: [
    PRODUCTION_API_URL
  ],
  
  // Refresh intervals (browser optimized)
  refreshIntervals: {
    dashboard: 30000,    // 30 seconds
    alerts: 20000,       // 20 seconds (faster for browser)
    incidents: 15000,    // 15 seconds
    operational: 25000,  // 25 seconds for maps/traffic view
    reports: 60000       // 1 minute
  },
  
  // Request timeouts (increased for Render cold starts)
  timeouts: {
    default: 45000,      // 45 seconds (increased for Render wake-up)
    upload: 60000,       // 60 seconds
    reports: 90000       // 90 seconds
  },
  
  // Endpoints
  endpoints: {
    // Core alerts
    alerts: '/api/alerts',
    alertsEnhanced: '/api/alerts-enhanced',
    alertsTest: '/api/alerts-test',
    
    // Service frequency monitoring
    serviceFrequency: '/api/service-frequency',
    serviceFrequencyDashboard: '/api/service-frequency/dashboard',
    serviceFrequencyNetworkStatus: '/api/service-frequency/network-status',
    serviceFrequencyBreakdownAlerts: '/api/service-frequency/breakdown-alerts',
    serviceFrequencyTrends: '/api/service-frequency/trends',
    serviceFrequencyStatus: '/api/service-frequency/status',
    serviceFrequencyRoute: '/api/service-frequency/route',
    
    // Disruption logging
    disruptionsLog: '/api/disruptions/log',
    disruptionsLogs: '/api/disruptions/logs',
    disruptionsStatistics: '/api/disruptions/statistics',
    disruptionsHealth: '/api/disruptions/health',
    
    // StreetManager integration
    streetManagerActivities: '/api/streetmanager/activities',
    streetManagerPermits: '/api/streetmanager/permits',
    streetManagerAll: '/api/streetmanager/all',
    streetManagerStatus: '/api/streetmanager/status',
    streetManagerWebhook: '/api/streetmanager/webhook',
    
    // Legacy endpoints
    incidents: '/api/incidents',
    reports: '/api/reports',
    messaging: '/api/messaging',
    supervisor: '/api/supervisor',
    geocoding: '/api/geocode',
    routes: '/api/routes',
    health: '/api/health',
    
    // System endpoints
    config: '/api/config',
    status: '/api/status',
    refresh: '/api/refresh',
    debugTraffic: '/api/debug-traffic'
  }
};

// Enhanced fetch function with retry logic for sleeping backends
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${PRODUCTION_API_URL}${endpoint}`;
  const timeout = options.timeout || API_CONFIG.timeouts.default;
  const maxRetries = options.maxRetries || 2;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`🔄 API Request (attempt ${attempt}/${maxRetries + 1}): ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BARRY-Browser/3.0',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success (attempt ${attempt}): ${url}`);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ API Error (attempt ${attempt}) for ${endpoint}: ${error.message}`);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries + 1) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out - backend is likely starting up. Please wait a moment and try again.');
        }
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // 2s, 4s, 8s, max 10s
      console.log(`⏳ Retrying in ${delay/1000}s... (backend may be waking up)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Override any environment-based URLs to force production
export const getApiUrl = (endpoint = '') => {
  return `${PRODUCTION_API_URL}${endpoint}`;
};

// Environment info for debugging
export const ENV_INFO = {
  isDevelopment: false,
  apiBaseUrl: PRODUCTION_API_URL,
  platform: typeof window !== 'undefined' ? 'browser' : 'mobile',
  timestamp: new Date().toISOString(),
  mode: 'PRODUCTION_FORCED'
};

export default API_CONFIG;