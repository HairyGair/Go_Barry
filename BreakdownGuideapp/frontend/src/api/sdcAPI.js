/**
 * SDC Dashboard API Client
 * Handles all API communication with the breakdown guide backend for SDC Dashboard
 */

import { apiConfig } from '../breakdown-guide/components/common/constants';

class SDCAPIClient {
  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.cache = new Map();
    this.requestQueue = new Map();
  }

  // Generic API request with error handling and caching
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${options.method || 'GET'}_${endpoint}`;
    
    try {
      // Check cache for GET requests
      if ((!options.method || options.method === 'GET') && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        const isExpired = Date.now() - cached.timestamp > (options.cacheTimeout || 30000);
        
        if (!isExpired) {
          console.log(`📋 SDC API: Using cached data for ${endpoint}`);
          return cached.data;
        }
      }

      // Prevent duplicate concurrent requests
      if (this.requestQueue.has(cacheKey)) {
        console.log(`📋 SDC API: Waiting for existing request ${endpoint}`);
        return await this.requestQueue.get(cacheKey);
      }

      // Configure request
      const requestConfig = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      console.log(`📋 SDC API: ${requestConfig.method} ${endpoint}`);

      // Make request
      const requestPromise = fetch(url, requestConfig).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorData}`);
        }
        return await response.json();
      });

      // Store in request queue
      this.requestQueue.set(cacheKey, requestPromise);

      const data = await requestPromise;

      // Remove from queue and cache result for GET requests
      this.requestQueue.delete(cacheKey);
      
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;

    } catch (error) {
      this.requestQueue.delete(cacheKey);
      console.error(`❌ SDC API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // GET /api/breakdowns/live - Active breakdowns with assessment data
  async getLiveBreakdowns() {
    return await this.request('/api/breakdowns/live', {
      cacheTimeout: 10000 // 10 second cache for live data
    });
  }

  // GET /api/breakdowns/in-progress - Currently being assessed
  async getInProgressAssessments() {
    return await this.request('/api/breakdowns/in-progress', {
      cacheTimeout: 5000 // 5 second cache for in-progress data
    });
  }

  // GET /api/breakdowns/{id} - Get specific breakdown details
  async getBreakdownDetails(breakdownId) {
    return await this.request(`/api/breakdowns/${breakdownId}`);
  }

  // GET /api/breakdowns/{id}/audit - Get edit history
  async getBreakdownAuditTrail(breakdownId) {
    return await this.request(`/api/breakdowns/${breakdownId}/audit`);
  }

  // POST /api/breakdowns/{id}/edit - Start assessment edit
  async startAssessmentEdit(breakdownId, editData) {
    return await this.request(`/api/breakdowns/${breakdownId}/edit`, {
      method: 'POST',
      body: JSON.stringify({
        reason: editData.reason,
        user_type: editData.userType || 'sdc_operator',
        source: editData.source || 'sdc_dashboard',
        return_url: editData.returnUrl
      })
    });
  }

  // POST /api/sdc/acknowledge - SDC acknowledge breakdown
  async acknowledgeBreakdown(breakdownId) {
    return await this.request('/api/sdc/acknowledge', {
      method: 'POST',
      body: JSON.stringify({
        breakdown_id: breakdownId,
        acknowledged_at: new Date().toISOString()
      })
    });
  }

  // POST /api/sdc/request-engineering - Request engineering support
  async requestEngineering(breakdownId, data = {}) {
    return await this.request('/api/sdc/request-engineering', {
      method: 'POST',
      body: JSON.stringify({
        breakdown_id: breakdownId,
        priority: data.priority || 'normal',
        notes: data.notes || '',
        requested_at: new Date().toISOString()
      })
    });
  }

  // POST /api/sdc/decision - Make SDC decision
  async makeSDCDecision(breakdownId, decision, notes = '') {
    return await this.request('/api/sdc/decision', {
      method: 'POST',
      body: JSON.stringify({
        breakdown_id: breakdownId,
        decision: decision,
        notes: notes,
        decision_at: new Date().toISOString()
      })
    });
  }

  // POST /api/audit/log - Log audit event
  async logAuditEvent(eventData) {
    return await this.request('/api/audit/log', {
      method: 'POST',
      body: JSON.stringify({
        ...eventData,
        timestamp: new Date().toISOString()
      })
    });
  }

  // GET /api/assessments/active - Get active assessments (alternative endpoint)
  async getActiveAssessments() {
    try {
      return await this.request('/api/assessments/active');
    } catch (error) {
      // Fallback to in-progress endpoint
      console.log('📋 SDC API: Falling back to in-progress endpoint');
      return await this.getInProgressAssessments();
    }
  }

  // Polling method for when WebSocket is unavailable
  async pollForUpdates(lastUpdateTimestamp = null) {
    const params = new URLSearchParams();
    if (lastUpdateTimestamp) {
      params.append('since', lastUpdateTimestamp);
    }
    
    const endpoint = `/api/breakdowns/updates${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      return await this.request(endpoint, {
        cacheTimeout: 0 // Don't cache polling requests
      });
    } catch (error) {
      // If dedicated updates endpoint doesn't exist, fall back to live data
      console.log('📋 SDC API: Updates endpoint not available, using live data');
      return await this.getLiveBreakdowns();
    }
  }

  // Batch request for multiple breakdowns
  async getMultipleBreakdowns(breakdownIds) {
    const promises = breakdownIds.map(id => 
      this.getBreakdownDetails(id).catch(error => {
        console.warn(`Failed to fetch breakdown ${id}:`, error.message);
        return null;
      })
    );
    
    const results = await Promise.allSettled(promises);
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);
  }

  // Search breakdowns
  async searchBreakdowns(query, filters = {}) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    
    const endpoint = `/api/breakdowns/search${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      return await this.request(endpoint);
    } catch (error) {
      // Fallback to live data with client-side filtering
      console.log('📋 SDC API: Search endpoint not available, using live data with client-side filtering');
      const liveData = await this.getLiveBreakdowns();
      return this.clientSideFilter(liveData, query, filters);
    }
  }

  // Client-side filtering fallback
  clientSideFilter(data, query, filters) {
    let filtered = data.breakdowns || [];
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(breakdown => 
        breakdown.breakdown_id?.toLowerCase().includes(searchTerm) ||
        breakdown.fleet_number?.toLowerCase().includes(searchTerm) ||
        breakdown.location?.toLowerCase().includes(searchTerm) ||
        breakdown.supervisor_name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter(breakdown => {
          switch (key) {
            case 'status':
              return breakdown.status === value;
            case 'decision':
              return breakdown.decision === value;
            case 'critical':
              return value === 'true' ? breakdown.isCritical : !breakdown.isCritical;
            case 'in_assessment':
              return value === 'true' ? breakdown.inAssessment : !breakdown.inAssessment;
            default:
              return breakdown[key] === value;
          }
        });
      }
    });
    
    return {
      ...data,
      breakdowns: filtered,
      total: filtered.length
    };
  }

  // Statistics endpoint
  async getStatistics(timeframe = '24h') {
    return await this.request(`/api/breakdowns/stats?timeframe=${timeframe}`);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return {
        healthy: response.ok,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('📋 SDC API: Cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalSize: JSON.stringify(Array.from(this.cache.values())).length
    };
  }

  // Request retry with exponential backoff
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`📋 SDC API: Retry ${attempt}/${maxRetries} for ${endpoint} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Bulk operations
  async bulkAcknowledge(breakdownIds) {
    const promises = breakdownIds.map(id => 
      this.acknowledgeBreakdown(id).catch(error => {
        console.warn(`Failed to acknowledge breakdown ${id}:`, error.message);
        return { id, success: false, error: error.message };
      })
    );
    
    return await Promise.allSettled(promises);
  }

  async bulkRequestEngineering(breakdownIds, data = {}) {
    const promises = breakdownIds.map(id => 
      this.requestEngineering(id, data).catch(error => {
        console.warn(`Failed to request engineering for breakdown ${id}:`, error.message);
        return { id, success: false, error: error.message };
      })
    );
    
    return await Promise.allSettled(promises);
  }
}

// Create singleton instance
const sdcAPI = new SDCAPIClient();

export default sdcAPI;

// Export individual methods for convenience
export const {
  getLiveBreakdowns,
  getInProgressAssessments,
  getBreakdownDetails,
  getBreakdownAuditTrail,
  startAssessmentEdit,
  acknowledgeBreakdown,
  requestEngineering,
  makeSDCDecision,
  logAuditEvent,
  pollForUpdates,
  searchBreakdowns,
  getStatistics,
  healthCheck,
  clearCache
} = sdcAPI;