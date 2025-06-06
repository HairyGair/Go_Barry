// Go_BARRY/config/api.production.js
// Final production API configuration for gobarry.co.uk

export const API_CONFIG = {
  // Production configuration for gobarry.co.uk
  baseURL: 'https://api.gobarry.co.uk',
  
  // Fallback URLs in order of preference
  fallbackURLs: [
    'https://api.gobarry.co.uk',
    'https://gobarry.co.uk/api'  // In case you put backend in subfolder
  ],
  
  // Optimized timeouts for production
  timeouts: {
    default: 10000,    // 10 seconds
    upload: 30000,     // 30 seconds
    reports: 45000     // 45 seconds
  },
  
  // Refresh intervals for production
  refreshIntervals: {
    dashboard: 30000,    // 30 seconds
    alerts: 60000,       // 1 minute - less aggressive for production
    incidents: 45000,    // 45 seconds
    operational: 90000,  // 1.5 minutes
    reports: 300000      // 5 minutes
  },
  
  // API endpoints
  endpoints: {
    alerts: '/api/alerts',
    alertsEnhanced: '/api/alerts-enhanced', 
    incidents: '/api/incidents',
    reports: '/api/reports',
    messaging: '/api/messaging',
    supervisor: '/api/supervisor',
    geocoding: '/api/geocode',
    routes: '/api/routes',
    health: '/api/health',
    status: '/api/status'
  },
  
  // Production settings
  production: {
    domain: 'gobarry.co.uk',
    apiDomain: 'api.gobarry.co.uk',
    environment: 'production',
    debugging: false,
    analytics: true
  }
};

// Enhanced fetch function with production optimizations
export const apiRequest = async (endpoint, options = {}) => {
  const timeout = options.timeout || API_CONFIG.timeouts.default;
  
  // Try main API URL first
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoBarry-Production/1.0',
        'X-Domain': 'gobarry.co.uk',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

// Production environment info
export const ENV_INFO = {
  domain: 'gobarry.co.uk',
  apiUrl: API_CONFIG.baseURL,
  environment: 'production',
  version: '1.0.0',
  buildTime: new Date().toISOString()
};

export default API_CONFIG;
