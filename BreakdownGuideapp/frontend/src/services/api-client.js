// API Client for Go North East Breakdown Guide
// Connects to production Supabase via backend API
// Automatically injects Authorization headers for authenticated requests

import enhancedAuthService from './enhanced-auth-service.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';
// Mock data system removed - using real API data only

// API Client class with automatic authentication
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
  }

  async request(endpoint, options = {}) {
    // Get access token from enhanced auth service
    const token = await enhancedAuthService.getAccessToken();

    // If no token and endpoint can use public fallback, convert to public endpoint
    const publicFallbacks = {
      '/api/breakdowns/stats': '/api/public/breakdowns/stats',
      '/api/breakdowns/live': '/api/public/breakdowns/live',
      '/api/activity/feed': '/api/public/activity/feed'
    };

    let actualEndpoint = endpoint;

    if (!token) {
      // Check if endpoint has a public fallback
      for (const [protectedPath, publicPath] of Object.entries(publicFallbacks)) {
        if (endpoint.startsWith(protectedPath)) {
          actualEndpoint = endpoint.replace(protectedPath, publicPath);
          console.log(`🔓 No auth token - using public endpoint: ${actualEndpoint}`);
          break;
        }
      }
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

      // Handle 401 Unauthorized - try to refresh token once
      if (response.status === 401 && token && !this.isRefreshing) {
        console.log('🔄 401 Unauthorized - attempting token refresh');
        this.isRefreshing = true;

        try {
          // Try to get a fresh token
          const newToken = await enhancedAuthService.getAccessToken();

          if (newToken && newToken !== token) {
            // Retry request with new token
            config.headers['Authorization'] = `Bearer ${newToken}`;
            console.log('🔄 Retrying request with refreshed token');

            const retryResponse = await fetch(url, config);
            this.isRefreshing = false;

            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }

            return await retryResponse.json();
          } else {
            console.warn('⚠️ Token refresh did not provide new token');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }

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