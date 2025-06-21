// backend/services/convexSync_FIXED.js
// Enhanced Convex sync service that syncs both alerts AND supervisor actions

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class ConvexSyncService {
  constructor() {
    this.convexUrl = process.env.CONVEX_URL || 'https://standing-octopus-908.convex.cloud';
    this.isEnabled = !!this.convexUrl;
    
    if (this.isEnabled) {
      console.log('✅ Convex sync service initialized:', this.convexUrl);
    } else {
      console.log('⚠️ Convex sync service disabled - no CONVEX_URL');
    }
  }

  // Sync alerts to Convex (existing functionality)
  async syncAlerts(alerts) {
    if (!this.isEnabled || !alerts || alerts.length === 0) {
      return { success: false, reason: 'No alerts or Convex disabled' };
    }

    try {
      // Transform alerts for Convex schema
      const convexAlerts = alerts.map(alert => ({
        alertId: alert.id || `alert_${Date.now()}_${Math.random()}`,
        title: alert.title || 'Unknown Alert',
        description: alert.description || '',
        location: alert.location || 'Unknown Location',
        coordinates: alert.coordinates || null,
        severity: alert.severity || 'medium',
        status: alert.status || 'active',
        source: alert.source || 'unknown',
        timestamp: alert.timestamp ? new Date(alert.timestamp).getTime() : Date.now(),
        affectsRoutes: alert.affectsRoutes || [],
        routeFrequencies: alert.routeFrequencies || {},
        dismissed: false,
        dismissedBy: null,
        dismissalReason: null
      }));

      // Call Convex mutation via HTTP API
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'alerts:batchInsertAlerts',
          args: { alerts: convexAlerts }
        })
      });

      if (!response.ok) {
        throw new Error(`Convex sync failed: ${response.status}`);
      }

      const result = await response.json();
      return { 
        success: true, 
        count: convexAlerts.length,
        result 
      };
    } catch (error) {
      console.error('❌ Convex alert sync error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // NEW: Log supervisor action to Convex
  async logSupervisorAction(action) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex disabled' };
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'sync:logSupervisorAction',
          args: {
            supervisorId: action.supervisorId,
            supervisorName: action.supervisorName,
            action: action.action,
            details: action.details || {},
            timestamp: action.timestamp || Date.now(),
            sessionId: action.sessionId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log action: ${response.status}`);
      }

      console.log(`✅ Logged supervisor action to Convex: ${action.action}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to log supervisor action:', error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Sync supervisor session
  async syncSupervisorSession(sessionData) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex disabled' };
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'supervisors:createOrUpdateSession',
          args: {
            sessionId: sessionData.sessionId,
            supervisorId: sessionData.supervisorId,
            supervisorName: sessionData.supervisorName,
            badge: sessionData.badge,
            role: sessionData.role,
            isAdmin: sessionData.isAdmin || false,
            loginTime: sessionData.loginTime || Date.now(),
            lastActivity: Date.now(),
            ipAddress: sessionData.ipAddress,
            userAgent: sessionData.userAgent
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to sync session: ${response.status}`);
      }

      console.log(`✅ Synced supervisor session to Convex: ${sessionData.supervisorName}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to sync supervisor session:', error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Remove supervisor session
  async removeSupervisorSession(sessionId) {
    if (!this.isEnabled) {
      return { success: false, reason: 'Convex disabled' };
    }

    try {
      const response = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'supervisors:removeSession',
          args: { sessionId }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to remove session: ${response.status}`);
      }

      console.log(`✅ Removed supervisor session from Convex: ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to remove supervisor session:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const convexSync = new ConvexSyncService();
export { convexSync };

// Action types for consistency
export const SUPERVISOR_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  DISMISS_ALERT: 'dismiss_alert',
  CREATE_ROADWORK: 'create_roadwork',
  UPDATE_ROADWORK: 'update_roadwork',
  SEND_EMAIL: 'send_email',
  START_DUTY: 'start_duty',
  END_DUTY: 'end_duty',
  SESSION_TIMEOUT: 'session_timeout',
  FORCE_LOGOUT: 'force_logout'
};
