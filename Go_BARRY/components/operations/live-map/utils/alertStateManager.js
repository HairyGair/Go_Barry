/*
 * Go Barry - Alert State Manager
 * Handles alert state transitions and supervisor interactions
 * Phase 2: Core alert management logic with Convex integration
 */

import { useSupervisor } from '../../../../components/hooks/useSupervisorSession';
import { useConvexSync } from '../../../../hooks/useConvexSyncFixed';

/**
 * Alert state management utility
 * Provides methods for acknowledge, dismiss, and escalate actions
 */
export class AlertStateManager {
  constructor(convexSync) {
    this.convexSync = convexSync;
    this.auditLog = [];
  }

  /**
   * Acknowledge an alert
   * Updates alert state to 'acknowledged' and logs supervisor action
   */
  async acknowledgeAlert(alertId, supervisorData) {
    try {
      console.log('[AlertStateManager] Acknowledging alert:', alertId, 'by', supervisorData.name);
      
      // Update alert state in Convex
      const result = await this.convexSync.acknowledge({
        alertId,
        supervisorId: supervisorData.id,
        supervisorName: supervisorData.name,
        supervisorBadge: supervisorData.badge,
        timestamp: Date.now(),
        action: 'acknowledged'
      });

      // Log action locally for immediate feedback
      this.logAction({
        alertId,
        action: 'acknowledge',
        supervisor: supervisorData.name,
        timestamp: Date.now(),
        success: result.success
      });

      return {
        success: true,
        message: `Alert acknowledged by ${supervisorData.name}`,
        newState: 'acknowledged',
        acknowledgedBy: supervisorData.name
      };

    } catch (error) {
      console.error('[AlertStateManager] Acknowledge failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to acknowledge alert',
        alertId
      };
    }
  }

  /**
   * Dismiss an alert from the map display
   * Removes alert from Live Map but keeps in system for audit
   */
  async dismissAlert(alertId, supervisorData) {
    try {
      console.log('[AlertStateManager] Dismissing alert:', alertId, 'by', supervisorData.name);
      
      // Dismiss alert in Convex (removes from active display)
      const result = await this.convexSync.dismissFromDisplay({
        alertId,
        supervisorId: supervisorData.id,
        supervisorName: supervisorData.name,
        reason: 'dismissed-from-live-map',
        timestamp: Date.now()
      });

      // Log dismissal action
      this.logAction({
        alertId,
        action: 'dismiss',
        supervisor: supervisorData.name,
        timestamp: Date.now(),
        success: result.success
      });

      return {
        success: true,
        message: `Alert dismissed by ${supervisorData.name}`,
        newState: 'dismissed',
        dismissedBy: supervisorData.name
      };

    } catch (error) {
      console.error('[AlertStateManager] Dismiss failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to dismiss alert',
        alertId
      };
    }
  }

  /**
   * Escalate an alert to incident or roadwork management
   * Updates state to 'escalated' and prepares escalation data
   */
  async escalateAlert(alertId, supervisorData, escalationType = 'auto') {
    try {
      console.log('[AlertStateManager] Escalating alert:', alertId, 'type:', escalationType);
      
      // Mark alert as escalated in Convex
      const result = await this.convexSync.addNote({
        alertId,
        note: `Escalated to ${escalationType} management by ${supervisorData.name}`,
        supervisorId: supervisorData.id,
        supervisorName: supervisorData.name,
        noteType: 'escalation',
        timestamp: Date.now()
      });

      // Log escalation action
      this.logAction({
        alertId,
        action: 'escalate',
        escalationType,
        supervisor: supervisorData.name,
        timestamp: Date.now(),
        success: result.success
      });

      return {
        success: true,
        message: `Alert escalated to ${escalationType} management`,
        newState: 'escalated',
        escalatedBy: supervisorData.name,
        escalationType,
        escalationData: this.prepareEscalationData(alertId)
      };

    } catch (error) {
      console.error('[AlertStateManager] Escalate failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to escalate alert',
        alertId
      };
    }
  }

  /**
   * Prepare escalation data for incident/roadwork managers
   */
  prepareEscalationData(alertId) {
    // This will be enhanced in Phase 4 with actual alert data
    return {
      source: 'live-map',
      originalAlertId: alertId,
      timestamp: Date.now(),
      escalatedFrom: 'live-map-supervisor-action'
    };
  }

  /**
   * Get alert interaction history
   */
  getAlertHistory(alertId) {
    return this.auditLog.filter(entry => entry.alertId === alertId);
  }

  /**
   * Log supervisor action locally
   */
  logAction(actionData) {
    this.auditLog.push({
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...actionData
    });
    
    // Keep only last 1000 actions to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Get recent supervisor actions
   */
  getRecentActions(limit = 50) {
    return this.auditLog
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Clear local audit log
   */
  clearAuditLog() {
    this.auditLog = [];
  }
}

/**
 * React hook for alert state management
 * Provides easy access to alert actions with supervisor context
 */
export const useAlertStateManager = () => {
  const { supervisor } = useSupervisor();
  
  // Get Convex sync from hook - always called
  const convexSync = useConvexSync();
  
  // Create state manager instance
  const stateManager = new AlertStateManager(convexSync);

  /**
   * Acknowledge alert with current supervisor context
   */
  const acknowledgeAlert = async (alertId) => {
    if (!supervisor) {
      return {
        success: false,
        error: 'No supervisor logged in'
      };
    }

    return await stateManager.acknowledgeAlert(alertId, supervisor);
  };

  /**
   * Dismiss alert with current supervisor context
   */
  const dismissAlert = async (alertId) => {
    if (!supervisor) {
      return {
        success: false,
        error: 'No supervisor logged in'
      };
    }

    return await stateManager.dismissAlert(alertId, supervisor);
  };

  /**
   * Escalate alert with current supervisor context
   */
  const escalateAlert = async (alertId, escalationType) => {
    if (!supervisor) {
      return {
        success: false,
        error: 'No supervisor logged in'
      };
    }

    return await stateManager.escalateAlert(alertId, supervisor, escalationType);
  };

  /**
   * Get alert history
   */
  const getAlertHistory = (alertId) => {
    return stateManager.getAlertHistory(alertId);
  };

  /**
   * Get recent actions for current supervisor
   */
  const getRecentActions = (limit) => {
    return stateManager.getRecentActions(limit);
  };

  return {
    // Actions
    acknowledgeAlert,
    dismissAlert,
    escalateAlert,
    
    // History
    getAlertHistory,
    getRecentActions,
    
    // State
    supervisor,
    isLoggedIn: !!supervisor,
    
    // Utils
    stateManager
  };
};

/**
 * Utility functions for alert state logic
 */
export const AlertStateUtils = {
  /**
   * Determine if an alert can be acknowledged
   */
  canAcknowledge: (alert) => {
    return alert.alertState === 'new' || alert.alertState === undefined;
  },

  /**
   * Determine if an alert can be dismissed
   */
  canDismiss: (alert) => {
    return alert.alertState !== 'dismissed';
  },

  /**
   * Determine if an alert can be escalated
   */
  canEscalate: (alert) => {
    return alert.alertState !== 'escalated';
  },

  /**
   * Get alert state display text
   */
  getStateDisplayText: (state) => {
    const stateMap = {
      'new': 'New',
      'acknowledged': 'Acknowledged',
      'escalated': 'Escalated',
      'dismissed': 'Dismissed'
    };
    
    return stateMap[state] || 'Unknown';
  },

  /**
   * Get alert state color
   */
  getStateColor: (state) => {
    const colorMap = {
      'new': '#ef4444',         // Red
      'acknowledged': '#f59e0b', // Amber
      'escalated': '#8b5cf6',   // Purple
      'dismissed': '#6b7280'    // Gray
    };
    
    return colorMap[state] || '#6b7280';
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp: (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString();
  }
};

export default AlertStateManager;
