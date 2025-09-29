/**
 * SDC Dashboard Type Definitions
 * TypeScript-compatible type definitions for SDC Dashboard integration
 */

/**
 * @typedef {Object} BreakdownData
 * @property {string} id - Unique breakdown identifier
 * @property {string} breakdown_id - Full breakdown ID (BD-2025-00034)
 * @property {string} daily_id - Daily sequence number (034)
 * @property {string} vehicleFleet - Fleet number
 * @property {string} fleet_number - Fleet number (normalized)
 * @property {string|null} route - Bus route number
 * @property {string} location - Breakdown location
 * @property {Coordinates|null} coordinates - GPS coordinates
 * @property {string} assessmentType - Type of assessment
 * @property {string} issue_category - Issue category
 * @property {string} wizard_type - Normalized wizard type
 * @property {string} supervisor - Supervisor name
 * @property {string} supervisor_name - Supervisor name (normalized)
 * @property {string|null} supervisor_badge - Supervisor badge number
 * @property {BreakdownStatus} status - Current status
 * @property {Decision|null} decision - Assessment decision
 * @property {string} severity - Severity level
 * @property {string} currentStep - Current wizard step (4/5)
 * @property {string} stepDescription - Current step description
 * @property {number} progress_percentage - Progress percentage (0-100)
 * @property {WizardResponse[]} wizardResponses - Wizard step responses
 * @property {RecommendedAction[]} recommendedActions - SDC recommended actions
 * @property {string} createdAt - ISO timestamp when breakdown was created
 * @property {string|null} startedAt - ISO timestamp when assessment started
 * @property {string|null} completedAt - ISO timestamp when assessment completed
 * @property {string|null} acknowledgedAt - ISO timestamp when SDC acknowledged
 * @property {EditHistoryEntry[]} editHistory - Audit trail entries
 * @property {boolean} sdc_acknowledged - Whether SDC has acknowledged
 * @property {boolean} engineering_requested - Whether engineering was requested
 * @property {string|null} engineer_assigned - Assigned engineer ID
 * @property {string|null} engineer_name - Assigned engineer name
 * @property {string|null} dispatched_at - ISO timestamp when dispatched
 * @property {boolean} isCritical - Whether breakdown is critical
 * @property {boolean} isPending - Whether breakdown is pending acknowledgment
 * @property {boolean} isDispatched - Whether engineer is dispatched
 * @property {boolean} inAssessment - Whether currently being assessed
 * @property {boolean} hasActiveAssessment - Whether has active assessment
 * @property {boolean} isPriorityRoute - Whether on priority route
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */

/**
 * @typedef {'IN_PROGRESS'|'COMPLETED'|'CANCELLED'} BreakdownStatus
 */

/**
 * @typedef {'STOP'|'AMBER'|'CHANGEOVER'|'CONTINUE'} Decision
 */

/**
 * @typedef {Object} WizardResponse
 * @property {number} step - Step number
 * @property {string} question - Question text
 * @property {string} answer - Response answer
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} RecommendedAction
 * @property {ActionType} type - Action type
 * @property {string} description - Action description
 * @property {Priority} priority - Action priority
 * @property {string} icon - Display icon
 */

/**
 * @typedef {'immediate_stop'|'engineer_dispatch'|'changeover_required'|'monitor_closely'|'continue_service'|'routine_check'} ActionType
 */

/**
 * @typedef {'critical'|'high'|'medium'|'low'} Priority
 */

/**
 * @typedef {Object} EditHistoryEntry
 * @property {string|number} id - Entry ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} action - Action type
 * @property {string} user - User who performed action
 * @property {string} details - Additional details
 */

/**
 * @typedef {Object} AssessmentProgressData
 * @property {string} breakdownId - Breakdown identifier
 * @property {string} currentStep - Current step (4/5)
 * @property {string} stepDescription - Current step description
 * @property {string} supervisor - Supervisor name
 * @property {string} estimatedCompletion - Estimated completion time
 * @property {string} fleetNumber - Fleet number
 * @property {string|null} route - Route number
 * @property {string} location - Location description
 * @property {string} startTime - ISO start timestamp
 * @property {string} wizardType - Assessment type
 * @property {Priority} priority - Priority level
 * @property {Function|null} onViewDetails - View details callback
 * @property {Function|null} onCancel - Cancel callback
 */

/**
 * @typedef {Object} EditAssessmentData
 * @property {string} breakdownId - Breakdown identifier
 * @property {Decision} originalDecision - Original assessment decision
 * @property {AssessmentDetails} originalAssessment - Original assessment data
 * @property {AuditTrailEntry[]} auditTrail - Audit trail entries
 */

/**
 * @typedef {Object} AssessmentDetails
 * @property {Decision} decision - Assessment decision
 * @property {string} wizard_type - Wizard type
 * @property {string} supervisor_name - Supervisor name
 * @property {string|null} supervisor_badge - Supervisor badge
 * @property {string} completed_at - Completion timestamp
 * @property {string} location - Location
 * @property {string|null} route - Route
 * @property {string|null} notes - Assessment notes
 * @property {Object} wizard_responses - Wizard responses object
 */

/**
 * @typedef {Object} AuditTrailEntry
 * @property {string|number} id - Entry ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} action - Formatted action description
 * @property {string} user - User who performed action
 * @property {string} details - Action details
 */

/**
 * @typedef {Object} ConnectionStatus
 * @property {boolean} isConnected - Whether connection is active
 * @property {'websocket'|'polling'} currentMode - Current connection mode
 * @property {number} reconnectAttempts - Number of reconnection attempts
 * @property {string} lastActivity - Last activity timestamp
 */

/**
 * @typedef {Object} SDCStats
 * @property {number} total - Total active breakdowns
 * @property {number} critical - Critical breakdowns
 * @property {number} pending - Pending acknowledgment
 * @property {number} dispatched - Dispatched to engineers
 * @property {number} inAssessment - Currently in assessment
 */

/**
 * @typedef {Object} FilterOption
 * @property {string} value - Filter value
 * @property {string} label - Display label
 * @property {string} icon - Display icon
 */

/**
 * @typedef {Object} PriorityAlert
 * @property {string} id - Alert ID
 * @property {'critical'|'warning'|'info'} type - Alert type
 * @property {string} message - Alert message
 * @property {BreakdownData[]} breakdowns - Related breakdowns
 */

/**
 * @typedef {Object} RecentDecision
 * @property {string} id - Decision ID
 * @property {string} time - Decision timestamp
 * @property {string} fleet - Fleet number
 * @property {Decision} decision - Decision type
 * @property {string} notes - Decision notes
 * @property {string} supervisor - Supervisor name
 */

/**
 * @typedef {Object} WebSocketMessage
 * @property {WebSocketEventType} type - Message type
 * @property {Object} data - Message data
 * @property {string} timestamp - Message timestamp
 */

/**
 * @typedef {'wizard_started'|'wizard_progress'|'wizard_completed'|'breakdown_created'|'assessment_progress'|'sdc_action_required'} WebSocketEventType
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether request was successful
 * @property {*} data - Response data
 * @property {string|null} error - Error message if failed
 * @property {number} timestamp - Response timestamp
 */

/**
 * @typedef {Object} BreakdownsResponse
 * @property {boolean} success - Whether request was successful
 * @property {BreakdownData[]} breakdowns - Array of breakdown data
 * @property {number} total - Total count
 * @property {number} critical - Critical count
 * @property {number} in_assessment - In assessment count
 */

/**
 * @typedef {Object} AssessmentResponse
 * @property {boolean} success - Whether request was successful
 * @property {AssessmentDetails} assessment - Assessment details
 */

/**
 * @typedef {Object} AuditResponse
 * @property {boolean} success - Whether request was successful
 * @property {AuditTrailEntry[]} history - Audit trail history
 */

/**
 * @typedef {Object} ActiveAssessmentsResponse
 * @property {boolean} success - Whether request was successful
 * @property {AssessmentProgressData[]} assessments - Active assessments
 */

/**
 * @typedef {Object} SupervisorData
 * @property {string} badge - Supervisor badge number
 * @property {string} supervisorBadge - Alternative badge field
 * @property {string} name - Supervisor name
 * @property {string} depot - Assigned depot
 * @property {boolean} isAdmin - Whether supervisor has admin privileges
 */

/**
 * @typedef {Object} ComponentProps
 * @property {string} className - CSS class name
 * @property {React.CSSProperties} style - Inline styles
 * @property {Function} onClick - Click handler
 * @property {boolean} disabled - Whether component is disabled
 */

/**
 * @typedef {Object} AssessmentProgressCardProps
 * @property {string} breakdownId - Breakdown identifier
 * @property {string} currentStep - Current step (4/5)
 * @property {string} stepDescription - Step description
 * @property {string} supervisor - Supervisor name
 * @property {string} estimatedCompletion - Estimated completion
 * @property {string} fleetNumber - Fleet number
 * @property {string|null} route - Route number
 * @property {string} location - Location
 * @property {string} startTime - Start timestamp
 * @property {string} wizardType - Wizard type
 * @property {Function|null} onViewDetails - View details handler
 * @property {Function|null} onCancel - Cancel handler
 * @property {Priority} priority - Priority level
 */

/**
 * @typedef {Object} EditAssessmentModalProps
 * @property {boolean} isOpen - Whether modal is open
 * @property {Function} onClose - Close handler
 * @property {string} breakdownId - Breakdown identifier
 * @property {Decision} originalDecision - Original decision
 * @property {AssessmentDetails} originalAssessment - Original assessment
 * @property {AuditTrailEntry[]} auditTrail - Audit trail
 * @property {Function|null} onEdit - Edit handler
 * @property {Function|null} onCancel - Cancel handler
 */

/**
 * @typedef {Object} SDCDashboardHeaderProps
 * @property {SDCStats} stats - Dashboard statistics
 * @property {Object} connectionManager - Connection manager instance
 * @property {Function} onReportBreakdown - Report breakdown handler
 * @property {Function} onRefresh - Refresh handler
 */

/**
 * @typedef {Object} ConnectionManagerConfig
 * @property {string} endpoint - WebSocket endpoint
 * @property {boolean} autoConnect - Whether to auto-connect
 * @property {'websocket'|'polling'} primary - Primary connection mode
 * @property {'websocket'|'polling'} fallback - Fallback connection mode
 * @property {boolean} autoFailover - Whether to auto-failover
 * @property {number} reconnectAttempts - Max reconnection attempts
 * @property {number} pollingInterval - Polling interval in ms
 */

// Export type definitions for use in other files
export const BreakdownStatuses = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED', 
  CANCELLED: 'CANCELLED'
};

export const Decisions = {
  STOP: 'STOP',
  AMBER: 'AMBER',
  CHANGEOVER: 'CHANGEOVER',
  CONTINUE: 'CONTINUE'
};

export const Priorities = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NORMAL: 'normal'
};

export const ActionTypes = {
  IMMEDIATE_STOP: 'immediate_stop',
  ENGINEER_DISPATCH: 'engineer_dispatch',
  CHANGEOVER_REQUIRED: 'changeover_required',
  MONITOR_CLOSELY: 'monitor_closely',
  CONTINUE_SERVICE: 'continue_service',
  ROUTINE_CHECK: 'routine_check'
};

export const WebSocketEvents = {
  WIZARD_STARTED: 'wizard_started',
  WIZARD_PROGRESS: 'wizard_progress',
  WIZARD_COMPLETED: 'wizard_completed',
  BREAKDOWN_CREATED: 'breakdown_created',
  ASSESSMENT_PROGRESS: 'assessment_progress',
  SDC_ACTION_REQUIRED: 'sdc_action_required'
};

export const ConnectionModes = {
  WEBSOCKET: 'websocket',
  POLLING: 'polling'
};

export const AlertTypes = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

// Utility functions for type checking
export const isValidDecision = (decision) => {
  return Object.values(Decisions).includes(decision);
};

export const isValidStatus = (status) => {
  return Object.values(BreakdownStatuses).includes(status);
};

export const isValidPriority = (priority) => {
  return Object.values(Priorities).includes(priority);
};

export const getDecisionColor = (decision) => {
  const colorMap = {
    [Decisions.STOP]: '#dc2626',
    [Decisions.AMBER]: '#f59e0b',
    [Decisions.CHANGEOVER]: '#f59e0b',
    [Decisions.CONTINUE]: '#10b981'
  };
  return colorMap[decision] || '#6b7280';
};

export const getPriorityIcon = (priority) => {
  const iconMap = {
    [Priorities.CRITICAL]: '🚨',
    [Priorities.HIGH]: '⚠️',
    [Priorities.MEDIUM]: '📋',
    [Priorities.LOW]: '📝',
    [Priorities.NORMAL]: '📄'
  };
  return iconMap[priority] || '📄';
};

export const getDecisionIcon = (decision) => {
  const iconMap = {
    [Decisions.STOP]: '🛑',
    [Decisions.AMBER]: '⚡',
    [Decisions.CHANGEOVER]: '⚡',
    [Decisions.CONTINUE]: '✅'
  };
  return iconMap[decision] || '❓';
};