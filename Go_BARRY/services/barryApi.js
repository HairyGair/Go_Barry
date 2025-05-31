/**
 * BARRY API Service
 * Handles all API calls to the BARRY backend
 */

const API_BASE_URL = 'https://go-barry.onrender.com';

// API endpoints
const ENDPOINTS = {
  alerts: '/api/alerts',
  traffic: '/api/traffic',
  trafficIntelligence: '/api/traffic-intelligence',
  roadworks: '/api/roadworks',
  streetworks: '/api/streetworks',
  health: '/api/health',
  refresh: '/api/refresh'
};

class BARRYApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 15000; // 15 seconds
  }

  /**
   * Generic API request method
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log(`🌐 BARRY API: ${options.method || 'GET'} ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BARRY-Mobile/1.0',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ BARRY API: ${endpoint} successful`);
      
      return {
        success: true,
        data,
        status: response.status
      };
      
    } catch (error) {
      console.error(`❌ BARRY API Error (${endpoint}):`, error.message);
      
      let errorMessage = 'Network error';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message.includes('HTTP')) {
        errorMessage = error.message;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server';
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      };
    }
  }

  /**
   * Get all unified alerts (main endpoint)
   */
  async getAlerts() {
    return this.makeRequest(ENDPOINTS.alerts);
  }

  /**
   * Get traffic data (incidents + congestion)
   */
  async getTraffic() {
    return this.makeRequest(ENDPOINTS.traffic);
  }

  /**
   * Get comprehensive traffic intelligence
   */
  async getTrafficIntelligence() {
    return this.makeRequest(ENDPOINTS.trafficIntelligence);
  }

  /**
   * Get roadworks from National Highways
   */
  async getRoadworks() {
    return this.makeRequest(ENDPOINTS.roadworks);
  }

  /**
   * Get street works from Street Manager
   */
  async getStreetworks() {
    return this.makeRequest(ENDPOINTS.streetworks);
  }

  /**
   * Get system health status
   */
  async getHealth() {
    return this.makeRequest(ENDPOINTS.health);
  }

  /**
   * Force refresh all data sources
   */
  async refreshData() {
    return this.makeRequest(ENDPOINTS.refresh);
  }

  /**
   * Check if the API is reachable
   */
  async checkConnection() {
    try {
      const result = await this.makeRequest('/');
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get filtered alerts by type
   */
  async getAlertsByType(type) {
    const result = await this.getAlerts();
    
    if (result.success && result.data.alerts) {
      const filteredAlerts = result.data.alerts.filter(alert => {
        if (type === 'all') return true;
        return alert.type === type;
      });
      
      return {
        ...result,
        data: {
          ...result.data,
          alerts: filteredAlerts
        }
      };
    }
    
    return result;
  }

  /**
   * Get alerts for specific routes
   */
  async getAlertsForRoutes(routes) {
    const result = await this.getAlerts();
    
    if (result.success && result.data.alerts) {
      const routeAlerts = result.data.alerts.filter(alert => 
        alert.affectsRoutes && alert.affectsRoutes.some(route => 
          routes.includes(route)
        )
      );
      
      return {
        ...result,
        data: {
          ...result.data,
          alerts: routeAlerts
        }
      };
    }
    
    return result;
  }

  /**
   * Get summary statistics
   */
  async getStatistics() {
    const result = await this.getAlerts();
    
    if (result.success && result.data.alerts) {
      const alerts = result.data.alerts;
      
      const stats = {
        total: alerts.length,
        incidents: alerts.filter(a => a.type === 'incident').length,
        congestion: alerts.filter(a => a.type === 'congestion').length,
        roadworks: alerts.filter(a => a.type === 'roadwork').length,
        active: alerts.filter(a => a.status === 'red').length,
        upcoming: alerts.filter(a => a.status === 'amber').length,
        planned: alerts.filter(a => a.status === 'green').length,
        highSeverity: alerts.filter(a => a.severity === 'High').length,
        mediumSeverity: alerts.filter(a => a.severity === 'Medium').length,
        lowSeverity: alerts.filter(a => a.severity === 'Low').length,
        lastUpdated: result.data.metadata?.lastUpdated || null
      };
      
      return {
        success: true,
        data: stats
      };
    }
    
    return {
      success: false,
      error: 'Unable to calculate statistics'
    };
  }
}

// Export singleton instance
export const barryApi = new BARRYApiService();

// Export class for testing or custom instances
export { BARRYApiService };

// Export convenience methods
export const api = {
  getAlerts: () => barryApi.getAlerts(),
  getTraffic: () => barryApi.getTraffic(),
  getTrafficIntelligence: () => barryApi.getTrafficIntelligence(),
  getRoadworks: () => barryApi.getRoadworks(),
  getStreetworks: () => barryApi.getStreetworks(),
  getHealth: () => barryApi.getHealth(),
  refresh: () => barryApi.refreshData(),
  checkConnection: () => barryApi.checkConnection(),
  getStatistics: () => barryApi.getStatistics(),
  getAlertsByType: (type) => barryApi.getAlertsByType(type),
  getAlertsForRoutes: (routes) => barryApi.getAlertsForRoutes(routes)
};

export default barryApi;