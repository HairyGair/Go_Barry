// Go_BARRY/services/api.js
// BARRY API Service - Handles all backend communication

const BASE_URL = 'https://go-barry.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

// Helper function to determine which URL to use
const getBaseUrl = () => {
  // In development, you might want to use localhost
  // For production builds, always use the production URL
  return BASE_URL;
};

// Helper function for making HTTP requests with proper error handling
const makeRequest = async (endpoint, options = {}) => {
  const url = `${getBaseUrl()}${endpoint}`;
  
  try {
    console.log(`📡 API Request: ${url}`);
    
    const response = await fetch(url, {
      timeout: 15000, // 15 second timeout
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`);
    
    return {
      success: true,
      data: data,
      status: response.status
    };

  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error.message);
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Main API object with all the methods needed by the app
export const api = {
  // Get all traffic alerts
  getAlerts: async () => {
    console.log('🚨 Fetching alerts from backend...');
    
    const result = await makeRequest('/api/alerts');
    
    if (result.success) {
      // Ensure the response has the expected structure
      const alerts = result.data.alerts || result.data || [];
      const metadata = result.data.metadata || {};
      
      return {
        success: true,
        data: {
          alerts: alerts,
          metadata: metadata
        }
      };
    } else {
      // If main endpoint fails, try test endpoint as fallback
      console.log('🧪 Main endpoint failed, trying test endpoint...');
      const testResult = await makeRequest('/api/alerts-test');
      
      if (testResult.success) {
        return {
          success: true,
          data: {
            alerts: testResult.data.alerts || [],
            metadata: testResult.data.metadata || {}
          }
        };
      }
      
      return result;
    }
  },

  // Get test alerts (for development)
  getTestAlerts: async () => {
    console.log('🧪 Fetching test alerts...');
    return await makeRequest('/api/alerts-test');
  },

  // Get system health
  getHealth: async () => {
    console.log('💚 Checking system health...');
    return await makeRequest('/api/health');
  },

  // Get system health (alternative method name for compatibility)
  getSystemHealth: async () => {
    console.log('💚 Checking system health...');
    return await makeRequest('/api/health');
  },

  // Force refresh data
  refreshData: async () => {
    console.log('🔄 Forcing data refresh...');
    return await makeRequest('/api/refresh');
  },

  // Alternative method name for refresh
  refreshAllData: async () => {
    console.log('🔄 Refreshing all data...');
    return await makeRequest('/api/refresh');
  },

  // Dashboard summary (uses alerts endpoint but with different processing)
  getDashboardSummary: async () => {
    console.log('📊 Fetching dashboard summary...');
    
    const result = await api.getAlerts();
    
    if (result.success && result.data.alerts) {
      const alerts = result.data.alerts;
      
      // Calculate summary statistics
      const summary = {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.status === 'red' && a.severity === 'High').length,
        activeAlerts: alerts.filter(a => a.status === 'red').length,
        upcomingAlerts: alerts.filter(a => a.status === 'amber').length,
        incidents: alerts.filter(a => a.type === 'incident').length,
        roadworks: alerts.filter(a => a.type === 'roadwork').length,
        congestion: alerts.filter(a => a.type === 'congestion').length,
        lastUpdated: result.data.metadata?.lastUpdated || new Date().toISOString()
      };
      
      return {
        success: true,
        data: {
          summary: summary,
          criticalAlerts: alerts.filter(a => a.status === 'red' && a.severity === 'High').slice(0, 5),
          metadata: result.data.metadata
        }
      };
    }
    
    return result;
  },

  // Get traffic data (alias for alerts)
  getTrafficData: async () => {
    console.log('🚦 Fetching traffic data...');
    return await api.getAlerts();
  },

  // Get roadworks data (filtered alerts)
  getRoadworks: async () => {
    console.log('🚧 Fetching roadworks data...');
    const result = await api.getAlerts();
    
    if (result.success && result.data.alerts) {
      const roadworks = result.data.alerts.filter(alert => alert.type === 'roadwork');
      return {
        success: true,
        data: {
          alerts: roadworks,
          metadata: result.data.metadata
        }
      };
    }
    
    return result;
  },

  // Get incidents data (filtered alerts)
  getIncidents: async () => {
    console.log('🚨 Fetching incidents data...');
    const result = await api.getAlerts();
    
    if (result.success && result.data.alerts) {
      const incidents = result.data.alerts.filter(alert => alert.type === 'incident');
      return {
        success: true,
        data: {
          alerts: incidents,
          metadata: result.data.metadata
        }
      };
    }
    
    return result;
  }
};

// Export individual functions as well for flexibility
export const getAlerts = api.getAlerts;
export const getTestAlerts = api.getTestAlerts;
export const getHealth = api.getHealth;
export const getSystemHealth = api.getSystemHealth;
export const refreshData = api.refreshData;
export const refreshAllData = api.refreshAllData;
export const getDashboardSummary = api.getDashboardSummary;
export const getTrafficData = api.getTrafficData;
export const getRoadworks = api.getRoadworks;
export const getIncidents = api.getIncidents;

// Configuration
export const config = {
  baseUrl: getBaseUrl(),
  timeout: 15000,
  endpoints: {
    alerts: '/api/alerts',
    testAlerts: '/api/alerts-test',
    health: '/api/health',
    refresh: '/api/refresh',
    roadworks: '/api/roadworks',
    incidents: '/api/incidents',
    traffic: '/api/traffic'
  },
  supportedMethods: [
    'getAlerts',
    'getTestAlerts', 
    'getHealth',
    'getSystemHealth',
    'refreshData',
    'refreshAllData',
    'getDashboardSummary',
    'getTrafficData',
    'getRoadworks',
    'getIncidents'
  ]
};

console.log('📱 BARRY API Service initialized');
console.log(`🌐 Base URL: ${getBaseUrl()}`);

export default api;