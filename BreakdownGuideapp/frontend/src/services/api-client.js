// API Client for Go North East Breakdown Guide
// Connects to production Supabase via backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// API Client class
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // If API fails and mock data is enabled, use fallback
      if (ENABLE_MOCK_DATA) {
        return this.getMockData(endpoint);
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Mock data fallback for development
  getMockData(endpoint) {
    console.warn(`Using mock data for: ${endpoint}`);
    
    if (endpoint.includes('/fleet')) {
      return {
        data: [
          {
            fleet_number: '6001',
            registration: 'NK10 ABC',
            depot: 'Riverside',
            type: 'Single Deck',
            status: 'active'
          }
        ]
      };
    }
    
    if (endpoint.includes('/breakdowns')) {
      return {
        data: [
          {
            id: 1,
            breakdown_id: 'BD-2025-00001',
            fleet_number: '6001',
            status: 'active',
            created_at: new Date().toISOString()
          }
        ]
      };
    }
    
    if (endpoint.includes('/supervisors')) {
      return [
        {
          id: 1,
          supervisor_id: 'AG003',
          name: 'Anthony Gair',
          depot: 'Riverside',
          role: 'supervisor'
        }
      ];
    }
    
    return { data: [] };
  }
}

// Create and export API client instance
export const apiClient = new APIClient();

// Breakdown API methods
export const breakdownAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/breakdowns${queryString ? `?${queryString}` : ''}`);
  },
  
  getActive: () => apiClient.get('/api/breakdowns/active'),
  
  getById: (id) => apiClient.get(`/api/breakdowns/${id}`),
  
  create: (breakdownData) => apiClient.post('/api/breakdowns', breakdownData),
  
  update: (id, updates) => apiClient.put(`/api/breakdowns/${id}`, updates),
  
  updateStatus: (id, status) => apiClient.patch(`/api/breakdowns/${id}/status`, { status }),
  
  getStats: (period = 'today') => apiClient.get(`/api/breakdowns/stats/summary?period=${period}`)
};

// Fleet API methods
export const fleetAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/fleet${queryString ? `?${queryString}` : ''}`);
  },
  
  search: (term) => apiClient.get(`/api/fleet/search/${encodeURIComponent(term)}`),
  
  getByFleetNumber: (fleetNumber) => apiClient.get(`/api/fleet/${fleetNumber}`),
  
  update: (fleetNumber, updates) => apiClient.put(`/api/fleet/${fleetNumber}`, updates),
  
  updateStatus: (fleetNumber, status) => apiClient.patch(`/api/fleet/${fleetNumber}/status`, { status }),
  
  getDepots: () => apiClient.get('/api/fleet/depots/list'),
  
  getTypes: () => apiClient.get('/api/fleet/types/list'),
  
  getStats: () => apiClient.get('/api/fleet/stats/summary')
};

// Auth API methods
export const authAPI = {
  getSupervisors: () => apiClient.get('/api/auth/supervisors'),
  
  getUser: (id) => apiClient.get(`/api/auth/user/${id}`),
  
  getSupervisor: (supervisorId) => apiClient.get(`/api/auth/supervisor/${supervisorId}`),
  
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  
  logout: () => apiClient.post('/api/auth/logout'),
  
  validate: () => apiClient.get('/api/auth/validate'),
  
  getDepots: () => apiClient.get('/api/auth/depots')
};

// Wizard API methods
export const wizardAPI = {
  logProgress: (progressData) => apiClient.post('/api/wizards/progress', progressData),
  
  getProgress: (breakdownId) => apiClient.get(`/api/wizards/progress/${breakdownId}`),
  
  completeAssessment: (completionData) => apiClient.post('/api/wizards/complete', completionData),
  
  getUsageStats: (period = 'week') => apiClient.get(`/api/wizards/stats/usage?period=${period}`),
  
  getDecisionStats: (period = 'week') => apiClient.get(`/api/wizards/decisions/summary?period=${period}`)
};

export default apiClient;