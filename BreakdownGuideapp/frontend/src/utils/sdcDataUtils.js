/**
 * SDC Data Utilities
 * Helper functions for data manipulation, validation, and formatting
 */

import { 
  BreakdownStatuses, 
  Decisions, 
  Priorities, 
  isValidDecision, 
  isValidStatus,
  getDecisionColor,
  getDecisionIcon 
} from '../types/sdcTypes';

/**
 * Data validation utilities
 */
export const validateBreakdownData = (data) => {
  const errors = [];
  
  // Required fields
  const required = ['id', 'breakdown_id', 'fleet_number', 'location'];
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Status validation
  if (data.status && !isValidStatus(data.status)) {
    errors.push(`Invalid status: ${data.status}`);
  }
  
  // Decision validation
  if (data.decision && !isValidDecision(data.decision)) {
    errors.push(`Invalid decision: ${data.decision}`);
  }
  
  // Fleet number format
  if (data.fleet_number && !/^\d{4}$/.test(data.fleet_number)) {
    errors.push(`Invalid fleet number format: ${data.fleet_number}`);
  }
  
  // Supervisor badge format
  if (data.supervisor_badge && !/^[A-Z]{2}\d{3}$/.test(data.supervisor_badge)) {
    errors.push(`Invalid supervisor badge format: ${data.supervisor_badge}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Data transformation utilities
 */
export const normalizeBreakdownId = (id) => {
  if (!id) return null;
  
  // Ensure BD-YYYY-NNNNN format
  if (id.startsWith('BD-')) {
    return id;
  }
  
  // Try to construct from partial ID
  const currentYear = new Date().getFullYear();
  if (/^\d{1,5}$/.test(id)) {
    return `BD-${currentYear}-${id.padStart(5, '0')}`;
  }
  
  return id;
};

export const extractDailyId = (breakdownId) => {
  const match = breakdownId?.match(/BD-\d{4}-(\d+)/);
  return match ? match[1] : "000";
};

export const normalizeFleetNumber = (fleetNumber) => {
  if (!fleetNumber) return null;
  
  // Remove any non-digits and ensure 4 digits
  const digits = String(fleetNumber).replace(/\D/g, '');
  return digits.padStart(4, '0');
};

export const normalizeSupervisorBadge = (badge) => {
  if (!badge) return null;
  
  // Ensure XX000 format
  const normalized = badge.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z]{2}\d{3}$/.test(normalized)) {
    return normalized;
  }
  
  return badge; // Return original if can't normalize
};

export const normalizeRoute = (route) => {
  if (!route) return null;
  
  // Extract route number from various formats
  const routeMatch = route.match(/([XA]?\d+[A-Z]?)/i);
  return routeMatch ? routeMatch[1].toUpperCase() : null;
};

/**
 * Status and decision utilities
 */
export const getStatusDisplayText = (status) => {
  const statusMap = {
    [BreakdownStatuses.IN_PROGRESS]: 'In Progress',
    [BreakdownStatuses.COMPLETED]: 'Completed',
    [BreakdownStatuses.CANCELLED]: 'Cancelled'
  };
  return statusMap[status] || status;
};

export const getDecisionDisplayText = (decision) => {
  const decisionMap = {
    [Decisions.STOP]: 'STOP - Remove from Service',
    [Decisions.AMBER]: 'AMBER - Changeover Required',
    [Decisions.CHANGEOVER]: 'CHANGEOVER - Replace Vehicle',
    [Decisions.CONTINUE]: 'CONTINUE - Safe for Service'
  };
  return decisionMap[decision] || decision;
};

export const getStatusClass = (breakdown) => {
  if (breakdown.decision === Decisions.STOP) return 'status-stop';
  if (breakdown.decision === Decisions.AMBER || breakdown.decision === Decisions.CHANGEOVER) return 'status-amber';
  if (breakdown.decision === Decisions.CONTINUE) return 'status-continue';
  if (breakdown.inAssessment) return 'status-in-progress';
  return 'status-pending';
};

export const getPriorityFromDecision = (decision) => {
  const priorityMap = {
    [Decisions.STOP]: Priorities.CRITICAL,
    [Decisions.AMBER]: Priorities.HIGH,
    [Decisions.CHANGEOVER]: Priorities.HIGH,
    [Decisions.CONTINUE]: Priorities.LOW
  };
  return priorityMap[decision] || Priorities.MEDIUM;
};

/**
 * Time and duration utilities
 */
export const formatElapsedTime = (startTime) => {
  if (!startTime) return 'Unknown';
  
  const elapsed = Math.floor((Date.now() - new Date(startTime)) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatTimestamp = (timestamp, format = 'full') => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  
  switch (format) {
    case 'time':
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'date':
      return date.toLocaleDateString('en-GB');
    case 'short':
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'full':
    default:
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
  }
};

export const calculateDuration = (startTime, endTime = null) => {
  if (!startTime) return 0;
  
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  
  return Math.floor((end - start) / 1000 / 60); // Return minutes
};

export const estimateCompletionTime = (breakdown) => {
  const wizardTimeEstimates = {
    'steering': 6,
    'brakes': 8,
    'engine': 10,
    'electrical': 7,
    'general': 5
  };
  
  const wizardType = breakdown.wizard_type || 'general';
  const baseTime = wizardTimeEstimates[wizardType] || 5;
  
  if (breakdown.currentStep) {
    const [current, total] = breakdown.currentStep.split('/').map(Number);
    const progress = current / total;
    const elapsed = calculateDuration(breakdown.startedAt);
    
    if (progress > 0) {
      const estimatedTotal = elapsed / progress;
      const remaining = Math.max(0, Math.ceil(estimatedTotal - elapsed));
      return remaining === 0 ? 'Almost done' : `${remaining} mins`;
    }
  }
  
  return `${baseTime} mins`;
};

/**
 * Progress calculation utilities
 */
export const calculateProgressPercentage = (breakdown) => {
  if (!breakdown.currentStep) return 0;
  
  const [current, total] = breakdown.currentStep.split('/').map(Number);
  return Math.round((current / total) * 100);
};

export const getProgressStatus = (breakdown) => {
  const percentage = calculateProgressPercentage(breakdown);
  
  if (percentage === 100) return 'completed';
  if (percentage >= 80) return 'almost-done';
  if (percentage >= 50) return 'halfway';
  if (percentage >= 25) return 'started';
  return 'beginning';
};

/**
 * Route and location utilities
 */
export const isPriorityRoute = (route) => {
  const priorityRoutes = ['X10', 'X21', '21', '56', '1'];
  return priorityRoutes.includes(route?.toUpperCase());
};

export const isHighTrafficLocation = (location) => {
  const highTrafficAreas = ['A19', 'A1', 'M1', 'Newcastle', 'Gateshead', 'Durham'];
  return highTrafficAreas.some(area => 
    location?.toUpperCase().includes(area.toUpperCase())
  );
};

export const extractLocationDetails = (location) => {
  if (!location) return { area: null, road: null, direction: null };
  
  const roadMatch = location.match(/(A\d+|M\d+|B\d+)/i);
  const directionMatch = location.match(/(Northbound|Southbound|Eastbound|Westbound)/i);
  const areaMatch = location.match(/(Newcastle|Gateshead|Durham|Sunderland|North Tyneside|Northumberland)/i);
  
  return {
    area: areaMatch ? areaMatch[1] : null,
    road: roadMatch ? roadMatch[1] : null,
    direction: directionMatch ? directionMatch[1] : null
  };
};

/**
 * Filtering and sorting utilities
 */
export const filterBreakdowns = (breakdowns, filter, currentSupervisor = null) => {
  return breakdowns.filter(breakdown => {
    switch (filter) {
      case 'all':
        return true;
      case 'critical':
        return breakdown.isCritical || breakdown.decision === Decisions.STOP;
      case 'pending':
        return breakdown.isPending || !breakdown.acknowledgedAt;
      case 'in-assessment':
        return breakdown.inAssessment || breakdown.hasActiveAssessment;
      case 'my-breakdowns':
        if (!currentSupervisor) return false;
        const supervisorBadge = currentSupervisor.badge || currentSupervisor.supervisorBadge;
        return breakdown.supervisor_badge === supervisorBadge || 
               breakdown.supervisor_name === currentSupervisor.name;
      case 'priority-routes':
        return breakdown.isPriorityRoute || isPriorityRoute(breakdown.route);
      default:
        return true;
    }
  });
};

export const sortBreakdowns = (breakdowns, sortBy = 'created', direction = 'desc') => {
  return [...breakdowns].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'created':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'fleet':
        aValue = parseInt(a.fleet_number);
        bValue = parseInt(b.fleet_number);
        break;
      case 'priority':
        const priorityOrder = [Priorities.CRITICAL, Priorities.HIGH, Priorities.MEDIUM, Priorities.LOW];
        aValue = priorityOrder.indexOf(getPriorityFromDecision(a.decision));
        bValue = priorityOrder.indexOf(getPriorityFromDecision(b.decision));
        break;
      case 'location':
        aValue = a.location?.toLowerCase() || '';
        bValue = b.location?.toLowerCase() || '';
        break;
      case 'supervisor':
        aValue = a.supervisor_name?.toLowerCase() || '';
        bValue = b.supervisor_name?.toLowerCase() || '';
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }
    
    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

/**
 * Statistics calculation utilities
 */
export const calculateDashboardStats = (breakdowns, activeAssessments = []) => {
  const activeBreakdowns = breakdowns.filter(b => b.status !== BreakdownStatuses.COMPLETED);
  
  return {
    total: activeBreakdowns.length,
    critical: activeBreakdowns.filter(b => b.isCritical || b.decision === Decisions.STOP).length,
    pending: activeBreakdowns.filter(b => b.isPending || !b.acknowledgedAt).length,
    dispatched: activeBreakdowns.filter(b => b.isDispatched || b.engineer_assigned).length,
    inAssessment: activeAssessments.length
  };
};

export const generatePriorityAlerts = (breakdowns) => {
  const alerts = [];
  const activeBreakdowns = breakdowns.filter(b => b.status !== BreakdownStatuses.COMPLETED);
  
  // Critical breakdowns on priority routes
  const criticalPriorityBreakdowns = activeBreakdowns.filter(b => 
    b.isCritical && b.isPriorityRoute
  );
  
  if (criticalPriorityBreakdowns.length >= 2) {
    alerts.push({
      id: 'critical-priority',
      type: 'critical',
      message: `${criticalPriorityBreakdowns.length} critical breakdowns on priority routes`,
      breakdowns: criticalPriorityBreakdowns
    });
  }
  
  // Unacknowledged critical breakdowns over 10 minutes old
  const unacknowledgedCritical = activeBreakdowns.filter(b => {
    if (!b.isCritical || b.acknowledgedAt) return false;
    const age = calculateDuration(b.createdAt);
    return age > 10;
  });
  
  if (unacknowledgedCritical.length > 0) {
    alerts.push({
      id: 'unack-critical',
      type: 'warning',
      message: `${unacknowledgedCritical.length} critical breakdown${unacknowledgedCritical.length > 1 ? 's' : ''} awaiting acknowledgement`,
      breakdowns: unacknowledgedCritical
    });
  }
  
  // High volume of breakdowns
  if (activeBreakdowns.length >= 15) {
    alerts.push({
      id: 'high-volume',
      type: 'warning',
      message: `High volume of active breakdowns (${activeBreakdowns.length})`,
      breakdowns: activeBreakdowns.slice(0, 5) // Show first 5
    });
  }
  
  return alerts;
};

/**
 * Search and query utilities
 */
export const searchBreakdowns = (breakdowns, query) => {
  if (!query || query.trim() === '') return breakdowns;
  
  const searchTerm = query.toLowerCase().trim();
  
  return breakdowns.filter(breakdown => {
    return (
      breakdown.breakdown_id?.toLowerCase().includes(searchTerm) ||
      breakdown.fleet_number?.includes(searchTerm) ||
      breakdown.location?.toLowerCase().includes(searchTerm) ||
      breakdown.route?.toLowerCase().includes(searchTerm) ||
      breakdown.supervisor_name?.toLowerCase().includes(searchTerm) ||
      breakdown.supervisor_badge?.toLowerCase().includes(searchTerm) ||
      breakdown.assessmentType?.toLowerCase().includes(searchTerm)
    );
  });
};

/**
 * Export utilities
 */
export const exportBreakdownData = (breakdowns, format = 'json') => {
  const data = breakdowns.map(breakdown => ({
    breakdown_id: breakdown.breakdown_id,
    fleet_number: breakdown.fleet_number,
    route: breakdown.route,
    location: breakdown.location,
    assessment_type: breakdown.assessmentType,
    decision: breakdown.decision,
    supervisor: breakdown.supervisor_name,
    supervisor_badge: breakdown.supervisor_badge,
    created_at: breakdown.createdAt,
    completed_at: breakdown.completedAt,
    status: breakdown.status
  }));
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h] || '').join(','))
      ].join('\n');
      return csvContent;
    case 'json':
    default:
      return JSON.stringify(data, null, 2);
  }
};

/**
 * URL and navigation utilities
 */
export const buildDashboardUrl = (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  return `/dashboards/sdc${queryString ? `?${queryString}` : ''}`;
};

export const buildBreakdownGuideUrl = (breakdownId, options = {}) => {
  const params = new URLSearchParams();
  
  if (options.edit) {
    params.append('edit', breakdownId);
  } else if (options.view) {
    params.append('view', breakdownId);
  }
  
  if (options.return) {
    params.append('return', options.return);
  }
  
  if (options.reason) {
    params.append('reason', options.reason);
  }
  
  const queryString = params.toString();
  return `/breakdown-guide${queryString ? `?${queryString}` : ''}`;
};