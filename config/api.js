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
    default: 15000,      // 15 seconds (increased from 8s)
    upload: 30000,       // 30 seconds
    reports: 45000       // 45 seconds
  },
  
  // Endpoints
  endpoints: {
    alerts: '/api/alerts',
    alertsEnhanced: '/api/alerts-enhanced', 
    incidents: '/api/incidents',
    reports: '/api/reports',
    messaging: '/api/messaging',
    supervisor: '/api/supervisor',
    geocoding: '/api/geocode',
    routes: '/api/routes',
    health: '/api/health'
  }
};

// Enhanced fetch function with production-only URLs
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${PRODUCTION_API_URL}${endpoint}`;
  const timeout = options.timeout || API_CONFIG.timeouts.default;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`🔄 API Request: ${url}`);
    
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
    console.log(`✅ API Success: ${url}`);
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ API Error for ${endpoint}: ${error.message}`);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - backend may be starting up');
    }
    throw error;
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