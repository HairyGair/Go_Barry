/**
 * Assessment Data Integration Hook
 * Combines API and WebSocket data for comprehensive assessment management
 * Provides unified data interface for SDC Dashboard components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import assessmentAPI from '../services/assessmentAPI';
import assessmentWebSocket from '../services/assessmentWebSocket';

export const useAssessmentData = (options = {}) => {
  const {
    autoConnect = true,
    pollInterval = 10000, // 10 seconds fallback polling (performance optimized)
    enableWebSocket = true,
    enableAPI = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutes
  } = options;

  // Authentication status detection
  const hasAuthToken = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('supervisor_token');
    return Boolean(token);
  };

  // State management
  const [state, setState] = useState({
    // Data
    activeAssessments: [],
    completedAssessments: [],
    breakdownsWithAssessments: [],
    statistics: {},
    
    // Loading states
    loading: {
      assessments: false,
      breakdowns: false,
      statistics: false,
      initial: true
    },
    
    // Connection states
    connected: {
      websocket: false,
      api: true
    },
    
    // Error states
    errors: {
      websocket: null,
      api: null,
      general: null
    },
    
    // Metadata
    lastUpdated: {
      assessments: null,
      breakdowns: null,
      statistics: null
    },
    
    refreshCount: 0,
    authenticated: hasAuthToken()
  });

  // Refs for cleanup and debouncing
  const pollTimer = useRef(null);
  const cacheRefs = useRef(new Map());
  const updateQueue = useRef([]);
  const isUnmounted = useRef(false);

  /**
   * Safe state update function
   */
  const safeSetState = useCallback((updater) => {
    if (!isUnmounted.current) {
      setState(updater);
    }
  }, []);

  /**
   * Update loading state for specific operation
   */
  const setLoading = useCallback((operation, isLoading) => {
    safeSetState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [operation]: isLoading,
        initial: prev.loading.initial && isLoading
      }
    }));
  }, [safeSetState]);

  /**
   * Update error state for specific source
   */
  const setError = useCallback((source, error) => {
    safeSetState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [source]: error
      }
    }));
  }, [safeSetState]);

  /**
   * Update connection state
   */
  const setConnectionState = useCallback((source, connected) => {
    safeSetState(prev => ({
      ...prev,
      connected: {
        ...prev.connected,
        [source]: connected
      }
    }));
  }, [safeSetState]);

  /**
   * Fetch active assessments from API
   */
  const fetchActiveAssessments = useCallback(async () => {
    if (!enableAPI) return;
    
    if (!hasAuthToken()) {
      console.error('❌ Cannot fetch assessments: No authentication token');
      setError('api', 'Authentication required');
      return;
    }
    
    try {
      setLoading('assessments', true);
      setError('api', null);
      
      const result = await assessmentAPI.getInProgressAssessments();
      
      if (result.success) {
        safeSetState(prev => ({
          ...prev,
          activeAssessments: result.assessments,
          lastUpdated: {
            ...prev.lastUpdated,
            assessments: new Date().toISOString()
          },
          refreshCount: prev.refreshCount + 1
        }));
        
        console.log('✅ Fetched active assessments:', result.count);
      } else {
        throw new Error(result.error || 'Failed to fetch active assessments');
      }
    } catch (error) {
      console.error('❌ Error fetching active assessments:', error);
      setError('api', error.message);
    } finally {
      setLoading('assessments', false);
    }
  }, [enableAPI, setLoading, setError, safeSetState]);

  /**
   * Fetch breakdowns with assessment data
   */
  const fetchBreakdownsWithAssessments = useCallback(async () => {
    if (!enableAPI) return;
    
    if (!hasAuthToken()) {
      console.error('❌ Cannot fetch breakdowns: No authentication token');
      setError('api', 'Authentication required');
      return;
    }
    
    try {
      setLoading('breakdowns', true);
      setError('api', null);
      
      const result = await assessmentAPI.getBreakdownsWithAssessments();
      
      if (result.success) {
        safeSetState(prev => ({
          ...prev,
          breakdownsWithAssessments: result.breakdowns,
          lastUpdated: {
            ...prev.lastUpdated,
            breakdowns: new Date().toISOString()
          },
          refreshCount: prev.refreshCount + 1
        }));
        
        console.log('✅ Fetched breakdowns with assessments:', result.count);
      } else {
        throw new Error(result.error || 'Failed to fetch breakdowns with assessments');
      }
    } catch (error) {
      console.error('❌ Error fetching breakdowns with assessments:', error);
      setError('api', error.message);
    } finally {
      setLoading('breakdowns', false);
    }
  }, [enableAPI, setLoading, setError, safeSetState]);

  /**
   * Fetch assessment statistics
   */
  const fetchStatistics = useCallback(async () => {
    if (!enableAPI) return;
    
    if (!hasAuthToken()) {
      console.error('❌ Cannot fetch statistics: No authentication token');
      setError('api', 'Authentication required');
      return;
    }
    
    try {
      setLoading('statistics', true);
      setError('api', null);
      
      const result = await assessmentAPI.getAssessmentStatistics();
      
      if (result.success) {
        safeSetState(prev => ({
          ...prev,
          statistics: result.statistics,
          lastUpdated: {
            ...prev.lastUpdated,
            statistics: new Date().toISOString()
          }
        }));
        
        console.log('✅ Fetched assessment statistics');
      } else {
        throw new Error(result.error || 'Failed to fetch assessment statistics');
      }
    } catch (error) {
      console.error('❌ Error fetching assessment statistics:', error);
      setError('api', error.message);
    } finally {
      setLoading('statistics', false);
    }
  }, [enableAPI, setLoading, setError, safeSetState]);

  /**
   * Fetch all data
   */
  const fetchAllData = useCallback(async () => {
    console.log('🔄 Fetching all assessment data...');
    
    await Promise.allSettled([
      fetchActiveAssessments(),
      fetchBreakdownsWithAssessments(),
      fetchStatistics()
    ]);
    
    safeSetState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        initial: false
      }
    }));
  }, [fetchActiveAssessments, fetchBreakdownsWithAssessments, fetchStatistics, safeSetState]);

  /**
   * Handle WebSocket events
   */
  const handleWebSocketEvent = useCallback((data, eventType) => {
    console.log(`📨 WebSocket event: ${eventType}`, data);
    
    switch (eventType) {
      case 'fallback_mode_enabled':
        console.log('🔄 Enabling fallback mode for assessment data');
        safeSetState(prev => ({
          ...prev,
          connected: {
            ...prev.connected,
            websocket: false
          },
          errors: {
            ...prev.errors,
            websocket: data.reason || 'Fallback mode enabled'
          }
        }));
        
        // Increase polling frequency when in fallback mode
        if (pollTimer.current) {
          clearInterval(pollTimer.current);
        }
        setupPolling(true); // true = fallback mode
        break;
      case 'assessment_started':
      case 'assessment_progress':
      case 'assessment_step_completed':
        // Update active assessments from WebSocket
        safeSetState(prev => ({
          ...prev,
          activeAssessments: assessmentWebSocket.getActiveAssessments(),
          lastUpdated: {
            ...prev.lastUpdated,
            assessments: new Date().toISOString()
          }
        }));
        break;
        
      case 'assessment_completed':
      case 'assessment_cancelled':
      case 'assessment_timeout':
        // Update both active and completed assessments
        safeSetState(prev => ({
          ...prev,
          activeAssessments: assessmentWebSocket.getActiveAssessments(),
          completedAssessments: assessmentWebSocket.getCompletedAssessments(10),
          lastUpdated: {
            ...prev.lastUpdated,
            assessments: new Date().toISOString()
          }
        }));
        break;
        
      case 'statistics_updated':
        // Update statistics from WebSocket
        safeSetState(prev => ({
          ...prev,
          statistics: {
            ...prev.statistics,
            ...assessmentWebSocket.getStatistics()
          },
          lastUpdated: {
            ...prev.lastUpdated,
            statistics: new Date().toISOString()
          }
        }));
        break;
        
      case 'breakdown_assessment_updated':
        // Refresh breakdown data when assessment is updated
        fetchBreakdownsWithAssessments();
        break;
        
      case 'connection_opened':
        setConnectionState('websocket', true);
        setError('websocket', null);
        break;
        
      case 'connection_closed':
        setConnectionState('websocket', false);
        break;
        
      case 'connection_error':
        setConnectionState('websocket', false);
        setError('websocket', data.error?.message || 'WebSocket connection error');
        break;
    }
  }, [safeSetState, setConnectionState, setError, fetchBreakdownsWithAssessments]);

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(async () => {
    if (!enableWebSocket) return;
    
    try {
      console.log('🔌 Initializing assessment WebSocket...');
      
      // Subscribe to all events
      assessmentWebSocket.subscribe('*', handleWebSocketEvent);
      
      // Connect
      const connected = await assessmentWebSocket.connect();
      setConnectionState('websocket', connected);
      
      if (connected) {
        console.log('✅ Assessment WebSocket connected');
      } else {
        console.warn('⚠️ Assessment WebSocket connection failed');
      }
    } catch (error) {
      console.error('❌ WebSocket initialization error:', error);
      setError('websocket', error.message);
    }
  }, [enableWebSocket, handleWebSocketEvent, setConnectionState, setError]);

  /**
   * Setup polling fallback
   */
  const setupPolling = useCallback((fallbackMode = false) => {
    if (!enableAPI) return;
    
    // Adjust polling interval based on mode (maintain 10s minimum for performance)
    const interval = fallbackMode ? Math.max(pollInterval / 2, 10000) : pollInterval; // Faster polling in fallback mode, min 10s
    
    if (!interval) return;
    
    console.log(`⏰ Setting up polling every ${interval}ms ${fallbackMode ? '(fallback mode)' : ''}`);
    
    pollTimer.current = setInterval(() => {
      // Poll if WebSocket is not connected, has errors, or we're in fallback mode
      if (!state.connected.websocket || state.errors.websocket || fallbackMode) {
        console.log(`🔄 Polling for assessment data ${fallbackMode ? '(fallback mode)' : '(WebSocket unavailable)'}`);
        fetchAllData();
      }
    }, interval);
  }, [enableAPI, pollInterval, state.connected.websocket, state.errors.websocket, fetchAllData]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up assessment data hook');
    
    isUnmounted.current = true;
    
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    
    if (enableWebSocket) {
      assessmentWebSocket.disconnect();
    }
    
    cacheRefs.current.clear();
    updateQueue.current = [];
  }, [enableWebSocket]);

  // Initialize on mount
  useEffect(() => {
    if (autoConnect) {
      console.log('🚀 Initializing assessment data integration...');
      if (hasAuthToken()) {
        console.log('🔐 Assessment Data: Authentication token found');
        
        // Fetch initial data
        fetchAllData();
        
        // Initialize WebSocket
        initializeWebSocket();
        
        // Setup polling fallback
        setupPolling();
      } else {
        console.error('❌ Assessment Data: No authentication token available');
        setError('general', 'Authentication required');
      }
    }
    
    return cleanup;
  }, [autoConnect, fetchAllData, initializeWebSocket, setupPolling, cleanup]);

  // Update polling when connection state changes
  useEffect(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
    }
    setupPolling();
  }, [setupPolling, state.connected.websocket, state.errors.websocket]);

  // Public API
  const api = {
    // Data access
    ...state,
    
    // Manual refresh functions
    refresh: {
      all: fetchAllData,
      assessments: fetchActiveAssessments,
      breakdowns: fetchBreakdownsWithAssessments,
      statistics: fetchStatistics
    },
    
    // Assessment operations
    getAssessmentDetails: async (breakdownId) => {
      return await assessmentAPI.getBreakdownAssessmentDetails(breakdownId);
    },
    
    updateAssessmentResult: async (breakdownId, result) => {
      return await assessmentAPI.updateBreakdownAssessmentResult(breakdownId, result);
    },
    
    editAssessment: async (assessmentId, editRequest) => {
      return await assessmentAPI.editAssessment(assessmentId, editRequest);
    },
    
    // WebSocket operations
    sendWebSocketMessage: (message) => {
      return assessmentWebSocket.send(message);
    },
    
    subscribeToEvents: (eventType, callback) => {
      return assessmentWebSocket.subscribe(eventType, callback);
    },
    
    // Utility functions
    isConnected: () => state.connected.websocket || state.connected.api,
    hasData: () => state.activeAssessments.length > 0 || state.breakdownsWithAssessments.length > 0,
    isAuthenticated: hasAuthToken,
    requiresAuth: () => !hasAuthToken(),
    getDataAge: () => {
      const timestamps = Object.values(state.lastUpdated).filter(Boolean);
      if (timestamps.length === 0) return null;
      
      const oldest = Math.min(...timestamps.map(t => new Date(t).getTime()));
      return Date.now() - oldest;
    }
  };

  return api;
};

export default useAssessmentData;