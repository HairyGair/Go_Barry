/**
 * Assessment API Integration Service
 * Handles all assessment-related API calls for SDC Dashboard
 * Connects to backend assessment endpoints and breakdown guide integration
 */

import { apiConfig } from '../breakdown-guide/components/common/constants';
import assessmentCache from './assessmentCache';

class AssessmentAPIService {
  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('🔐 Assessment API: Authentication required for all requests');
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Assessment API: Auth token set');
    } else {
      console.warn('⚠️ Assessment API: No auth token provided');
    }
  }

  /**
   * Check if authentication token is set
   */
  hasAuthToken() {
    return Boolean(this.headers['Authorization']);
  }

  /**
   * Cache management methods
   */
  
  /**
   * Clear all assessment-related cache
   */
  clearCache() {
    assessmentCache.clear();
    console.log('🧹 Assessment API cache cleared');
  }

  /**
   * Invalidate specific cache patterns
   */
  invalidateCache(pattern = '.*assessments.*') {
    return assessmentCache.invalidatePattern(pattern);
  }

  /**
   * Force refresh without cache
   */
  async forceRefresh() {
    console.log('🔄 Force refreshing assessment data (bypassing cache)');
    
    const results = await Promise.allSettled([
      this.getInProgressAssessments(false),
      this.getBreakdownsWithAssessments(false),
      this.getAssessmentStatistics(false)
    ]);
    
    return {
      inProgressAssessments: results[0],
      breakdownsWithAssessments: results[1], 
      statistics: results[2]
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return assessmentCache.getStats();
  }

  /**
   * Generic API request handler with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      console.log(`🔌 API Request: ${options.method || 'GET'} ${endpoint}`);
      
      // Check if we have authentication for protected endpoints
      if (!this.hasAuthToken() && !endpoint.includes('/public/')) {
        console.warn('⚠️ No authentication token available for protected endpoint');
        // Try to get token from storage again
        this.tryAutoAuthentication();
        
        // If still no token, return graceful fallback
        if (!this.hasAuthToken()) {
          return this.createAuthFallbackResponse(endpoint);
        }
      }
      
      const response = await fetch(url, config);
      
      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        console.warn('🔐 Authentication failed, clearing stored tokens');
        this.clearStoredTokens();
        return this.createAuthFallbackResponse(endpoint, 'Authentication required');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error types
        if (response.status === 404) {
          console.warn(`📍 Endpoint not found: ${endpoint}`);
          return this.create404FallbackResponse(endpoint);
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      
      // Return graceful fallback instead of throwing
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return this.createNetworkFallbackResponse(endpoint);
      }
      
      throw error;
    }
  }

  /**
   * Try to automatically authenticate from stored tokens
   */
  tryAutoAuthentication() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || 
                   sessionStorage.getItem('authToken') ||
                   localStorage.getItem('supervisor_auth_token');
      if (token) {
        this.setAuthToken(token);
        console.log('🔐 Auto-authentication successful');
        return true;
      }
    }
    return false;
  }

  /**
   * Clear stored authentication tokens
   */
  clearStoredTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('supervisor_token');
      localStorage.removeItem('supervisor_auth_token');
      delete this.headers['Authorization'];
    }
  }

  /**
   * Create fallback response for authentication issues
   */
  createAuthFallbackResponse(endpoint, message = 'Authentication required') {
    return {
      success: false,
      error: message,
      fallback: true,
      endpoint,
      data: [],
      assessments: [],
      breakdowns: [],
      count: 0,
      metadata: {
        fallback_reason: 'authentication_required',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create fallback response for 404 errors
   */
  create404FallbackResponse(endpoint) {
    return {
      success: false,
      error: 'Endpoint not found',
      fallback: true,
      endpoint,
      data: [],
      assessments: [],
      breakdowns: [],
      count: 0,
      metadata: {
        fallback_reason: 'endpoint_not_found',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create fallback response for network errors
   */
  createNetworkFallbackResponse(endpoint) {
    return {
      success: false,
      error: 'Network connection failed',
      fallback: true,
      endpoint,
      data: [],
      assessments: [],
      breakdowns: [],
      count: 0,
      metadata: {
        fallback_reason: 'network_error',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * GET /api/assessments/in-progress
   * Fetches all currently active assessments with caching
   */
  async getInProgressAssessments(useCache = true) {
    const cacheKey = assessmentCache.generateKey('/api/assessments/in-progress');
    
    // Try cache first if enabled
    if (useCache) {
      const cached = assessmentCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached in-progress assessments');
        return cached.data;
      }
    }
    
    try {
      const response = await this.request('/api/assessments/in-progress');
      
      const result = {
        success: true,
        assessments: response.assessments || response.data || [],
        count: response.count || (response.assessments || response.data || []).length,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'api_assessments_in_progress'
        }
      };
      
      // Cache successful response (shorter TTL for in-progress data)
      if (useCache) {
        assessmentCache.set(cacheKey, result, 30000); // 30 seconds TTL
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching in-progress assessments:', error);
      return {
        success: false,
        error: error.message,
        assessments: [],
        count: 0
      };
    }
  }

  /**
   * GET /api/breakdowns/with-assessments
   * Fetches breakdowns that have associated assessment data with caching
   */
  async getBreakdownsWithAssessments(useCache = true) {
    const cacheKey = assessmentCache.generateKey('/api/breakdowns/with-assessments');
    
    // Try cache first if enabled
    if (useCache) {
      const cached = assessmentCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached breakdowns with assessments');
        return cached.data;
      }
    }
    
    try {
      const response = await this.request('/api/breakdowns/with-assessments');
      
      // Process and enhance breakdown data
      const breakdowns = (response.breakdowns || response.data || []).map(breakdown => ({
        ...breakdown,
        // Ensure consistent data structure
        breakdown_id: breakdown.breakdown_id || breakdown.id,
        fleet_number: breakdown.fleet_number || breakdown.fleet_no,
        assessment_status: breakdown.assessment_status || 'unknown',
        assessment_progress: breakdown.assessment_progress || null,
        wizard_decision: breakdown.wizard_decision || breakdown.decision || breakdown.severity,
        
        // Enhanced assessment metadata
        assessment_metadata: {
          hasAssessment: Boolean(breakdown.assessment_id || breakdown.wizard_started_at),
          isInProgress: Boolean(breakdown.assessment_status === 'in_progress'),
          isCompleted: Boolean(breakdown.assessment_status === 'completed'),
          duration: breakdown.assessment_duration,
          supervisor: breakdown.supervisor_name || breakdown.supervisor_badge,
          wizard_type: breakdown.wizard_type || breakdown.issue_category
        }
      }));

      const result = {
        success: true,
        breakdowns,
        count: breakdowns.length,
        summary: {
          total: breakdowns.length,
          withAssessments: breakdowns.filter(b => b.assessment_metadata.hasAssessment).length,
          inProgress: breakdowns.filter(b => b.assessment_metadata.isInProgress).length,
          completed: breakdowns.filter(b => b.assessment_metadata.isCompleted).length
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'api_breakdowns_with_assessments'
        }
      };
      
      // Cache successful response (1 minute TTL for breakdown data)
      if (useCache) {
        assessmentCache.set(cacheKey, result, 60000); // 1 minute TTL
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching breakdowns with assessments:', error);
      return {
        success: false,
        error: error.message,
        breakdowns: [],
        count: 0
      };
    }
  }

  /**
   * GET /api/breakdowns/{id}/assessment-details
   * Fetches detailed assessment information for a specific breakdown
   */
  async getBreakdownAssessmentDetails(breakdownId) {
    try {
      const response = await this.request(`/api/breakdowns/${breakdownId}/assessment-details`);
      
      const details = response.assessment || response.data || {};
      
      return {
        success: true,
        assessment: {
          breakdown_id: breakdownId,
          assessment_id: details.assessment_id || details.id,
          wizard_type: details.wizard_type,
          current_step: details.current_step || details.currentStep,
          total_steps: details.total_steps || details.totalSteps,
          step_description: details.step_description || details.stepDescription,
          progress_percentage: details.progress_percentage || 0,
          
          // Assessment timeline
          started_at: details.started_at || details.startTime,
          updated_at: details.updated_at || details.lastUpdated,
          completed_at: details.completed_at,
          duration: details.duration,
          
          // Supervisor information
          supervisor: {
            name: details.supervisor_name || details.supervisor?.name,
            badge: details.supervisor_badge || details.supervisor?.badge,
            id: details.supervisor_id || details.supervisor?.id
          },
          
          // Assessment results
          decision: details.decision || details.wizard_decision,
          decision_reason: details.decision_reason,
          dvsa_reference: details.dvsa_reference,
          recommended_actions: details.recommended_actions || [],
          wizard_responses: details.wizard_responses || {},
          
          // Vehicle information
          vehicle: {
            fleet_number: details.fleet_number || details.vehicle?.fleet_number,
            location: details.location || details.vehicle?.location,
            route: details.route || details.vehicle?.route,
            depot: details.depot || details.vehicle?.depot
          },
          
          // System metadata
          metadata: {
            source: details.source || 'breakdown_guide',
            version: details.version || '1.0',
            last_sync: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error(`Error fetching assessment details for breakdown ${breakdownId}:`, error);
      return {
        success: false,
        error: error.message,
        assessment: null
      };
    }
  }

  /**
   * PUT /api/breakdowns/{id}/assessment-result
   * Updates assessment result for a breakdown
   */
  async updateBreakdownAssessmentResult(breakdownId, assessmentResult) {
    try {
      const payload = {
        breakdown_id: breakdownId,
        decision: assessmentResult.decision,
        decision_reason: assessmentResult.reason || assessmentResult.decision_reason,
        dvsa_reference: assessmentResult.dvsa_reference,
        recommended_actions: assessmentResult.recommended_actions || [],
        wizard_responses: assessmentResult.wizard_responses || {},
        assessment_duration: assessmentResult.duration,
        completed_at: assessmentResult.completed_at || new Date().toISOString(),
        supervisor: assessmentResult.supervisor,
        notes: assessmentResult.notes,
        next_steps: assessmentResult.next_steps || [],
        
        // System metadata
        updated_by: 'sdc_dashboard',
        update_source: 'assessment_result_update',
        timestamp: new Date().toISOString()
      };

      const response = await this.request(`/api/breakdowns/${breakdownId}/assessment-result`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        updated: true,
        breakdown_id: breakdownId,
        result: response.result || response.data,
        message: response.message || 'Assessment result updated successfully'
      };
    } catch (error) {
      console.error(`Error updating assessment result for breakdown ${breakdownId}:`, error);
      return {
        success: false,
        error: error.message,
        updated: false
      };
    }
  }

  /**
   * POST /api/assessments/{id}/edit
   * Initiates assessment editing workflow
   */
  async editAssessment(assessmentId, editRequest) {
    try {
      const payload = {
        assessment_id: assessmentId,
        edit_reason: editRequest.reason || 'sdc_dashboard_edit',
        edit_type: editRequest.type || 'modification',
        requested_by: editRequest.supervisor || 'sdc_operator',
        return_url: editRequest.return_url,
        context: {
          source: 'sdc_dashboard',
          dashboard_state: editRequest.dashboard_state,
          breakdown_highlighted: editRequest.breakdown_id
        },
        audit: {
          initiated_at: new Date().toISOString(),
          initiator_ip: editRequest.ip_address,
          user_agent: editRequest.user_agent
        }
      };

      const response = await this.request(`/api/assessments/${assessmentId}/edit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        edit_session: {
          id: response.edit_session_id || response.session?.id,
          assessment_id: assessmentId,
          redirect_url: response.redirect_url || response.edit_url,
          edit_token: response.edit_token,
          expires_at: response.expires_at
        },
        message: response.message || 'Edit session initiated successfully'
      };
    } catch (error) {
      console.error(`Error initiating assessment edit for ${assessmentId}:`, error);
      return {
        success: false,
        error: error.message,
        edit_session: null
      };
    }
  }

  /**
   * GET /api/assessments/statistics
   * Fetches assessment statistics for dashboard metrics
   */
  async getAssessmentStatistics(timeframe = '24h') {
    try {
      const response = await this.request(`/api/assessments/statistics?timeframe=${timeframe}`);
      
      const stats = response.statistics || response.data || {};
      
      return {
        success: true,
        statistics: {
          total_assessments: stats.total_assessments || 0,
          completed_assessments: stats.completed_assessments || 0,
          in_progress_assessments: stats.in_progress_assessments || 0,
          average_duration: stats.average_duration || 0,
          
          // Decision breakdown
          decisions: {
            stop: stats.decisions?.stop || 0,
            amber: stats.decisions?.amber || 0,
            continue: stats.decisions?.continue || 0
          },
          
          // Supervisor activity
          supervisor_activity: stats.supervisor_activity || {},
          
          // Wizard type breakdown
          wizard_types: stats.wizard_types || {},
          
          // Performance metrics
          performance: {
            response_time_avg: stats.performance?.response_time_avg || 0,
            completion_rate: stats.performance?.completion_rate || 0,
            abandonment_rate: stats.performance?.abandonment_rate || 0
          },
          
          // Time-based data
          timeframe,
          generated_at: stats.generated_at || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching assessment statistics:', error);
      return {
        success: false,
        error: error.message,
        statistics: null
      };
    }
  }

  /**
   * POST /api/assessments/bulk-action
   * Performs bulk actions on multiple assessments
   */
  async performBulkAction(action, assessmentIds, options = {}) {
    try {
      const payload = {
        action,
        assessment_ids: assessmentIds,
        options,
        performed_by: options.supervisor || 'sdc_operator',
        timestamp: new Date().toISOString(),
        context: {
          source: 'sdc_dashboard',
          batch_size: assessmentIds.length
        }
      };

      const response = await this.request('/api/assessments/bulk-action', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        action,
        processed: response.processed || assessmentIds.length,
        results: response.results || [],
        summary: response.summary || {},
        message: response.message || `Bulk action ${action} completed`
      };
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      return {
        success: false,
        error: error.message,
        action,
        processed: 0
      };
    }
  }

  /**
   * GET /api/assessments/export
   * Exports assessment data in various formats
   */
  async exportAssessments(format = 'json', filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        format,
        ...filters,
        exported_at: new Date().toISOString()
      });

      const response = await this.request(`/api/assessments/export?${queryParams}`);
      
      return {
        success: true,
        format,
        data: response.data || response,
        metadata: {
          exported_at: new Date().toISOString(),
          record_count: response.record_count || 0,
          filters_applied: filters
        }
      };
    } catch (error) {
      console.error(`Error exporting assessments in ${format} format:`, error);
      return {
        success: false,
        error: error.message,
        format,
        data: null
      };
    }
  }
}

// Create singleton instance
const assessmentAPI = new AssessmentAPIService();

// Auto-configure authentication if available
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');
  if (token) {
    assessmentAPI.setAuthToken(token);
    console.log('🔐 Assessment API: Auto-configured with stored token');
  } else {
    console.warn('⚠️ Assessment API: No authentication token found in storage');
  }
}

export default assessmentAPI;

// Named exports for specific use cases
export {
  AssessmentAPIService
};

/**
 * React hook for assessment API operations
 */
export const useAssessmentAPI = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const execute = React.useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    execute,
    api: assessmentAPI
  };
};