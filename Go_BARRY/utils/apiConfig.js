// utils/apiConfig.js
// Centralized API configuration to ensure production URLs are always used

const PRODUCTION_API_URL = 'https://go-barry.onrender.com';

// Global API base URL - ALWAYS use production
export const API_BASE_URL = PRODUCTION_API_URL;

// Helper function to ensure URLs are absolute and use production
export const getApiUrl = (endpoint) => {
  // Remove any leading slash to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// Enhanced fetch wrapper that ensures production URL
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API fetch error for ${endpoint}:`, error);
    throw error;
  }
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  // Flow monitoring
  flowOverview: '/api/flow/overview',
  flowIncident: (id) => `/api/flow/incident/${id}`,
  flowCheckFlow: '/api/flow/check-flow',
  flowControl: '/api/flow/control',
  
  // Alerts
  alerts: '/api/alerts',
  alertsEnhanced: '/api/alerts-enhanced',
  
  // Incidents
  incidents: '/api/incidents',
  trafficIncidents: '/api/traffic-incidents',
  
  // Traffic intelligence
  liveTrafficCongestion: '/api/traffic-intelligence/live-congestion',
  roadworks: '/api/traffic-intelligence/roadworks',
  
  // Other endpoints
  supervisor: '/api/supervisor',
  events: '/api/events/active',
};

// Log the configuration for debugging
console.log('🌐 API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: 'production',
  timestamp: new Date().toISOString()
});

export default {
  API_BASE_URL,
  getApiUrl,
  apiFetch,
  API_ENDPOINTS
};