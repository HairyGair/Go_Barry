// Go_BARRY/services/api.js
// Complete API service for BARRY traffic intelligence

const API_BASE = 'https://go-barry.onrender.com/api';

// Enhanced fetch with better error handling
const fetchWithRetry = async (url, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`📡 Fetching: ${url} (attempt ${i + 1})`);
      
      const response = await fetch(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'BARRY-Mobile/3.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Success: ${url} - ${data.alerts?.length || data.data?.alerts?.length || 0} alerts`);
      return data;
      
    } catch (err) {
      console.error(`❌ Attempt ${i + 1} failed for ${url}:`, err.message);
      if (i === retries) throw err;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Main API functions
export const api = {
  // Get all unified alerts
  async getAlerts() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/alerts`);
      
      if (response.success && response.alerts) {
        return {
          success: true,
          data: {
            alerts: response.alerts,
            metadata: response.metadata
          }
        };
      } else {
        throw new Error(response.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('🚨 getAlerts failed:', error);
      return {
        success: false,
        error: error.message,
        data: { alerts: [], metadata: null }
      };
    }
  },

  // Get traffic data specifically
  async getTraffic() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/traffic`);
      return response.success ? response : { success: false, traffic: [] };
    } catch (error) {
      console.error('🚨 getTraffic failed:', error);
      return { success: false, traffic: [], error: error.message };
    }
  },

  // Get traffic intelligence
  async getTrafficIntelligence() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/traffic-intelligence`);
      return response.success ? response : { success: false, trafficIntelligence: null };
    } catch (error) {
      console.error('🚨 getTrafficIntelligence failed:', error);
      return { success: false, trafficIntelligence: null, error: error.message };
    }
  },

  // Get street works (Street Manager data)
  async getStreetworks() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/streetworks`);
      return response.success ? response : { success: false, streetworks: [] };
    } catch (error) {
      console.error('🚨 getStreetworks failed:', error);
      return { success: false, streetworks: [], error: error.message };
    }
  },

  // Get roadworks (National Highways data) 
  async getRoadworks() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/roadworks`);
      return response.success ? response : { success: false, roadworks: [] };
    } catch (error) {
      console.error('🚨 getRoadworks failed:', error);
      return { success: false, roadworks: [], error: error.message };
    }
  },

  // Get system health
  async getHealth() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/health`);
      return response;
    } catch (error) {
      console.error('🚨 getHealth failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  // Force refresh backend data
  async forceRefresh() {
    try {
      console.log('🔄 Forcing backend refresh...');
      const response = await fetchWithRetry(`${API_BASE}/refresh`);
      return response.success ? response : { success: false };
    } catch (error) {
      console.error('🚨 forceRefresh failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get route delays
  async getRouteDelays() {
    try {
      const response = await fetchWithRetry(`${API_BASE}/route-delays`);
      return response.success ? response : { success: false, routeDelays: [] };
    } catch (error) {
      console.error('🚨 getRouteDelays failed:', error);
      return { success: false, routeDelays: [], error: error.message };
    }
  }
};

// Legacy exports for backward compatibility
export const fetchAlerts = api.getAlerts;
export const fetchTraffic = api.getTraffic;
export const fetchHealth = api.getHealth;

export default api;