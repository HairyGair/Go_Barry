// API Client for Go North East Breakdown Guide
// Connects to MySQL backend API via cPanel

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
// Mock data system removed - using real API data only

// API Client class with automatic authentication
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
  }

  async request(endpoint, options = {}) {
    // Get authentication token from storage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    console.log(`🔍 API Client Request - Endpoint: ${endpoint}`, token ? '(authenticated)' : '(unauthenticated)');

    // If no token and endpoint can use public fallback, convert to public endpoint
    let actualEndpoint = endpoint;

    if (!token) {
      // Parse endpoint to handle query parameters
      const [path, queryString] = endpoint.split('?');

      // Check if path has a public fallback
      const publicFallbacks = {
        '/api/breakdowns': '/api/public/breakdowns',
        '/api/breakdowns/stats': '/api/public/breakdowns/stats',
        '/api/breakdowns/live': '/api/public/breakdowns/live',
        '/api/activity/feed': '/api/public/activity/feed'
      };

      if (publicFallbacks[path]) {
        actualEndpoint = queryString ? `${publicFallbacks[path]}?${queryString}` : publicFallbacks[path];
        console.log(`🔓 No auth token - using public endpoint: ${actualEndpoint}`);
      } else {
        console.log(`⚠️ No public fallback for: ${path} - will send without auth`);
      }
    } else {
      console.log(`🔒 Using authenticated endpoint: ${endpoint}`);
    }

    const url = `${this.baseURL}${actualEndpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Inject Authorization header if token is available
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔒 Request includes auth token');
    } else {
      console.log('⚠️ Request without auth token (using public endpoint if available)');
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Auth refresh removed - 401 errors will propagate normally

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);

      // Mock data removed - no fallbacks

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

  // Mock data functions removed - system now uses real API data exclusively
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