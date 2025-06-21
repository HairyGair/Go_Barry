// services/convexIntegration.js
// Helper functions to log supervisor actions to Convex

import { api } from '../convex/_generated/api';

// Log supervisor action to Convex (for frontend use)
export async function logSupervisorAction(convexClient, action) {
  try {
    const result = await convexClient.mutation(api.sync.logSupervisorAction, {
      supervisorId: action.supervisorId,
      supervisorName: action.supervisorName,
      action: action.action,
      details: action.details || {},
      timestamp: Date.now(),
      sessionId: action.sessionId
    });
    
    console.log('✅ Logged action to Convex:', action.action);
    return result;
  } catch (error) {
    console.error('❌ Failed to log action to Convex:', error);
    throw error;
  }
}

// Common supervisor actions to log
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

// Example usage in SupervisorControl component:
/*
import { logSupervisorAction, SUPERVISOR_ACTIONS } from '../services/convexIntegration';
import { useConvexSync } from '../hooks/useConvexSync';

// In component:
const convex = useConvex();

// When dismissing an alert:
await logSupervisorAction(convex, {
  supervisorId: session.supervisor.id,
  supervisorName: session.supervisor.name,
  action: SUPERVISOR_ACTIONS.DISMISS_ALERT,
  details: {
    alertId: alert.id,
    reason: dismissReason,
    location: alert.location
  },
  sessionId: session.sessionId
});
*/

// Backend integration for Node.js
export async function logSupervisorActionBackend(action) {
  try {
    // Use HTTP API for backend
    const response = await fetch(`${process.env.CONVEX_URL}/api/mutation`, {
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
          timestamp: Date.now(),
          sessionId: action.sessionId
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    console.log('✅ Backend logged action to Convex:', action.action);
    return await response.json();
  } catch (error) {
    console.error('❌ Backend failed to log to Convex:', error);
    // Don't throw - we don't want to break the main flow
    return null;
  }
}
