// Go_BARRY/config/api.js
// Centralized API configuration for BARRY Traffic App

// Determine if we're in development mode
const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  baseURL: __DEV__ ? 'http://localhost:3001' : 'https://go-barry.onrender.com',
  
  // Alternative URLs for fallback (in case primary fails)
  fallbackURL: 'https://go-barry.onrender.com',
  
  // API Endpoints
  endpoints: {
    alerts: '/api/alerts',
    alertsTest: '/api/alerts-test',
    health: '/api/health',
    refresh: '/api/refresh',
    acknowledge: '/api/acknowledge',
    note: '/api/note',
    config: '/api/config',
    debugTraffic: '/api/debug-traffic',
    
    // Route Management & Visualization
    routes: '/api/routes',
    routeVisualization: '/api/routes/:routeNumber/visualization',
    routeInfo: '/api/routes/:routeNumber/info',
    routeStops: '/api/routes/:routeNumber/stops',
    routesInArea: '/api/routes/area',
    routeSearch: '/api/routes/search',
    
    // Service Frequency Analysis
    frequencyDashboard: '/api/routes/frequency/dashboard',
    frequencyDashboardSummary: '/api/routes/frequency/dashboard-summary',
    breakdownAlerts: '/api/routes/frequency/breakdown-alerts',
    frequencyTrends: '/api/routes/frequency/trends',
    frequencyNetwork: '/api/routes/frequency/network',
    frequencyStats: '/api/routes/frequency/stats',
    
    // AI Disruption Management
    disruptionAIInit: '/api/disruption/ai/initialize',
    disruptionSuggest: '/api/disruption/ai/suggest-diversion',
    disruptionPassengerImpact: '/api/disruption/ai/passenger-impact',
    disruptionNetworkInsights: '/api/disruption/ai/network-insights',
    
    // Message Generation
    messagesGenerate: '/api/disruption/messages/generate',
    messagesPlatform: '/api/disruption/messages/platform/:platform',
    
    // Complete Workflow
    disruptionWorkflow: '/api/disruption/workflow/complete',
    disruptionStats: '/api/disruption/stats',
    disruptionHealth: '/api/disruption/health',
    disruptionExamples: '/api/disruption/examples'
  },
  
  // Request timeouts (in milliseconds)
  timeouts: {
    default: 10000,  // 10 seconds
    health: 5000,    // 5 seconds
    alerts: 15000    // 15 seconds for alerts (can be slow)
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000  // 1 second between retries
  },
  
  // Refresh intervals (in milliseconds)
  refreshIntervals: {
    alerts: 5 * 60 * 1000,      // 5 minutes
    dashboard: 30 * 1000,       // 30 seconds for dashboard
    operational: 3 * 60 * 1000  // 3 minutes for operational view
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint, useBase = true) => {
  const base = useBase ? API_CONFIG.baseURL : '';
  const path = API_CONFIG.endpoints[endpoint] || endpoint;
  return `${base}${path}`;
};

// Helper function to get timeout for specific endpoint
export const getTimeout = (endpoint) => {
  if (endpoint === 'health') return API_CONFIG.timeouts.health;
  if (endpoint === 'alerts') return API_CONFIG.timeouts.alerts;
  return API_CONFIG.timeouts.default;
};

// Enhanced fetch function with retry and timeout
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const timeout = getTimeout(endpoint);
  
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  // Add timeout to fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
};

// Predefined API calls
export const api = {
  // Get all alerts
  getAlerts: () => apiRequest('alerts'),
  
  // Get test alerts
  getTestAlerts: () => apiRequest('alertsTest'),
  
  // Get system health
  getHealth: () => apiRequest('health'),
  
  // Refresh data
  refresh: () => apiRequest('refresh'),
  
  // Get config
  getConfig: () => apiRequest('config'),
  
  // Debug traffic APIs
  debugTraffic: () => apiRequest('debugTraffic'),
  
  // Acknowledge alert (POST)
  acknowledgeAlert: (alertId, duty) => 
    apiRequest('acknowledge', {
      method: 'POST',
      body: JSON.stringify({ alertId, duty })
    }),
  
  // Add note to alert (POST)
  addNote: (alertId, duty, note) =>
    apiRequest('note', {
      method: 'POST',
      body: JSON.stringify({ alertId, duty, note })
    })
};

// Environment info
export const ENV_INFO = {
  isDevelopment: __DEV__,
  apiBaseUrl: API_CONFIG.baseURL,
  version: '1.0.0'
};

// Debug function to test API connectivity
export const testApiConnectivity = async () => {
  console.log('🔧 Testing API connectivity...');
  
  try {
    const health = await api.getHealth();
    console.log('✅ Health check passed:', health.data);
    
    const alerts = await api.getTestAlerts();
    console.log('✅ Test alerts loaded:', alerts.data?.alerts?.length || 0);
    
    return {
      success: true,
      health: health.data,
      testAlerts: alerts.data?.alerts?.length || 0
    };
    
  } catch (error) {
    console.error('❌ API connectivity test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export default config
export default API_CONFIG;