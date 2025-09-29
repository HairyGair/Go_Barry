/**
 * Assessment Progress Service
 * Provides real-time tracking of assessment progress and step monitoring
 */

import { apiConfig } from '../breakdown-guide/components/common/constants';

class AssessmentProgressService {
  constructor() {
    this.activeAssessments = new Map();
    this.listeners = new Map();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    
    // Default wizard steps for different assessment types
    this.wizardSteps = {
      'brakes': [
        'Initial Safety Check',
        'Brake Pedal Inspection',
        'System Pressure Test',
        'Component Analysis',
        'Final Assessment'
      ],
      'steering': [
        'Steering Wheel Check',
        'Power Steering Test',
        'Alignment Assessment',
        'Component Inspection',
        'Safety Verification'
      ],
      'engine': [
        'Engine Diagnostics',
        'Performance Check',
        'Fluid Level Inspection',
        'System Analysis',
        'Final Assessment'
      ],
      'electrical': [
        'Battery Test',
        'Charging System Check',
        'Lighting Inspection',
        'Safety Systems Test',
        'Final Verification'
      ],
      'general': [
        'Initial Assessment',
        'System Inspection',
        'Safety Check',
        'Analysis',
        'Final Decision'
      ]
    };
  }

  // Initialize the service and establish WebSocket connection
  async initialize() {
    this.connectWebSocket();
    
    // Load active assessments from localStorage as fallback
    this.loadActiveAssessmentsFromStorage();
    
    // Set up periodic sync
    setInterval(() => {
      this.syncWithBackend();
    }, 10000); // Sync every 10 seconds
  }

  // Connect to WebSocket for real-time updates
  connectWebSocket() {
    try {
      const wsUrl = `${apiConfig.baseUrl.replace('http', 'ws')}/ws/assessment-progress`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('📡 Assessment Progress WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to assessment progress updates
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'assessment_progress'
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('📡 Assessment Progress WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('📡 Assessment Progress WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('Failed to connect Assessment Progress WebSocket:', error);
      this.isConnected = false;
    }
  }

  // Handle WebSocket messages
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'assessment_started':
        this.handleAssessmentStarted(data);
        break;
      case 'step_progress':
        this.handleStepProgress(data);
        break;
      case 'assessment_completed':
        this.handleAssessmentCompleted(data);
        break;
      case 'assessment_cancelled':
        this.handleAssessmentCancelled(data);
        break;
    }
  }

  // Attempt to reconnect WebSocket
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect assessment progress WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    }
  }

  // Start tracking a new assessment
  startAssessment(breakdownId, assessmentData) {
    const assessment = {
      breakdownId,
      startTime: new Date().toISOString(),
      currentStep: 1,
      totalSteps: this.getStepsForAssessmentType(assessmentData.type).length,
      stepDescription: this.getStepsForAssessmentType(assessmentData.type)[0],
      supervisor: assessmentData.supervisor,
      fleetNumber: assessmentData.fleetNumber,
      route: assessmentData.route,
      location: assessmentData.location,
      wizardType: assessmentData.type || 'general',
      estimatedCompletion: this.calculateEstimatedCompletion(assessmentData.type),
      lastUpdate: new Date().toISOString(),
      ...assessmentData
    };

    this.activeAssessments.set(breakdownId, assessment);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_started', assessment);

    // Send to backend if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'assessment_started',
        data: assessment
      }));
    }

    return assessment;
  }

  // Update assessment progress
  updateProgress(breakdownId, stepNumber, stepDescription, additionalData = {}) {
    const assessment = this.activeAssessments.get(breakdownId);
    if (!assessment) {
      console.warn(`Assessment not found for breakdown: ${breakdownId}`);
      return null;
    }

    // Update assessment data
    const updatedAssessment = {
      ...assessment,
      currentStep: stepNumber,
      stepDescription: stepDescription || this.getStepDescription(assessment.wizardType, stepNumber),
      estimatedCompletion: this.calculateRemainingTime(assessment, stepNumber),
      lastUpdate: new Date().toISOString(),
      ...additionalData
    };

    this.activeAssessments.set(breakdownId, updatedAssessment);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('step_progress', updatedAssessment);

    // Send to backend if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'step_progress',
        data: updatedAssessment
      }));
    }

    return updatedAssessment;
  }

  // Complete an assessment
  completeAssessment(breakdownId, decision, completionData = {}) {
    const assessment = this.activeAssessments.get(breakdownId);
    if (!assessment) {
      console.warn(`Assessment not found for breakdown: ${breakdownId}`);
      return null;
    }

    const completedAssessment = {
      ...assessment,
      currentStep: assessment.totalSteps,
      stepDescription: 'Assessment Complete',
      decision,
      completedAt: new Date().toISOString(),
      duration: this.calculateDuration(assessment.startTime),
      ...completionData
    };

    // Remove from active assessments
    this.activeAssessments.delete(breakdownId);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_completed', completedAssessment);

    // Send to backend if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'assessment_completed',
        data: completedAssessment
      }));
    }

    return completedAssessment;
  }

  // Cancel an assessment
  cancelAssessment(breakdownId, reason = '') {
    const assessment = this.activeAssessments.get(breakdownId);
    if (!assessment) {
      console.warn(`Assessment not found for breakdown: ${breakdownId}`);
      return null;
    }

    const cancelledAssessment = {
      ...assessment,
      cancelled: true,
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      duration: this.calculateDuration(assessment.startTime)
    };

    // Remove from active assessments
    this.activeAssessments.delete(breakdownId);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_cancelled', cancelledAssessment);

    // Send to backend if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'assessment_cancelled',
        data: cancelledAssessment
      }));
    }

    return cancelledAssessment;
  }

  // Get all active assessments
  getActiveAssessments() {
    return Array.from(this.activeAssessments.values());
  }

  // Get specific assessment
  getAssessment(breakdownId) {
    return this.activeAssessments.get(breakdownId);
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    };
  }

  // Notify listeners
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Get steps for assessment type
  getStepsForAssessmentType(type) {
    const normalizedType = (type || 'general').toLowerCase();
    return this.wizardSteps[normalizedType] || this.wizardSteps.general;
  }

  // Get step description
  getStepDescription(wizardType, stepNumber) {
    const steps = this.getStepsForAssessmentType(wizardType);
    return steps[stepNumber - 1] || 'Unknown Step';
  }

  // Calculate estimated completion time
  calculateEstimatedCompletion(assessmentType) {
    const timeEstimates = {
      'brakes': 8, // 8 minutes
      'steering': 6, // 6 minutes
      'engine': 10, // 10 minutes
      'electrical': 7, // 7 minutes
      'general': 5 // 5 minutes
    };

    const estimatedMinutes = timeEstimates[assessmentType?.toLowerCase()] || timeEstimates.general;
    return `${estimatedMinutes} mins`;
  }

  // Calculate remaining time based on progress
  calculateRemainingTime(assessment, currentStep) {
    const originalEstimate = parseInt(assessment.estimatedCompletion) || 5;
    const progress = currentStep / assessment.totalSteps;
    const elapsed = this.calculateDuration(assessment.startTime);
    
    if (progress > 0) {
      const estimatedTotal = elapsed / progress;
      const remaining = Math.max(0, Math.ceil(estimatedTotal - elapsed));
      
      if (remaining === 0) return 'Almost done';
      if (remaining === 1) return '1 min';
      return `${remaining} mins`;
    }
    
    return `${originalEstimate} mins`;
  }

  // Calculate duration in minutes
  calculateDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now - start) / 1000 / 60);
  }

  // Event handlers for WebSocket messages
  handleAssessmentStarted(data) {
    const assessment = data.data || data;
    this.activeAssessments.set(assessment.breakdownId, assessment);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_started', assessment);
  }

  handleStepProgress(data) {
    const assessment = data.data || data;
    this.activeAssessments.set(assessment.breakdownId, assessment);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('step_progress', assessment);
  }

  handleAssessmentCompleted(data) {
    const assessment = data.data || data;
    this.activeAssessments.delete(assessment.breakdownId);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_completed', assessment);
  }

  handleAssessmentCancelled(data) {
    const assessment = data.data || data;
    this.activeAssessments.delete(assessment.breakdownId);
    this.saveActiveAssessmentsToStorage();
    this.notifyListeners('assessment_cancelled', assessment);
  }

  // Sync with backend (fallback when WebSocket is not available)
  async syncWithBackend() {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/assessments/active`);
      if (response.ok) {
        const data = await response.json();
        
        // Update active assessments from backend
        if (data.assessments && Array.isArray(data.assessments)) {
          const backendAssessments = new Map();
          
          data.assessments.forEach(assessment => {
            backendAssessments.set(assessment.breakdownId, assessment);
          });
          
          // Merge with local assessments
          this.activeAssessments = backendAssessments;
          this.saveActiveAssessmentsToStorage();
          this.notifyListeners('assessments_synced', this.getActiveAssessments());
        }
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  }

  // Save to localStorage
  saveActiveAssessmentsToStorage() {
    try {
      const assessments = Array.from(this.activeAssessments.entries());
      localStorage.setItem('activeAssessments', JSON.stringify(assessments));
    } catch (error) {
      console.error('Error saving assessments to storage:', error);
    }
  }

  // Load from localStorage
  loadActiveAssessmentsFromStorage() {
    try {
      const stored = localStorage.getItem('activeAssessments');
      if (stored) {
        const assessments = JSON.parse(stored);
        this.activeAssessments = new Map(assessments);
        
        // Clean up old assessments (older than 2 hours)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        for (const [breakdownId, assessment] of this.activeAssessments) {
          const startTime = new Date(assessment.startTime);
          if (startTime < twoHoursAgo) {
            this.activeAssessments.delete(breakdownId);
          }
        }
        
        this.saveActiveAssessmentsToStorage();
      }
    } catch (error) {
      console.error('Error loading assessments from storage:', error);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      activeAssessments: this.activeAssessments.size
    };
  }

  // Cleanup
  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.activeAssessments.clear();
    this.listeners.clear();
  }
}

// Create singleton instance
const assessmentProgressService = new AssessmentProgressService();

export default assessmentProgressService;