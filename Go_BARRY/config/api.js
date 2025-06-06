// Go_BARRY/config/api.js
// Centralized API configuration for browser and mobile compatibility

export const API_CONFIG = {
  // Dynamic base URL detection
  baseURL: (() => {
    if (typeof window !== 'undefined') {
      // Browser environment
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      return 'https://go-barry.onrender.com';
    } else {
      // React Native environment  
      return process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com';
    }
  })(),
  
  // Refresh intervals
  refreshIntervals: {
    dashboard: 30000,    // 30 seconds
    alerts: 15000,       // 15 seconds
    incidents: 20000,    // 20 seconds
    reports: 60000       // 1 minute
  },
  
  // Request timeouts
  timeouts: {
    default: 10000,      // 10 seconds
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
    routes: '/api/routes'
  }
};

// Enhanced fetch function with browser compatibility
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const timeout = options.timeout || API_CONFIG.timeouts.default;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

export default API_CONFIG;
