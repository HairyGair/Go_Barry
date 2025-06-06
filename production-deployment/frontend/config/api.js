// Go_BARRY/config/api.js
// Production API configuration for gobarry.co.uk deployment

export const API_CONFIG = {
  // Production configuration for gobarry.co.uk
  baseURL: (() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development
        return 'http://localhost:3001';
      }
      // Production - always use api subdomain
      return 'https://api.gobarry.co.uk';
    } else {
      // React Native or build environment
      return 'https://api.gobarry.co.uk';
    }
  })(),
  
  // Fallback URLs for redundancy
  fallbackURLs: [
    'http://localhost:3001',
    'https://api.gobarry.co.uk',
    'https://go-barry.onrender.com'
  ],
  
  // Refresh intervals (browser optimized)
  refreshIntervals: {
    dashboard: 30000,    // 30 seconds
    alerts: 20000,       // 20 seconds (faster for browser)
    incidents: 15000,    // 15 seconds
    operational: 25000,  // 25 seconds for maps/traffic view
    reports: 60000       // 1 minute
  },
  
  // Request timeouts
  timeouts: {
    default: 8000,       // 8 seconds (faster for browser)
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

// Enhanced fetch function with automatic fallback
export const apiRequest = async (endpoint, options = {}) => {
  const urls = [API_CONFIG.baseURL, ...API_CONFIG.fallbackURLs.filter(url => url !== API_CONFIG.baseURL)];
  const timeout = options.timeout || API_CONFIG.timeouts.default;
  
  for (const baseURL of urls) {
    const url = `${baseURL}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`🔄 Trying: ${url}`);
      
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
      console.log(`✅ Success: ${url}`);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`❌ Failed: ${url} - ${error.message}`);
      
      // If this is the last URL, throw the error
      if (baseURL === urls[urls.length - 1]) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out on all endpoints');
        }
        throw error;
      }
      // Otherwise, continue to next URL
    }
  }
};

// Environment info for debugging
export const ENV_INFO = {
  isDevelopment: typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
  apiBaseUrl: API_CONFIG.baseURL,
  platform: typeof window !== 'undefined' ? 'browser' : 'mobile',
  timestamp: new Date().toISOString()
};

export default API_CONFIG;
