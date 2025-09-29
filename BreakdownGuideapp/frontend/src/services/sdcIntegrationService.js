/**
 * SDC Integration Service
 * Handles data flow between breakdown guide system and SDC Dashboard
 * Provides standardized data structures and transformation utilities
 */

import { apiConfig } from '../breakdown-guide/components/common/constants';
import assessmentProgressService from './assessmentProgressService';

class SDCIntegrationService {
  constructor() {
    this.listeners = new Map();
    this.cache = new Map();
    this.syncInProgress = false;
  }

  /**
   * Standard breakdown data structure for SDC Dashboard
   */
  static getBreakdownDataSchema() {
    return {
      // Core identification
      id: "BD-2025-00034",
      breakdown_id: "BD-2025-00034",
      daily_id: "034",
      
      // Vehicle information
      vehicleFleet: "6334",
      fleet_number: "6334",
      route: "X21",
      
      // Location and context
      location: "A19 Northbound",
      coordinates: { lat: 54.9783, lng: -1.6178 },
      
      // Assessment details
      assessmentType: "Steering",
      issue_category: "Steering",
      wizard_type: "steering",
      
      // Personnel
      supervisor: "John Smith",
      supervisor_name: "John Smith",
      supervisor_badge: "AG003",
      
      // Status and progress
      status: "IN_PROGRESS", // IN_PROGRESS, COMPLETED, CANCELLED
      decision: "STOP", // STOP, AMBER, CONTINUE, null
      severity: "STOP", // Maps to decision for backwards compatibility
      
      // Progress tracking
      currentStep: "4/5",
      stepDescription: "Checking steering system...",
      progress_percentage: 80,
      
      // Wizard data
      wizardResponses: [
        {
          step: 1,
          question: "Is the steering wheel loose?",
          answer: "Yes",
          timestamp: "2025-09-28T10:31:00Z"
        }
      ],
      
      // SDC specific actions
      recommendedActions: [
        {
          type: "immediate_stop",
          description: "Vehicle must be stopped immediately",
          priority: "critical"
        },
        {
          type: "engineer_dispatch",
          description: "Request engineering assistance",
          priority: "high"
        }
      ],
      
      // Timeline
      createdAt: "2025-09-28T10:30:00Z",
      startedAt: "2025-09-28T10:30:30Z",
      completedAt: null,
      acknowledgedAt: null,
      
      // Edit history and audit
      editHistory: [
        {
          timestamp: "2025-09-28T10:32:00Z",
          action: "assessment_started",
          user: "John Smith",
          details: "Steering assessment initiated"
        }
      ],
      
      // SDC workflow states
      sdc_acknowledged: false,
      engineering_requested: false,
      engineer_assigned: null,
      engineer_name: null,
      dispatched_at: null,
      
      // Flags for dashboard filtering
      isCritical: true,
      isPending: false,
      isDispatched: false,
      inAssessment: true,
      hasActiveAssessment: true,
      isPriorityRoute: true
    };
  }

  /**
   * Transform breakdown guide data to SDC format
   */
  transformBreakdownData(sourceData) {
    const transformed = {
      // Core identification
      id: sourceData.breakdown_id || sourceData.id,
      breakdown_id: sourceData.breakdown_id || sourceData.id,
      daily_id: this.extractDailyId(sourceData.breakdown_id || sourceData.id),
      
      // Vehicle information
      vehicleFleet: sourceData.fleet_number || sourceData.vehicleFleet,
      fleet_number: sourceData.fleet_number || sourceData.vehicleFleet,
      route: sourceData.route || this.extractRouteFromLocation(sourceData.location),
      
      // Location
      location: sourceData.location || "Location not specified",
      coordinates: sourceData.coordinates || null,
      
      // Assessment details
      assessmentType: sourceData.issue_category || sourceData.assessmentType || "General",
      issue_category: sourceData.issue_category || sourceData.assessmentType || "General",
      wizard_type: this.normalizeWizardType(sourceData.issue_category || sourceData.assessmentType),
      
      // Personnel
      supervisor: sourceData.supervisor_name || sourceData.supervisor || "Unknown",
      supervisor_name: sourceData.supervisor_name || sourceData.supervisor || "Unknown",
      supervisor_badge: sourceData.supervisor_badge || this.extractBadgeFromSupervisor(sourceData.supervisor),
      
      // Status and decisions
      status: this.normalizeStatus(sourceData.status),
      decision: sourceData.wizard_decision || sourceData.decision || null,
      severity: sourceData.wizard_decision || sourceData.decision || sourceData.severity,
      
      // Progress tracking
      currentStep: this.calculateCurrentStep(sourceData),
      stepDescription: sourceData.current_step_description || "Assessment in progress...",
      progress_percentage: this.calculateProgressPercentage(sourceData),
      
      // Wizard responses
      wizardResponses: this.formatWizardResponses(sourceData.wizard_responses || sourceData.responses || []),
      
      // Recommended actions
      recommendedActions: this.generateRecommendedActions(sourceData),
      
      // Timeline
      createdAt: sourceData.created_at || sourceData.createdAt || new Date().toISOString(),
      startedAt: sourceData.assessment_started_at || sourceData.startedAt,
      completedAt: sourceData.completed_at || sourceData.completedAt,
      acknowledgedAt: sourceData.acknowledged_at || sourceData.acknowledgedAt,
      
      // Edit history
      editHistory: this.formatEditHistory(sourceData.activities || sourceData.editHistory || []),
      
      // SDC workflow
      sdc_acknowledged: !!sourceData.acknowledged_at,
      engineering_requested: !!sourceData.engineer_assigned,
      engineer_assigned: sourceData.engineer_assigned,
      engineer_name: sourceData.engineer_name,
      dispatched_at: sourceData.dispatched_at,
      
      // Dashboard flags
      isCritical: this.isCriticalBreakdown(sourceData),
      isPending: !sourceData.acknowledged_at,
      isDispatched: !!sourceData.engineer_assigned,
      inAssessment: this.isInAssessment(sourceData),
      hasActiveAssessment: this.hasActiveAssessment(sourceData),
      isPriorityRoute: this.isPriorityRoute(sourceData.route || sourceData.location)
    };

    return transformed;
  }

  /**
   * Create assessment progress data for AssessmentProgressCard
   */
  createAssessmentProgressData(breakdownData) {
    return {
      breakdownId: breakdownData.breakdown_id || breakdownData.id,
      currentStep: breakdownData.currentStep || "1/5",
      stepDescription: breakdownData.stepDescription || "Starting assessment...",
      supervisor: breakdownData.supervisor_name || breakdownData.supervisor || "Unknown",
      estimatedCompletion: this.calculateEstimatedCompletion(breakdownData),
      fleetNumber: breakdownData.fleet_number || breakdownData.vehicleFleet,
      route: breakdownData.route,
      location: breakdownData.location,
      startTime: breakdownData.startedAt || breakdownData.createdAt,
      wizardType: breakdownData.assessmentType || breakdownData.wizard_type || "General Assessment",
      priority: this.calculatePriority(breakdownData),
      onViewDetails: (id) => this.handleViewLiveAssessment(id),
      onCancel: (id) => this.handleCancelAssessment(id)
    };
  }

  /**
   * Create edit assessment modal data
   */
  createEditAssessmentData(breakdownData) {
    return {
      breakdownId: breakdownData.breakdown_id || breakdownData.id,
      originalDecision: breakdownData.decision || breakdownData.severity || "UNKNOWN",
      originalAssessment: {
        decision: breakdownData.decision || breakdownData.severity,
        wizard_type: breakdownData.wizard_type || breakdownData.assessmentType,
        supervisor_name: breakdownData.supervisor_name || breakdownData.supervisor,
        supervisor_badge: breakdownData.supervisor_badge,
        completed_at: breakdownData.completedAt || breakdownData.completed_at,
        location: breakdownData.location,
        route: breakdownData.route,
        notes: breakdownData.notes || breakdownData.decision_notes,
        wizard_responses: breakdownData.wizardResponses || {}
      },
      auditTrail: this.formatAuditTrail(breakdownData.editHistory || breakdownData.activities || [])
    };
  }

  /**
   * Utility methods for data transformation
   */
  extractDailyId(breakdownId) {
    const match = breakdownId?.match(/BD-\d{4}-(\d+)/);
    return match ? match[1] : "000";
  }

  extractRouteFromLocation(location) {
    if (!location) return null;
    const routeMatch = location.match(/(?:Route\s+)?([XA]?\d+[A-Z]?)/i);
    return routeMatch ? routeMatch[1] : null;
  }

  normalizeWizardType(type) {
    if (!type) return "general";
    return type.toLowerCase().replace(/\s+/g, "_");
  }

  normalizeStatus(status) {
    const statusMap = {
      "active": "IN_PROGRESS",
      "pending": "IN_PROGRESS", 
      "completed": "COMPLETED",
      "resolved": "COMPLETED",
      "cancelled": "CANCELLED"
    };
    return statusMap[status?.toLowerCase()] || "IN_PROGRESS";
  }

  calculateCurrentStep(data) {
    if (data.currentStep) return data.currentStep;
    if (data.current_step && data.total_steps) {
      return `${data.current_step}/${data.total_steps}`;
    }
    return "1/5";
  }

  calculateProgressPercentage(data) {
    if (data.progress_percentage) return data.progress_percentage;
    const [current, total] = this.calculateCurrentStep(data).split('/').map(Number);
    return Math.round((current / total) * 100);
  }

  formatWizardResponses(responses) {
    if (Array.isArray(responses)) return responses;
    if (typeof responses === 'object') {
      return Object.entries(responses).map(([key, value], index) => ({
        step: index + 1,
        question: key.replace(/_/g, ' '),
        answer: String(value),
        timestamp: new Date().toISOString()
      }));
    }
    return [];
  }

  generateRecommendedActions(data) {
    const actions = [];
    const decision = data.wizard_decision || data.decision || data.severity;
    
    if (decision === 'STOP') {
      actions.push({
        type: "immediate_stop",
        description: "Vehicle must be stopped immediately - safety critical",
        priority: "critical",
        icon: "🛑"
      });
      actions.push({
        type: "engineer_dispatch",
        description: "Request immediate engineering assistance",
        priority: "high",
        icon: "🔧"
      });
    } else if (decision === 'AMBER' || decision === 'CHANGEOVER') {
      actions.push({
        type: "changeover_required",
        description: "Arrange vehicle changeover at next suitable location",
        priority: "high",
        icon: "⚡"
      });
      actions.push({
        type: "monitor_closely",
        description: "Monitor vehicle status closely until changeover",
        priority: "medium",
        icon: "👁️"
      });
    } else if (decision === 'CONTINUE') {
      actions.push({
        type: "continue_service",
        description: "Vehicle cleared to continue in service",
        priority: "low",
        icon: "✅"
      });
      actions.push({
        type: "routine_check",
        description: "Schedule routine maintenance check",
        priority: "low",
        icon: "🔍"
      });
    }

    return actions;
  }

  formatEditHistory(activities) {
    return activities.map(activity => ({
      id: activity.id || Date.now(),
      timestamp: activity.timestamp || activity.created_at || new Date().toISOString(),
      action: activity.action || activity.type || activity.activity_type || "Unknown action",
      user: activity.user || activity.supervisor_name || "Unknown user",
      details: activity.details || activity.message || activity.description || "No details available"
    }));
  }

  formatAuditTrail(editHistory) {
    return this.formatEditHistory(editHistory).map(entry => ({
      ...entry,
      action: this.formatActionType(entry.action)
    }));
  }

  formatActionType(action) {
    const actionMap = {
      "wizard_started": "Assessment Started",
      "wizard_completed": "Assessment Completed",
      "wizard_step": "Assessment Step Completed",
      "edit_initiated": "Edit Assessment Initiated",
      "decision_changed": "Decision Modified",
      "engineer_assigned": "Engineer Assigned",
      "sdc_acknowledged": "SDC Acknowledged"
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  calculateEstimatedCompletion(data) {
    const wizardTimeEstimates = {
      "steering": 6,
      "brakes": 8,
      "engine": 10,
      "electrical": 7,
      "general": 5
    };

    const wizardType = this.normalizeWizardType(data.wizard_type || data.assessmentType);
    const baseTime = wizardTimeEstimates[wizardType] || 5;
    
    const [current, total] = this.calculateCurrentStep(data).split('/').map(Number);
    const progress = current / total;
    const elapsed = data.startedAt ? Math.floor((Date.now() - new Date(data.startedAt)) / 60000) : 0;
    
    if (progress > 0) {
      const estimatedTotal = elapsed / progress;
      const remaining = Math.max(0, Math.ceil(estimatedTotal - elapsed));
      return remaining === 0 ? "Almost done" : `${remaining} mins`;
    }
    
    return `${baseTime} mins`;
  }

  calculatePriority(data) {
    const decision = data.wizard_decision || data.decision || data.severity;
    if (decision === 'STOP') return 'critical';
    if (decision === 'AMBER' || decision === 'CHANGEOVER') return 'high';
    if (this.isPriorityRoute(data.route || data.location)) return 'medium';
    return 'normal';
  }

  isCriticalBreakdown(data) {
    const decision = data.wizard_decision || data.decision || data.severity;
    return decision === 'STOP';
  }

  isInAssessment(data) {
    const status = this.normalizeStatus(data.status);
    return status === 'IN_PROGRESS' && !data.completed_at;
  }

  hasActiveAssessment(data) {
    return this.isInAssessment(data) || assessmentProgressService.getAssessment(data.breakdown_id || data.id);
  }

  isPriorityRoute(routeOrLocation) {
    const priorityRoutes = ['X10', 'X21', '21', '56', '1', 'A19', 'A1', 'M1'];
    if (!routeOrLocation) return false;
    return priorityRoutes.some(route => 
      routeOrLocation.toUpperCase().includes(route)
    );
  }

  extractBadgeFromSupervisor(supervisor) {
    // Try to extract badge from supervisor data or lookup
    const badgePattern = /([A-Z]{2}\d{3})/;
    const match = supervisor?.match?.(badgePattern);
    return match ? match[1] : null;
  }

  /**
   * Event handlers
   */
  handleViewLiveAssessment(breakdownId) {
    // Open breakdown guide in new tab with assessment view
    const url = `/breakdown-guide?view=${breakdownId}&mode=live`;
    window.open(url, '_blank');
  }

  handleCancelAssessment(breakdownId) {
    if (confirm('Are you sure you want to cancel this assessment?')) {
      assessmentProgressService.cancelAssessment(breakdownId, 'Cancelled by SDC operator');
    }
  }

  /**
   * Data synchronization
   */
  async syncBreakdownData(breakdownId) {
    if (this.syncInProgress) return this.cache.get(breakdownId);
    
    try {
      this.syncInProgress = true;
      
      // Fetch from SDC API endpoint (less restrictive authentication)
      const response = await fetch(`${apiConfig.baseUrl}/api/sdc/live`);
      if (!response.ok) throw new Error('Failed to fetch breakdown data');
      
      const rawData = await response.json();
      const transformedData = this.transformBreakdownData(rawData);
      
      // Cache the result
      this.cache.set(breakdownId, transformedData);
      
      // Notify listeners
      this.notifyListeners('breakdown_synced', transformedData);
      
      return transformedData;
      
    } catch (error) {
      console.error('Error syncing breakdown data:', error);
      return this.cache.get(breakdownId) || null;
    } finally {
      this.syncInProgress = false;
    }
  }

  async bulkSyncBreakdowns(breakdownIds) {
    const promises = breakdownIds.map(id => this.syncBreakdownData(id));
    return Promise.allSettled(promises);
  }

  /**
   * Event subscription
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    };
  }

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

  /**
   * Cache management
   */
  clearCache() {
    this.cache.clear();
  }

  getCachedData(breakdownId) {
    return this.cache.get(breakdownId);
  }

  /**
   * Validation
   */
  validateBreakdownData(data) {
    const required = ['id', 'breakdown_id', 'fleet_number', 'location'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      console.warn('Missing required fields:', missing);
      return false;
    }
    
    return true;
  }
}

// Create singleton instance
const sdcIntegrationService = new SDCIntegrationService();

export default sdcIntegrationService;
export { SDCIntegrationService };