// API Client for the operator Breakdown Guide
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
    // NOTE: Token is NO LONGER retrieved from localStorage/sessionStorage
    // It's automatically sent by the browser via HTTP-only cookie (XSS protection)

    // Retry configuration
    const maxRetries = options.retries ?? 3;
    const retryDelay = options.retryDelay ?? 1000;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 API Client Request (${attempt}/${maxRetries}) - Endpoint: ${endpoint} (using HTTP-only cookie auth)`);

        const url = `${this.baseURL}${endpoint}`;

        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          // IMPORTANT: credentials: 'include' tells browser to send HTTP-only cookies with request
          // This is how authentication works now (secure, cannot be accessed by JavaScript)
          credentials: 'include',
          ...options,
        };

        // NOTE: Authorization header removed - token is in HTTP-only cookie now
        // The browser automatically sends the auth_token cookie with every request
        // This prevents XSS attacks from stealing tokens via JavaScript

        if (config.body && typeof config.body === 'object') {
          config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);

        // Success - return data
        if (response.ok) {
          console.log(`✅ API Success: ${endpoint}`);
          return await response.json();
        }

        // Client error (4xx) - don't retry
        if (response.status >= 400 && response.status < 500) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(error.error || error.message || response.statusText);
        }

        // Server error (5xx) - retry
        if (response.status >= 500) {
          lastError = new Error(`Server error ${response.status}`);

          if (attempt < maxRetries) {
            console.warn(`⚠️ Server error, retrying in ${retryDelay * attempt}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
        }

        throw new Error(`HTTP error! status: ${response.status}`);

      } catch (error) {
        // AbortError - never retry, rethrow immediately
        if (error.name === 'AbortError') throw error;

        lastError = error;

        // Network error - retry
        if (error.name === 'TypeError' && attempt < maxRetries) {
          console.warn(`⚠️ Network error, retrying in ${retryDelay * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }

        // Don't retry on other errors
        if (attempt === maxRetries) {
          console.error(`❌ API failed after ${maxRetries} attempts: ${endpoint}`, error);
          throw error;
        }
      }
    }

    throw lastError;
  }

  // GET request (options: { signal, retries, retryDelay, headers })
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
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