/**
 * Priority Color Coding System for SDC Dashboard
 * Provides consistent color schemes for breakdown priorities and decisions
 */

/**
 * Get color scheme for breakdown decision
 * @param {string} decision - Decision type (STOP, AMBER, CONTINUE, CHANGEOVER)
 * @returns {object} - Color scheme with background, text, border, and icon
 */
export const getDecisionColors = (decision) => {
  const normalizedDecision = decision?.toUpperCase();

  const colorSchemes = {
    STOP: {
      name: 'Stop',
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      backgroundLight: 'rgba(220, 38, 38, 0.1)',
      text: '#ffffff',
      textLight: '#dc2626',
      border: '#dc2626',
      shadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
      icon: '🛑',
      pulse: 'rgba(220, 38, 38, 0.6)',
      priority: 'critical'
    },
    AMBER: {
      name: 'Amber',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      backgroundLight: 'rgba(245, 158, 11, 0.1)',
      text: '#ffffff',
      textLight: '#f59e0b',
      border: '#f59e0b',
      shadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      icon: '⚠️',
      pulse: 'rgba(245, 158, 11, 0.6)',
      priority: 'high'
    },
    CONTINUE: {
      name: 'Continue',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      backgroundLight: 'rgba(16, 185, 129, 0.1)',
      text: '#ffffff',
      textLight: '#10b981',
      border: '#10b981',
      shadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      icon: '✅',
      pulse: 'rgba(16, 185, 129, 0.6)',
      priority: 'low'
    },
    CHANGEOVER: {
      name: 'Changeover',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      backgroundLight: 'rgba(59, 130, 246, 0.1)',
      text: '#ffffff',
      textLight: '#3b82f6',
      border: '#3b82f6',
      shadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      icon: '🔄',
      pulse: 'rgba(59, 130, 246, 0.6)',
      priority: 'medium'
    },
    PENDING: {
      name: 'Pending',
      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      backgroundLight: 'rgba(107, 114, 128, 0.1)',
      text: '#ffffff',
      textLight: '#6b7280',
      border: '#6b7280',
      shadow: '0 4px 12px rgba(107, 114, 128, 0.2)',
      icon: '⏳',
      pulse: 'rgba(107, 114, 128, 0.6)',
      priority: 'pending'
    }
  };

  return colorSchemes[normalizedDecision] || colorSchemes.PENDING;
};

/**
 * Get color scheme for breakdown status
 * @param {string} status - Status type (new, acknowledged, in_assessment, completed)
 * @returns {object} - Color scheme
 */
export const getStatusColors = (status) => {
  const normalizedStatus = status?.toLowerCase();

  const colorSchemes = {
    new: {
      background: '#3b82f6',
      text: '#ffffff',
      badge: '🆕',
      label: 'New'
    },
    acknowledged: {
      background: '#8b5cf6',
      text: '#ffffff',
      badge: '👁️',
      label: 'Acknowledged'
    },
    in_assessment: {
      background: '#f59e0b',
      text: '#ffffff',
      badge: '📝',
      label: 'In Assessment'
    },
    decision_made: {
      background: '#10b981',
      text: '#ffffff',
      badge: '✅',
      label: 'Decision Made'
    },
    engineering_requested: {
      background: '#ec4899',
      text: '#ffffff',
      badge: '🔧',
      label: 'Engineering'
    },
    completed: {
      background: '#6b7280',
      text: '#ffffff',
      badge: '✔️',
      label: 'Completed'
    }
  };

  return colorSchemes[normalizedStatus] || colorSchemes.new;
};

/**
 * Get color for SLA status
 * @param {string} slaStatus - SLA status (ok, warning, critical)
 * @returns {object} - Color scheme
 */
export const getSLAColors = (slaStatus) => {
  const normalizedStatus = slaStatus?.toLowerCase();

  const colorSchemes = {
    ok: {
      background: '#10b981',
      text: '#ffffff',
      icon: '✅',
      label: 'On Time'
    },
    warning: {
      background: '#f59e0b',
      text: '#ffffff',
      icon: '⚠️',
      label: 'Warning'
    },
    critical: {
      background: '#dc2626',
      text: '#ffffff',
      icon: '🚨',
      label: 'Overdue'
    }
  };

  return colorSchemes[normalizedStatus] || colorSchemes.ok;
};

/**
 * Get urgency color based on time elapsed
 * @param {number} minutesElapsed - Minutes since breakdown reported
 * @returns {object} - Color scheme
 */
export const getUrgencyColors = (minutesElapsed) => {
  if (minutesElapsed < 5) {
    return {
      background: '#10b981',
      border: '#10b981',
      text: '#10b981',
      label: 'New',
      intensity: 'low'
    };
  } else if (minutesElapsed < 15) {
    return {
      background: '#3b82f6',
      border: '#3b82f6',
      text: '#3b82f6',
      label: 'Recent',
      intensity: 'low'
    };
  } else if (minutesElapsed < 30) {
    return {
      background: '#f59e0b',
      border: '#f59e0b',
      text: '#f59e0b',
      label: 'Pending',
      intensity: 'medium'
    };
  } else {
    return {
      background: '#dc2626',
      border: '#dc2626',
      text: '#dc2626',
      label: 'Urgent',
      intensity: 'high'
    };
  }
};

/**
 * Get priority route indicator color
 * @param {boolean} isPriorityRoute - Is this a priority route
 * @returns {object} - Color scheme
 */
export const getPriorityRouteColors = (isPriorityRoute) => {
  if (isPriorityRoute) {
    return {
      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
      text: '#ffffff',
      border: '#dc2626',
      icon: '⭐',
      label: 'Priority Route'
    };
  }
  return null;
};

/**
 * Generate CSS for pulse animation based on color
 * @param {string} color - Base color in hex or rgba
 * @returns {string} - CSS keyframe animation
 */
export const generatePulseAnimation = (color) => {
  return `
    @keyframes pulse-${color.replace('#', '')} {
      0%, 100% {
        box-shadow: 0 0 0 0 ${color}40;
      }
      50% {
        box-shadow: 0 0 0 10px ${color}00;
      }
    }
  `;
};

/**
 * Get CSS class for priority-based styling
 * @param {string} decision - Decision type
 * @returns {string} - CSS class name
 */
export const getPriorityClassName = (decision) => {
  const normalizedDecision = decision?.toUpperCase();
  const classMap = {
    STOP: 'priority-critical',
    AMBER: 'priority-high',
    CONTINUE: 'priority-low',
    CHANGEOVER: 'priority-medium',
    PENDING: 'priority-pending'
  };
  return classMap[normalizedDecision] || 'priority-pending';
};

/**
 * Get engineering timer color based on remaining time
 * @param {number} remainingMs - Milliseconds remaining
 * @param {number} targetMs - Target milliseconds
 * @returns {object} - Color scheme
 */
export const getEngineeringTimerColors = (remainingMs, targetMs) => {
  const percentRemaining = (remainingMs / targetMs) * 100;

  if (percentRemaining > 50) {
    return {
      background: '#10b981',
      text: '#ffffff',
      status: 'ok'
    };
  } else if (percentRemaining > 25) {
    return {
      background: '#f59e0b',
      text: '#ffffff',
      status: 'warning'
    };
  } else {
    return {
      background: '#dc2626',
      text: '#ffffff',
      status: 'critical'
    };
  }
};

export default {
  getDecisionColors,
  getStatusColors,
  getSLAColors,
  getUrgencyColors,
  getPriorityRouteColors,
  generatePulseAnimation,
  getPriorityClassName,
  getEngineeringTimerColors
};
