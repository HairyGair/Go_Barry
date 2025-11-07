/**
 * Assessment WebSocket Integration
 * Handles real-time assessment updates via WebSocket /ws/assessments
 * Provides live data synchronization for SDC Dashboard
 */

import websocketService from './websocket';
import { websocketConfig } from '../breakdown-guide/components/common/constants';

class AssessmentWebSocketService {
  constructor() {
    // Use the configured WebSocket endpoint for assessments
    this.endpoint = websocketConfig.endpoints.assessments || '/ws/assessments';
    this.baseUrl = websocketConfig.url || 'wss://api.breakdowns.gobarry.co.uk/ws';
    this.fullUrl = `${this.baseUrl}${this.endpoint}`;
    this.isConnected = false;
    this.subscribers = new Map();
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
    this.lastConnectionTime = null;
    
    // Assessment data cache
    this.activeAssessments = new Map();
    this.completedAssessments = new Map();
    this.assessmentStatistics = {};
    
    // Event handlers
    this.eventHandlers = {
      'assessment_started': this.handleAssessmentStarted.bind(this),
      'assessment_progress': this.handleAssessmentProgress.bind(this),
      'assessment_step_completed': this.handleAssessmentStepCompleted.bind(this),
      'assessment_completed': this.handleAssessmentCompleted.bind(this),
      'assessment_cancelled': this.handleAssessmentCancelled.bind(this),
      'assessment_resumed': this.handleAssessmentResumed.bind(this),
      'assessment_timeout': this.handleAssessmentTimeout.bind(this),
      'assessment_error': this.handleAssessmentError.bind(this),
      'breakdown_assessment_updated': this.handleBreakdownAssessmentUpdated.bind(this),
      'supervisor_joined': this.handleSupervisorJoined.bind(this),
      'supervisor_left': this.handleSupervisorLeft.bind(this),
      'statistics_updated': this.handleStatisticsUpdated.bind(this)
    };
  }

  /**
   * Initialize WebSocket connection for assessments
   */
  async connect() {
    try {
      console.log(`🔌 Connecting to Assessment WebSocket: ${this.fullUrl}`);

      // Get authentication token from storage
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      if (!token) {
        console.warn('⚠️ No authentication token found - Assessment WebSocket may fail');
      } else {
        console.log('🔒 Assessment WebSocket connecting with authentication');
      }

      const connectionOptions = {
        onMessage: this.handleMessage.bind(this),
        onOpen: this.handleConnectionOpen.bind(this),
        onClose: this.handleConnectionClose.bind(this),
        onError: this.handleConnectionError.bind(this),
        autoReconnect: websocketConfig.features.autoReconnect,
        heartbeat: websocketConfig.features.heartbeat,
        reconnectAttempts: websocketConfig.reconnectAttempts,
        reconnectInterval: websocketConfig.reconnectInterval,
        connectionTimeout: websocketConfig.connectionTimeout,
        requireAuth: true // Enable authentication for protected channels
      };
      
      const connection = websocketService.connect(this.endpoint, connectionOptions);

      if (connection) {
        this.isConnected = true;
        this.connectionAttempts = 0;
        console.log('✅ Assessment WebSocket connected');
        
        // Request initial data
        this.requestInitialData();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Assessment WebSocket connection failed:', error);
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    console.log('🔌 Disconnecting Assessment WebSocket...');
    websocketService.disconnect(this.endpoint);
    this.isConnected = false;
    this.clearCache();
  }

  /**
   * Subscribe to assessment events
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Send message to WebSocket
   */
  async send(message) {
    if (!this.isConnected) {
      console.warn('⚠️ Assessment WebSocket not connected, queuing message');
      return false;
    }

    // Auth removed - no token in payload
    const payload = {
      timestamp: new Date().toISOString(),
      source: 'sdc_dashboard',
      ...message
    };

    return websocketService.send(this.endpoint, payload);
  }

  /**
   * Request initial assessment data
   */
  requestInitialData() {
    this.send({
      type: 'request_initial_data',
      data_types: [
        'active_assessments',
        'completed_assessments_recent',
        'assessment_statistics',
        'supervisor_status'
      ]
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    console.log('📨 Assessment WebSocket message:', message);
    
    const { type, data } = message;
    
    // Route to specific handler
    const handler = this.eventHandlers[type];
    if (handler) {
      try {
        handler(data, message);
      } catch (error) {
        console.error(`Error handling ${type} event:`, error);
      }
    } else {
      console.warn(`No handler for assessment event type: ${type}`);
    }
    
    // Notify subscribers
    this.notifySubscribers(type, data, message);
  }

  /**
   * Handle connection open
   */
  handleConnectionOpen() {
    console.log('✅ Assessment WebSocket connection opened');
    this.isConnected = true;
    this.connectionAttempts = 0;
    this.lastConnectionTime = Date.now();
    
    // Subscribe to assessment events
    this.send({
      type: 'subscribe',
      events: Object.keys(this.eventHandlers),
      subscriber_id: `sdc_dashboard_${Date.now()}`
    });
    
    this.notifySubscribers('connection_opened', { connected: true });
  }

  /**
   * Handle connection close
   */
  handleConnectionClose(event) {
    console.log('🔌 Assessment WebSocket connection closed:', event);
    this.isConnected = false;
    
    // Enhanced disconnection handling
    const disconnectionInfo = {
      connected: false,
      event,
      wasClean: event.wasClean,
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString(),
      attempt: this.connectionAttempts
    };
    
    // Determine if reconnection should be attempted
    const shouldReconnect = !event.wasClean || 
                           event.code === 1006 || // Abnormal closure
                           event.code === 1001 || // Going away
                           event.code === 1011;   // Server error
    
    if (shouldReconnect) {
      console.log('🔄 Assessment WebSocket will attempt reconnection');
      this.scheduleReconnect();
    } else {
      console.log('🛑 Assessment WebSocket disconnected cleanly, no reconnection needed');
    }
    
    // Notify subscribers with enhanced information
    this.notifySubscribers('connection_closed', disconnectionInfo);
    
    // Enable fallback mode for subscribers
    this.notifySubscribers('fallback_mode_enabled', {
      reason: 'websocket_disconnected',
      fallbackOptions: ['polling', 'manual_refresh'],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle connection error
   */
  handleConnectionError(error) {
    console.error('❌ Assessment WebSocket error:', error);
    this.isConnected = false;
    
    // Enhanced error handling with categorization
    const errorInfo = {
      error,
      type: this.categorizeError(error),
      timestamp: new Date().toISOString(),
      attempt: this.connectionAttempts,
      nextRetryIn: this.getNextRetryDelay(),
      fallbackRecommended: this.shouldEnableFallback(error)
    };
    
    this.notifySubscribers('connection_error', errorInfo);
    
    // Enable fallback mode for certain error types
    if (errorInfo.fallbackRecommended) {
      this.notifySubscribers('fallback_mode_enabled', {
        reason: 'connection_error',
        errorType: errorInfo.type,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Categorize connection errors
   */
  categorizeError(error) {
    if (!error) return 'unknown';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    } else if (message.includes('timeout')) {
      return 'timeout';
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      return 'authentication';
    } else if (message.includes('rate limit') || message.includes('too many')) {
      return 'rate_limit';
    } else if (message.includes('server') || error.code >= 500) {
      return 'server_error';
    } else if (error.code >= 400 && error.code < 500) {
      return 'client_error';
    }
    
    return 'unknown';
  }

  /**
   * Determine if fallback mode should be enabled
   */
  shouldEnableFallback(error) {
    const errorType = this.categorizeError(error);
    const persistentErrors = ['network_error', 'server_error', 'timeout'];
    
    return persistentErrors.includes(errorType) || 
           this.connectionAttempts >= Math.floor(this.maxReconnectAttempts / 2);
  }

  /**
   * Get next retry delay
   */
  getNextRetryDelay() {
    return this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);
  }

  /**
   * Schedule reconnection attempt with enhanced logic
   */
  scheduleReconnect() {
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached for Assessment WebSocket`);
      
      // Notify subscribers of permanent failure
      this.notifySubscribers('connection_failed_permanently', {
        attempts: this.connectionAttempts,
        maxAttempts: this.maxReconnectAttempts,
        timestamp: new Date().toISOString(),
        recommendation: 'manual_retry_or_fallback'
      });
      
      return;
    }
    
    this.connectionAttempts++;
    
    // Enhanced delay calculation with jitter to prevent thundering herd
    const baseDelay = this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
    
    console.log(`🔄 Scheduling Assessment WebSocket reconnect in ${Math.round(delay)}ms (attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})`);
    
    // Notify subscribers of retry attempt
    this.notifySubscribers('connection_retry_scheduled', {
      attempt: this.connectionAttempts,
      delay: Math.round(delay),
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      console.log(`🔄 Attempting Assessment WebSocket reconnection (${this.connectionAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  /**
   * Manual retry connection (resets attempt counter)
   */
  async manualRetry() {
    console.log('🔄 Manual retry of Assessment WebSocket connection');
    
    // Reset connection attempts for manual retry
    this.connectionAttempts = 0;
    
    // Disconnect existing connection if any
    if (this.isConnected) {
      this.disconnect();
    }
    
    // Clear any pending reconnection attempts
    clearTimeout(this.reconnectTimer);
    
    // Attempt connection
    return await this.connect();
  }

  /**
   * Reset connection state (useful for clean restart)
   */
  resetConnectionState() {
    this.connectionAttempts = 0;
    this.isConnected = false;
    this.clearCache();
    
    console.log('🔄 Assessment WebSocket connection state reset');
  }

  /**
   * Get connection health information
   */
  getConnectionHealth() {
    const now = Date.now();
    const isHealthy = this.isConnected && this.connectionAttempts === 0;
    
    return {
      connected: this.isConnected,
      healthy: isHealthy,
      attempts: this.connectionAttempts,
      maxAttempts: this.maxReconnectAttempts,
      attemptsRemaining: Math.max(0, this.maxReconnectAttempts - this.connectionAttempts),
      lastConnectionTime: this.lastConnectionTime || null,
      connectionAge: this.lastConnectionTime ? now - this.lastConnectionTime : null,
      canRetry: this.connectionAttempts < this.maxReconnectAttempts,
      status: this.getConnectionStatus(),
      recommendation: this.getHealthRecommendation()
    };
  }

  /**
   * Get connection status string
   */
  getConnectionStatus() {
    if (this.isConnected) return 'connected';
    if (this.connectionAttempts >= this.maxReconnectAttempts) return 'failed';
    if (this.connectionAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  /**
   * Get health-based recommendation
   */
  getHealthRecommendation() {
    const health = this.getConnectionHealth();
    
    if (health.connected && health.healthy) {
      return 'optimal';
    } else if (health.connected && !health.healthy) {
      return 'monitor';
    } else if (health.canRetry) {
      return 'wait_for_retry';
    } else {
      return 'manual_intervention';
    }
  }

  /**
   * Notify subscribers of events
   */
  notifySubscribers(eventType, data, originalMessage = null) {
    const callbacks = this.subscribers.get(eventType) || new Set();
    const allCallbacks = this.subscribers.get('*') || new Set();
    
    const allSubscribers = new Set([...callbacks, ...allCallbacks]);
    
    allSubscribers.forEach(callback => {
      try {
        callback(data, eventType, originalMessage);
      } catch (error) {
        console.error(`Error in assessment event subscriber for ${eventType}:`, error);
      }
    });
  }

  // Event Handlers

  /**
   * Handle assessment started event
   */
  handleAssessmentStarted(data) {
    const assessment = {
      id: data.assessment_id || data.breakdown_id,
      breakdown_id: data.breakdown_id,
      wizard_type: data.wizard_type,
      supervisor: data.supervisor,
      vehicle: data.vehicle,
      started_at: data.started_at || new Date().toISOString(),
      current_step: data.current_step || '1',
      total_steps: data.total_steps || '5',
      status: 'in_progress'
    };
    
    this.activeAssessments.set(assessment.id, assessment);
    console.log(`📊 Assessment started: ${assessment.id}`);
  }

  /**
   * Handle assessment progress update
   */
  handleAssessmentProgress(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const existing = this.activeAssessments.get(assessmentId);
    
    if (existing) {
      const updated = {
        ...existing,
        current_step: data.current_step || existing.current_step,
        total_steps: data.total_steps || existing.total_steps,
        step_description: data.step_description,
        progress_percentage: data.progress_percentage,
        updated_at: new Date().toISOString(),
        responses: data.responses || existing.responses
      };
      
      this.activeAssessments.set(assessmentId, updated);
      console.log(`📊 Assessment progress: ${assessmentId} - ${updated.current_step}/${updated.total_steps}`);
    }
  }

  /**
   * Handle assessment step completed
   */
  handleAssessmentStepCompleted(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const existing = this.activeAssessments.get(assessmentId);
    
    if (existing) {
      const updated = {
        ...existing,
        current_step: data.new_step || existing.current_step,
        completed_steps: [...(existing.completed_steps || []), data.completed_step],
        step_responses: {
          ...existing.step_responses,
          [data.completed_step]: data.step_response
        },
        updated_at: new Date().toISOString()
      };
      
      this.activeAssessments.set(assessmentId, updated);
      console.log(`📊 Assessment step completed: ${assessmentId} - Step ${data.completed_step}`);
    }
  }

  /**
   * Handle assessment completed event
   */
  handleAssessmentCompleted(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const existing = this.activeAssessments.get(assessmentId);
    
    if (existing) {
      const completed = {
        ...existing,
        status: 'completed',
        completed_at: data.completed_at || new Date().toISOString(),
        decision: data.decision,
        decision_reason: data.decision_reason,
        duration: data.duration,
        wizard_responses: data.wizard_responses || {},
        recommended_actions: data.recommended_actions || []
      };
      
      // Move to completed assessments
      this.completedAssessments.set(assessmentId, completed);
      this.activeAssessments.delete(assessmentId);
      
      console.log(`📊 Assessment completed: ${assessmentId} - Decision: ${completed.decision}`);
    }
  }

  /**
   * Handle assessment cancelled event
   */
  handleAssessmentCancelled(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const existing = this.activeAssessments.get(assessmentId);
    
    if (existing) {
      const cancelled = {
        ...existing,
        status: 'cancelled',
        cancelled_at: data.cancelled_at || new Date().toISOString(),
        cancel_reason: data.cancel_reason
      };
      
      this.completedAssessments.set(assessmentId, cancelled);
      this.activeAssessments.delete(assessmentId);
      
      console.log(`📊 Assessment cancelled: ${assessmentId}`);
    }
  }

  /**
   * Handle assessment resumed event
   */
  handleAssessmentResumed(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const assessment = {
      id: assessmentId,
      breakdown_id: data.breakdown_id,
      wizard_type: data.wizard_type,
      supervisor: data.supervisor,
      vehicle: data.vehicle,
      started_at: data.originally_started_at,
      resumed_at: data.resumed_at || new Date().toISOString(),
      current_step: data.current_step,
      total_steps: data.total_steps,
      status: 'in_progress'
    };
    
    this.activeAssessments.set(assessmentId, assessment);
    this.completedAssessments.delete(assessmentId);
    
    console.log(`📊 Assessment resumed: ${assessmentId}`);
  }

  /**
   * Handle assessment timeout event
   */
  handleAssessmentTimeout(data) {
    const assessmentId = data.assessment_id || data.breakdown_id;
    const existing = this.activeAssessments.get(assessmentId);
    
    if (existing) {
      const timedOut = {
        ...existing,
        status: 'timeout',
        timeout_at: data.timeout_at || new Date().toISOString(),
        timeout_reason: data.timeout_reason || 'inactivity'
      };
      
      this.completedAssessments.set(assessmentId, timedOut);
      this.activeAssessments.delete(assessmentId);
      
      console.log(`📊 Assessment timeout: ${assessmentId}`);
    }
  }

  /**
   * Handle assessment error event
   */
  handleAssessmentError(data) {
    console.error('📊 Assessment error:', data);
    
    const assessmentId = data.assessment_id || data.breakdown_id;
    if (assessmentId && this.activeAssessments.has(assessmentId)) {
      const existing = this.activeAssessments.get(assessmentId);
      existing.last_error = {
        error: data.error,
        timestamp: new Date().toISOString()
      };
      this.activeAssessments.set(assessmentId, existing);
    }
  }

  /**
   * Handle breakdown assessment updated event
   */
  handleBreakdownAssessmentUpdated(data) {
    console.log(`📊 Breakdown assessment updated: ${data.breakdown_id}`);
    // This event indicates that assessment data for a breakdown has been updated
    // Useful for triggering dashboard refreshes
  }

  /**
   * Handle supervisor joined event
   */
  handleSupervisorJoined(data) {
    console.log(`📊 Supervisor joined: ${data.supervisor_name || data.supervisor_badge}`);
  }

  /**
   * Handle supervisor left event
   */
  handleSupervisorLeft(data) {
    console.log(`📊 Supervisor left: ${data.supervisor_name || data.supervisor_badge}`);
  }

  /**
   * Handle statistics updated event
   */
  handleStatisticsUpdated(data) {
    this.assessmentStatistics = {
      ...this.assessmentStatistics,
      ...data,
      last_updated: new Date().toISOString()
    };
    console.log('📊 Assessment statistics updated');
  }

  /**
   * Get current active assessments
   */
  getActiveAssessments() {
    return Array.from(this.activeAssessments.values());
  }

  /**
   * Get recent completed assessments
   */
  getCompletedAssessments(limit = 50) {
    const completed = Array.from(this.completedAssessments.values());
    return completed
      .sort((a, b) => new Date(b.completed_at || b.cancelled_at || b.timeout_at) - new Date(a.completed_at || a.cancelled_at || a.timeout_at))
      .slice(0, limit);
  }

  /**
   * Get assessment statistics
   */
  getStatistics() {
    return this.assessmentStatistics;
  }

  /**
   * Clear local cache
   */
  clearCache() {
    this.activeAssessments.clear();
    this.completedAssessments.clear();
    this.assessmentStatistics = {};
  }

  /**
   * Check connection status
   */
  isSocketConnected() {
    return this.isConnected && websocketService.isConnected(this.endpoint);
  }

  /**
   * Check if authentication token is available
   */
  async hasAuthToken() {
    // Auth removed - always return false
    return false;
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    return {
      endpoint: this.endpoint,
      fullUrl: this.fullUrl,
      connected: this.isConnected,
      authenticated: this.hasAuthToken(),
      connectionAttempts: this.connectionAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Create singleton instance
const assessmentWebSocket = new AssessmentWebSocketService();

export default assessmentWebSocket;

/**
 * React hook for assessment WebSocket
 */
export const useAssessmentWebSocket = (autoConnect = true) => {
  const [connected, setConnected] = React.useState(false);
  const [activeAssessments, setActiveAssessments] = React.useState([]);
  const [completedAssessments, setCompletedAssessments] = React.useState([]);
  const [statistics, setStatistics] = React.useState({});

  React.useEffect(() => {
    if (autoConnect && !connected) {
      assessmentWebSocket.connect();
    }

    // Subscribe to connection events
    const unsubscribeConnection = assessmentWebSocket.subscribe('connection_opened', () => {
      setConnected(true);
    });

    const unsubscribeDisconnection = assessmentWebSocket.subscribe('connection_closed', () => {
      setConnected(false);
    });

    // Subscribe to data updates
    const unsubscribeData = assessmentWebSocket.subscribe('*', () => {
      setActiveAssessments(assessmentWebSocket.getActiveAssessments());
      setCompletedAssessments(assessmentWebSocket.getCompletedAssessments(10));
      setStatistics(assessmentWebSocket.getStatistics());
    });

    return () => {
      unsubscribeConnection();
      unsubscribeDisconnection();
      unsubscribeData();
    };
  }, [autoConnect, connected]);

  return {
    connected,
    activeAssessments,
    completedAssessments,
    statistics,
    socket: assessmentWebSocket
  };
};