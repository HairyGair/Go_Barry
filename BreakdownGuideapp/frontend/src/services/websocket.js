/**
 * WebSocket Service for Real-time Updates
 * Provides robust WebSocket connections with fallback polling
 * Handles automatic reconnection, heartbeat, and message routing
 * Enhanced with assessment event handling for SDC Dashboard integration
 */

import React from 'react';
import { websocketConfig, realtimeConfig } from '../breakdown-guide/components/common/constants';

class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.reconnectTimers = new Map();
    this.heartbeatTimers = new Map();
    this.connectionStates = new Map();
    this.retryAttempts = new Map();
    this.isInitialized = false;
    
    // Assessment event management
    this.assessmentStates = new Map();
    this.activeAssessments = new Map();
    this.completedAssessments = new Map();
    this.assessmentEventHandlers = new Map();
    
    // Initialize assessment event handlers
    this.initializeAssessmentEvents();
  }

  /**
   * Initialize assessment event handling system
   */
  initializeAssessmentEvents() {
    // Define assessment event handlers with enhanced functionality
    const assessmentEvents = {
      'assessment_started': (data) => this.updateInProgressAssessments(data),
      'wizard_started': (data) => this.updateInProgressAssessments(data), // Alias
      'assessment_step_completed': (data) => this.updateAssessmentProgress(data),
      'assessment_progress': (data) => this.updateAssessmentProgress(data), // Alias
      'assessment_completed': (data) => this.moveToCompletedBreakdowns(data),
      'wizard_completed': (data) => this.moveToCompletedBreakdowns(data), // Alias
      'assessment_decision_changed': (data) => this.updateBreakdownDecision(data),
      'assessment_cancelled': (data) => this.handleAssessmentCancellation(data),
      'assessment_resumed': (data) => this.handleAssessmentResumption(data),
      'assessment_timeout': (data) => this.handleAssessmentTimeout(data),
      'breakdown_created': (data) => this.handleBreakdownCreated(data),
      'engineer_assigned': (data) => this.handleEngineerAssigned(data),
      'engineering_dispatched': (data) => this.handleEngineerAssigned(data) // Alias
    };

    this.assessmentEventHandlers = new Map(Object.entries(assessmentEvents));
    console.log('📊 Assessment event handlers initialized:', Array.from(this.assessmentEventHandlers.keys()));
  }

  /**
   * Initialize the WebSocket service
   */
  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔌 Initializing WebSocket Service with Assessment Events');
    this.isInitialized = true;
    
    // Listen for page visibility changes to manage connections
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.reconnectAll();
        } else {
          this.pauseHeartbeats();
        }
      });
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('📶 Network online - reconnecting WebSockets');
        this.reconnectAll();
      });
      
      window.addEventListener('offline', () => {
        console.log('📵 Network offline - pausing WebSockets');
        this.closeAll();
      });
    }
  }

  /**
   * Connect to a WebSocket endpoint
   */
  connect(endpoint, options = {}) {
    const {
      onMessage = () => {},
      onOpen = () => {},
      onClose = () => {},
      onError = () => {},
      autoReconnect = websocketConfig.features.autoReconnect,
      heartbeat = websocketConfig.features.heartbeat
    } = options;

    if (this.connections.has(endpoint)) {
      console.log(`⚠️ Connection to ${endpoint} already exists`);
      return this.connections.get(endpoint);
    }

    const fullUrl = `${websocketConfig.url}${endpoint}`;
    console.log(`🔌 Connecting to WebSocket: ${fullUrl}`);

    try {
      const ws = new WebSocket(fullUrl);
      
      // Set connection timeout
      const timeoutId = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log(`⏰ Connection timeout for ${endpoint}`);
          ws.close();
        }
      }, websocketConfig.connectionTimeout);

      ws.onopen = (event) => {
        console.log(`✅ WebSocket connected: ${endpoint}`);
        clearTimeout(timeoutId);
        
        this.connectionStates.set(endpoint, 'connected');
        this.retryAttempts.set(endpoint, 0);
        
        if (heartbeat) {
          this.startHeartbeat(endpoint, ws);
        }
        
        onOpen(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📨 WebSocket message from ${endpoint}:`, data);
          
          // Handle heartbeat responses
          if (data.type === 'pong') {
            return;
          }
          
          // Process assessment events first
          this.processAssessmentEvent(data);
          
          onMessage(data);
          
          // Notify global message handlers
          const handlers = this.messageHandlers.get(endpoint) || [];
          handlers.forEach(handler => handler(data));
          
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${endpoint}:`, error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${endpoint}`, event.code, event.reason);
        clearTimeout(timeoutId);
        
        this.connectionStates.set(endpoint, 'disconnected');
        this.stopHeartbeat(endpoint);
        
        if (autoReconnect && !event.wasClean) {
          this.scheduleReconnect(endpoint, options);
        }
        
        onClose(event);
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error: ${endpoint}`, error);
        this.connectionStates.set(endpoint, 'error');
        onError(error);
      };

      this.connections.set(endpoint, ws);
      this.connectionStates.set(endpoint, 'connecting');
      
      return ws;
      
    } catch (error) {
      console.error(`Failed to create WebSocket connection to ${endpoint}:`, error);
      this.connectionStates.set(endpoint, 'error');
      return null;
    }
  }

  /**
   * Send message through WebSocket
   */
  send(endpoint, message) {
    const ws = this.connections.get(endpoint);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message to ${endpoint} - connection not ready`);
      return false;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(payload);
      console.log(`📤 Sent message to ${endpoint}:`, message);
      return true;
    } catch (error) {
      console.error(`Error sending message to ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to messages from an endpoint
   */
  subscribe(endpoint, handler) {
    if (!this.messageHandlers.has(endpoint)) {
      this.messageHandlers.set(endpoint, []);
    }
    
    this.messageHandlers.get(endpoint).push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(endpoint) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Disconnect from an endpoint
   */
  disconnect(endpoint) {
    const ws = this.connections.get(endpoint);
    
    if (ws) {
      console.log(`🔌 Disconnecting from ${endpoint}`);
      this.stopHeartbeat(endpoint);
      this.clearReconnectTimer(endpoint);
      ws.close(1000, 'Manual disconnect');
      this.connections.delete(endpoint);
      this.connectionStates.delete(endpoint);
      this.messageHandlers.delete(endpoint);
      this.retryAttempts.delete(endpoint);
    }
  }

  /**
   * Get connection state for an endpoint
   */
  getConnectionState(endpoint) {
    return this.connectionStates.get(endpoint) || 'disconnected';
  }

  /**
   * Check if endpoint is connected
   */
  isConnected(endpoint) {
    const ws = this.connections.get(endpoint);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Start heartbeat for connection
   */
  startHeartbeat(endpoint, ws) {
    this.stopHeartbeat(endpoint); // Clear any existing heartbeat
    
    const heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error(`Heartbeat failed for ${endpoint}:`, error);
          this.stopHeartbeat(endpoint);
        }
      } else {
        this.stopHeartbeat(endpoint);
      }
    }, websocketConfig.heartbeatInterval);
    
    this.heartbeatTimers.set(endpoint, heartbeatTimer);
  }

  /**
   * Stop heartbeat for connection
   */
  stopHeartbeat(endpoint) {
    const timer = this.heartbeatTimers.get(endpoint);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(endpoint);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(endpoint, options) {
    this.clearReconnectTimer(endpoint);
    
    const attempts = this.retryAttempts.get(endpoint) || 0;
    
    if (attempts >= websocketConfig.reconnectAttempts) {
      console.log(`🔌 Max reconnection attempts reached for ${endpoint}`);
      this.connectionStates.set(endpoint, 'failed');
      return;
    }

    const delay = this.calculateBackoffDelay(attempts);
    console.log(`🔄 Scheduling reconnect for ${endpoint} in ${delay}ms (attempt ${attempts + 1})`);
    
    const timer = setTimeout(() => {
      this.retryAttempts.set(endpoint, attempts + 1);
      console.log(`🔄 Reconnecting to ${endpoint} (attempt ${attempts + 1})`);
      
      // Remove old connection
      this.connections.delete(endpoint);
      
      // Attempt reconnection
      this.connect(endpoint, options);
      
    }, delay);
    
    this.reconnectTimers.set(endpoint, timer);
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attempts) {
    const { initial, max, factor } = websocketConfig.retryBackoff;
    const delay = Math.min(initial * Math.pow(factor, attempts), max);
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return Math.floor(delay + jitter);
  }

  /**
   * Clear reconnection timer
   */
  clearReconnectTimer(endpoint) {
    const timer = this.reconnectTimers.get(endpoint);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(endpoint);
    }
  }

  /**
   * Reconnect all connections
   */
  reconnectAll() {
    console.log('🔄 Reconnecting all WebSocket connections');
    
    for (const [endpoint, ws] of this.connections.entries()) {
      if (ws.readyState !== WebSocket.OPEN) {
        this.retryAttempts.set(endpoint, 0); // Reset retry count
        this.connect(endpoint, { autoReconnect: true, heartbeat: true });
      }
    }
  }

  /**
   * Pause all heartbeats (e.g., when page is hidden)
   */
  pauseHeartbeats() {
    console.log('⏸️ Pausing WebSocket heartbeats');
    for (const endpoint of this.heartbeatTimers.keys()) {
      this.stopHeartbeat(endpoint);
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    console.log('🔌 Closing all WebSocket connections');
    
    for (const endpoint of this.connections.keys()) {
      this.disconnect(endpoint);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      connectedCount: 0,
      connectingCount: 0,
      disconnectedCount: 0,
      errorCount: 0,
      connections: {}
    };

    for (const [endpoint, state] of this.connectionStates.entries()) {
      stats.connections[endpoint] = {
        state,
        retryAttempts: this.retryAttempts.get(endpoint) || 0,
        hasHeartbeat: this.heartbeatTimers.has(endpoint)
      };

      switch (state) {
        case 'connected':
          stats.connectedCount++;
          break;
        case 'connecting':
          stats.connectingCount++;
          break;
        case 'disconnected':
          stats.disconnectedCount++;
          break;
        case 'error':
        case 'failed':
          stats.errorCount++;
          break;
      }
    }

    return stats;
  }

  /**
   * Process assessment-related WebSocket events
   */
  processAssessmentEvent(data) {
    const eventType = data.type || data.event_type;
    
    if (!eventType) return;
    
    const handler = this.assessmentEventHandlers.get(eventType);
    if (handler) {
      try {
        console.log(`📊 Processing assessment event: ${eventType}`, data);
        handler(data);
      } catch (error) {
        console.error(`Error processing assessment event ${eventType}:`, error);
      }
    }
  }

  /**
   * Update in-progress assessments when started
   */
  updateInProgressAssessments(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    const fleetNumber = data.vehicle?.fleetNumber || data.fleet_no || data.fleet_number;
    
    if (!assessmentId) {
      console.warn('Assessment started event missing assessment ID:', data);
      return;
    }

    const assessment = {
      id: assessmentId,
      breakdown_id: data.breakdown_id || data.breakdownId,
      fleet_number: fleetNumber,
      assessment_id: assessmentId,
      supervisor_name: data.supervisor?.name || data.supervisor_name,
      supervisor_badge: data.supervisor?.badge || data.supervisor_badge,
      wizard_type: data.wizard_type || data.wizardType || data.issue_type,
      location: data.location,
      route: data.route,
      startTime: data.timestamp || data.startTime || new Date().toISOString(),
      currentStep: data.currentStep || '1',
      totalSteps: data.totalSteps || '5',
      stepDescription: data.stepDescription || 'Starting assessment...',
      estimatedCompletion: data.estimatedCompletion || '5 mins',
      priority: data.priority || 'normal',
      status: 'in_progress',
      lastUpdated: new Date().toISOString()
    };

    this.activeAssessments.set(assessmentId, assessment);
    this.assessmentStates.set(assessmentId, 'active');
    
    console.log(`📊 Assessment started: ${assessmentId} (Fleet: ${fleetNumber})`);
    
    // Notify subscribers
    this.notifyAssessmentSubscribers('assessment_started', assessment);
  }

  /**
   * Update assessment progress for step completion
   */
  updateAssessmentProgress(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    
    if (!assessmentId) {
      console.warn('Assessment progress event missing assessment ID:', data);
      return;
    }

    const existingAssessment = this.activeAssessments.get(assessmentId);
    if (!existingAssessment) {
      console.warn(`Assessment progress for unknown assessment: ${assessmentId}`);
      return;
    }

    const updatedAssessment = {
      ...existingAssessment,
      currentStep: data.currentStep || existingAssessment.currentStep,
      totalSteps: data.totalSteps || existingAssessment.totalSteps,
      stepDescription: data.stepDescription || data.step_description || existingAssessment.stepDescription,
      progress: data.progress,
      estimatedCompletion: data.estimatedCompletion || existingAssessment.estimatedCompletion,
      elapsedTime: data.elapsedTime || data.elapsed_time,
      lastUpdated: new Date().toISOString(),
      // Add step data if provided
      ...(data.stepData && { stepData: data.stepData }),
      ...(data.responses && { responses: data.responses })
    };

    this.activeAssessments.set(assessmentId, updatedAssessment);
    
    console.log(`📊 Assessment progress: ${assessmentId} - Step ${updatedAssessment.currentStep}/${updatedAssessment.totalSteps}`);
    
    // Notify subscribers
    this.notifyAssessmentSubscribers('assessment_progress', updatedAssessment);
  }

  /**
   * Move assessment to completed breakdowns
   */
  moveToCompletedBreakdowns(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    
    if (!assessmentId) {
      console.warn('Assessment completed event missing assessment ID:', data);
      return;
    }

    const assessment = this.activeAssessments.get(assessmentId);
    if (assessment) {
      // Create completed assessment record
      const completedAssessment = {
        ...assessment,
        status: 'completed',
        completedAt: data.timestamp || data.completedAt || new Date().toISOString(),
        decision: data.decision || data.wizard_decision,
        decision_reason: data.decision_reason || data.reason,
        dvsa_reference: data.dvsa_reference,
        recommended_actions: data.recommended_actions || [],
        wizard_responses: data.wizard_responses || data.responses || {},
        assessment_duration: data.duration || data.assessment_duration || data.elapsedTime,
        notes: data.notes || data.decision_notes,
        next_steps: data.next_steps || []
      };

      // Move to completed assessments
      this.completedAssessments.set(assessmentId, completedAssessment);
      this.activeAssessments.delete(assessmentId);
      this.assessmentStates.set(assessmentId, 'completed');
      
      console.log(`📊 Assessment completed: ${assessmentId} - Decision: ${completedAssessment.decision}`);
      
      // Notify subscribers
      this.notifyAssessmentSubscribers('assessment_completed', completedAssessment);
    } else {
      console.warn(`Assessment completed for unknown assessment: ${assessmentId}`);
    }
  }

  /**
   * Update breakdown decision
   */
  updateBreakdownDecision(data) {
    const breakdownId = data.breakdown_id || data.breakdownId;
    
    if (!breakdownId) {
      console.warn('Decision changed event missing breakdown ID:', data);
      return;
    }

    const decisionData = {
      breakdown_id: breakdownId,
      previous_decision: data.previous_decision,
      new_decision: data.new_decision || data.decision,
      reason: data.reason || data.decision_reason,
      timestamp: data.timestamp || new Date().toISOString(),
      supervisor: data.supervisor?.name || data.supervisor_name,
      notes: data.notes
    };

    console.log(`📊 Decision changed for breakdown ${breakdownId}: ${decisionData.previous_decision} → ${decisionData.new_decision}`);
    
    // Update any active assessment
    const assessment = this.activeAssessments.get(breakdownId);
    if (assessment) {
      assessment.decision = decisionData.new_decision;
      assessment.lastUpdated = decisionData.timestamp;
      this.activeAssessments.set(breakdownId, assessment);
    }
    
    // Notify subscribers
    this.notifyAssessmentSubscribers('decision_changed', decisionData);
  }

  /**
   * Handle assessment cancellation
   */
  handleAssessmentCancellation(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    
    if (!assessmentId) return;

    const assessment = this.activeAssessments.get(assessmentId);
    if (assessment) {
      assessment.status = 'cancelled';
      assessment.cancelledAt = data.timestamp || new Date().toISOString();
      assessment.cancelReason = data.reason || 'Cancelled by user';
      
      this.activeAssessments.delete(assessmentId);
      this.assessmentStates.set(assessmentId, 'cancelled');
      
      console.log(`📊 Assessment cancelled: ${assessmentId}`);
      this.notifyAssessmentSubscribers('assessment_cancelled', assessment);
    }
  }

  /**
   * Handle assessment resumption
   */
  handleAssessmentResumption(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    
    if (!assessmentId) return;

    // Restore to active assessments if it was cancelled
    if (this.assessmentStates.get(assessmentId) === 'cancelled') {
      this.updateInProgressAssessments(data);
      console.log(`📊 Assessment resumed: ${assessmentId}`);
    }
  }

  /**
   * Handle assessment timeout
   */
  handleAssessmentTimeout(data) {
    const assessmentId = data.assessment_id || data.breakdown_id || data.breakdownId;
    
    if (!assessmentId) return;

    const assessment = this.activeAssessments.get(assessmentId);
    if (assessment) {
      assessment.status = 'timeout';
      assessment.timeoutAt = data.timestamp || new Date().toISOString();
      
      this.activeAssessments.delete(assessmentId);
      this.assessmentStates.set(assessmentId, 'timeout');
      
      console.log(`📊 Assessment timeout: ${assessmentId}`);
      this.notifyAssessmentSubscribers('assessment_timeout', assessment);
    }
  }

  /**
   * Handle new breakdown creation
   */
  handleBreakdownCreated(data) {
    const breakdownData = {
      breakdown_id: data.breakdown_id || data.id,
      fleet_number: data.fleet_number || data.vehicle?.fleetNumber,
      location: data.location,
      issue_category: data.issue_category || data.issue_type,
      severity: data.severity,
      created_at: data.created_at || data.timestamp || new Date().toISOString(),
      supervisor_badge: data.supervisor_badge,
      supervisor_name: data.supervisor_name,
      source: data.source || 'breakdown_guide'
    };

    console.log(`📊 New breakdown created: ${breakdownData.breakdown_id} (Fleet: ${breakdownData.fleet_number})`);
    this.notifyAssessmentSubscribers('breakdown_created', breakdownData);
  }

  /**
   * Handle engineer assignment
   */
  handleEngineerAssigned(data) {
    const breakdownId = data.breakdown_id || data.breakdownId;
    
    if (!breakdownId) return;

    const engineerData = {
      breakdown_id: breakdownId,
      engineer_name: data.engineer_name || data.engineer?.name,
      engineer_id: data.engineer_id || data.engineer?.id,
      assigned_at: data.assigned_at || data.timestamp || new Date().toISOString(),
      eta: data.eta || data.estimated_arrival,
      contact_number: data.contact_number || data.engineer?.phone
    };

    console.log(`📊 Engineer assigned to breakdown ${breakdownId}: ${engineerData.engineer_name}`);
    this.notifyAssessmentSubscribers('engineer_assigned', engineerData);
  }

  /**
   * Notify assessment event subscribers
   */
  notifyAssessmentSubscribers(eventType, data) {
    // Notify general subscribers
    const handlers = this.messageHandlers.get('assessments') || [];
    handlers.forEach(handler => {
      try {
        handler({ type: eventType, ...data });
      } catch (error) {
        console.error(`Error notifying assessment subscriber:`, error);
      }
    });

    // Notify specific event subscribers
    const eventHandlers = this.messageHandlers.get(`assessment_${eventType}`) || [];
    eventHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error notifying ${eventType} subscriber:`, error);
      }
    });
  }

  /**
   * Get active assessments
   */
  getActiveAssessments() {
    return Array.from(this.activeAssessments.values());
  }

  /**
   * Get completed assessments
   */
  getCompletedAssessments(limit = 50) {
    const completed = Array.from(this.completedAssessments.values());
    return completed
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, limit);
  }

  /**
   * Get assessment by ID
   */
  getAssessment(assessmentId) {
    return this.activeAssessments.get(assessmentId) || 
           this.completedAssessments.get(assessmentId);
  }

  /**
   * Subscribe to specific assessment events
   */
  subscribeToAssessmentEvents(eventType, handler) {
    const key = eventType === 'all' ? 'assessments' : `assessment_${eventType}`;
    
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, []);
    }
    
    this.messageHandlers.get(key).push(handler);
    
    return () => {
      const handlers = this.messageHandlers.get(key) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup service (call before unloading)
   */
  cleanup() {
    console.log('🧹 Cleaning up WebSocket service');
    
    this.closeAll();
    
    // Clear all timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    
    this.connections.clear();
    this.messageHandlers.clear();
    this.reconnectTimers.clear();
    this.heartbeatTimers.clear();
    this.connectionStates.clear();
    this.retryAttempts.clear();
    
    // Clear assessment data
    this.assessmentStates.clear();
    this.activeAssessments.clear();
    this.completedAssessments.clear();
    this.assessmentEventHandlers.clear();
    
    this.isInitialized = false;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  websocketService.initialize();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    websocketService.cleanup();
  });
}

export default websocketService;

/**
 * Hook for React components to use WebSocket connections
 */
export const useWebSocket = (endpoint, options = {}) => {
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [lastMessage, setLastMessage] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!endpoint) return;

    const handleMessage = (data) => {
      setLastMessage(data);
      setError(null);
    };

    const handleOpen = () => {
      setConnectionState('connected');
      setError(null);
    };

    const handleClose = () => {
      setConnectionState('disconnected');
    };

    const handleError = (err) => {
      setConnectionState('error');
      setError(err);
    };

    // Connect to WebSocket
    websocketService.connect(endpoint, {
      ...options,
      onMessage: handleMessage,
      onOpen: handleOpen,
      onClose: handleClose,
      onError: handleError
    });

    // Subscribe to messages
    const unsubscribe = websocketService.subscribe(endpoint, handleMessage);

    // Update connection state
    const updateState = () => {
      setConnectionState(websocketService.getConnectionState(endpoint));
    };

    const stateInterval = setInterval(updateState, 1000);

    return () => {
      unsubscribe();
      clearInterval(stateInterval);
      
      // Don't disconnect here - let the service manage connections
      // websocketService.disconnect(endpoint);
    };
  }, [endpoint]);

  const sendMessage = React.useCallback((message) => {
    return websocketService.send(endpoint, message);
  }, [endpoint]);

  return {
    connectionState,
    lastMessage,
    error,
    sendMessage,
    isConnected: connectionState === 'connected'
  };
};

/**
 * Specific WebSocket connections for different features
 */
export const sdcWebSocket = {
  connect: (options = {}) => websocketService.connect(websocketConfig.endpoints.sdcDashboard, options),
  disconnect: () => websocketService.disconnect(websocketConfig.endpoints.sdcDashboard),
  send: (message) => websocketService.send(websocketConfig.endpoints.sdcDashboard, message),
  subscribe: (handler) => websocketService.subscribe(websocketConfig.endpoints.sdcDashboard, handler),
  isConnected: () => websocketService.isConnected(websocketConfig.endpoints.sdcDashboard)
};

export const breakdownsWebSocket = {
  connect: (options = {}) => websocketService.connect(websocketConfig.endpoints.breakdowns, options),
  disconnect: () => websocketService.disconnect(websocketConfig.endpoints.breakdowns),
  send: (message) => websocketService.send(websocketConfig.endpoints.breakdowns, message),
  subscribe: (handler) => websocketService.subscribe(websocketConfig.endpoints.breakdowns, handler),
  isConnected: () => websocketService.isConnected(websocketConfig.endpoints.breakdowns)
};

export const assessmentsWebSocket = {
  connect: (options = {}) => websocketService.connect(websocketConfig.endpoints.assessments, options),
  disconnect: () => websocketService.disconnect(websocketConfig.endpoints.assessments),
  send: (message) => websocketService.send(websocketConfig.endpoints.assessments, message),
  subscribe: (handler) => websocketService.subscribe(websocketConfig.endpoints.assessments, handler),
  isConnected: () => websocketService.isConnected(websocketConfig.endpoints.assessments),
  
  // Assessment-specific methods
  subscribeToEvents: (eventType, handler) => websocketService.subscribeToAssessmentEvents(eventType, handler),
  getActiveAssessments: () => websocketService.getActiveAssessments(),
  getCompletedAssessments: (limit) => websocketService.getCompletedAssessments(limit),
  getAssessment: (id) => websocketService.getAssessment(id)
};

/**
 * Enhanced WebSocket hook for assessment events
 */
export const useAssessmentWebSocket = (eventTypes = ['all'], options = {}) => {
  const [assessmentState, setAssessmentState] = React.useState({
    connectionState: 'disconnected',
    activeAssessments: [],
    completedAssessments: [],
    lastEvent: null,
    error: null
  });

  React.useEffect(() => {
    const endpoint = websocketConfig.endpoints.assessments;
    
    if (!endpoint) return;

    const handleMessage = (data) => {
      setAssessmentState(prev => ({
        ...prev,
        lastEvent: data,
        error: null
      }));
    };

    const handleOpen = () => {
      setAssessmentState(prev => ({
        ...prev,
        connectionState: 'connected',
        error: null
      }));
    };

    const handleClose = () => {
      setAssessmentState(prev => ({
        ...prev,
        connectionState: 'disconnected'
      }));
    };

    const handleError = (err) => {
      setAssessmentState(prev => ({
        ...prev,
        connectionState: 'error',
        error: err
      }));
    };

    // Connect to WebSocket
    websocketService.connect(endpoint, {
      ...options,
      onMessage: handleMessage,
      onOpen: handleOpen,
      onClose: handleClose,
      onError: handleError
    });

    // Subscribe to assessment events
    const unsubscribers = eventTypes.map(eventType => 
      websocketService.subscribeToAssessmentEvents(eventType, (data) => {
        setAssessmentState(prev => ({
          ...prev,
          activeAssessments: websocketService.getActiveAssessments(),
          completedAssessments: websocketService.getCompletedAssessments(10),
          lastEvent: { type: eventType, ...data }
        }));
      })
    );

    // Update state periodically
    const updateState = () => {
      setAssessmentState(prev => ({
        ...prev,
        connectionState: websocketService.getConnectionState(endpoint),
        activeAssessments: websocketService.getActiveAssessments(),
        completedAssessments: websocketService.getCompletedAssessments(10)
      }));
    };

    const stateInterval = setInterval(updateState, 2000);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      clearInterval(stateInterval);
    };
  }, [eventTypes.join(',')]);

  const sendAssessmentEvent = React.useCallback((eventType, data) => {
    return websocketService.send(websocketConfig.endpoints.assessments, {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...data
    });
  }, []);

  return {
    ...assessmentState,
    sendAssessmentEvent,
    isConnected: assessmentState.connectionState === 'connected'
  };
};

/**
 * Hook for SDC Dashboard to monitor assessment events
 */
export const useSDCAssessmentEvents = () => {
  return useAssessmentWebSocket([
    'assessment_started',
    'assessment_progress', 
    'assessment_completed',
    'assessment_cancelled',
    'breakdown_created',
    'engineer_assigned'
  ], {
    autoReconnect: true,
    heartbeat: true
  });
};