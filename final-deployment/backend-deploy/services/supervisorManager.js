// backend/services/supervisorManager.js
// Supervisor Management System for BARRY with Alert Dismissal Accountability

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data storage paths
const SUPERVISORS_FILE = path.join(__dirname, '../data/supervisors.json');
const DISMISSED_ALERTS_FILE = path.join(__dirname, '../data/dismissed-alerts.json');
const SUPERVISOR_SESSIONS_FILE = path.join(__dirname, '../data/supervisor-sessions.json');

// In-memory storage
let supervisors = {};
let dismissedAlerts = {};
let supervisorSessions = {};

// Initialize data
async function initializeSupervisorData() {
  try {
    // Load supervisors
    try {
      const supervisorsData = await fs.readFile(SUPERVISORS_FILE, 'utf8');
      supervisors = JSON.parse(supervisorsData);
    } catch {
      supervisors = {
        'supervisor001': {
          id: 'supervisor001',
          name: 'John Smith',
          badge: 'JS001',
          role: 'Senior Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts', 'view-reports'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor002': {
          id: 'supervisor002', 
          name: 'Sarah Johnson',
          badge: 'SJ002',
          role: 'Traffic Controller',
          shift: 'Night',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        }
      };
      await saveSupervisors();
    }

    // Load dismissed alerts
    try {
      const dismissedData = await fs.readFile(DISMISSED_ALERTS_FILE, 'utf8');
      dismissedAlerts = JSON.parse(dismissedData);
    } catch {
      dismissedAlerts = {};
      await saveDismissedAlerts();
    }

    // Load supervisor sessions
    try {
      const sessionsData = await fs.readFile(SUPERVISOR_SESSIONS_FILE, 'utf8');
      supervisorSessions = JSON.parse(sessionsData);
    } catch {
      supervisorSessions = {};
      await saveSupervisorSessions();
    }

    console.log(`✅ Supervisor system initialized: ${Object.keys(supervisors).length} supervisors, ${Object.keys(dismissedAlerts).length} dismissed alerts`);
  } catch (error) {
    console.error('❌ Failed to initialize supervisor data:', error);
  }
}

// Save functions
async function saveSupervisors() {
  try {
    await fs.writeFile(SUPERVISORS_FILE, JSON.stringify(supervisors, null, 2));
  } catch (error) {
    console.error('❌ Failed to save supervisors:', error);
  }
}

async function saveDismissedAlerts() {
  try {
    await fs.writeFile(DISMISSED_ALERTS_FILE, JSON.stringify(dismissedAlerts, null, 2));
  } catch (error) {
    console.error('❌ Failed to save dismissed alerts:', error);
  }
}

async function saveSupervisorSessions() {
  try {
    await fs.writeFile(SUPERVISOR_SESSIONS_FILE, JSON.stringify(supervisorSessions, null, 2));
  } catch (error) {
    console.error('❌ Failed to save supervisor sessions:', error);
  }
}

// Supervisor authentication
export function authenticateSupervisor(supervisorId, badge) {
  const supervisor = supervisors[supervisorId];
  if (!supervisor || !supervisor.active || supervisor.badge !== badge) {
    return { success: false, error: 'Invalid supervisor credentials' };
  }
  
  // Create session
  const sessionId = `session_${supervisorId}_${Date.now()}`;
  supervisorSessions[sessionId] = {
    supervisorId,
    supervisorName: supervisor.name,
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    active: true
  };
  
  saveSupervisorSessions();
  
  return {
    success: true,
    sessionId,
    supervisor: {
      id: supervisor.id,
      name: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role,
      shift: supervisor.shift,
      permissions: supervisor.permissions
    }
  };
}

// Validate supervisor session
export function validateSupervisorSession(sessionId) {
  const session = supervisorSessions[sessionId];
  if (!session || !session.active) {
    return { success: false, error: 'Invalid or expired session' };
  }
  
  // Update last activity
  session.lastActivity = new Date().toISOString();
  saveSupervisorSessions();
  
  const supervisor = supervisors[session.supervisorId];
  return {
    success: true,
    supervisor: {
      id: supervisor.id,
      name: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role,
      shift: supervisor.shift,
      permissions: supervisor.permissions
    }
  };
}

// Dismiss alert with supervisor accountability
export async function dismissAlert(alertId, supervisorSessionId, reason, notes = '') {
  try {
    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Check permissions
    if (!supervisor.permissions.includes('dismiss-alerts')) {
      return { success: false, error: 'Insufficient permissions to dismiss alerts' };
    }
    
    // Create dismissal record
    const dismissalRecord = {
      alertId,
      dismissedBy: {
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role
      },
      dismissedAt: new Date().toISOString(),
      reason,
      notes,
      sessionId: supervisorSessionId
    };
    
    dismissedAlerts[alertId] = dismissalRecord;
    await saveDismissedAlerts();
    
    console.log(`🔕 Alert ${alertId} dismissed by ${supervisor.name} (${supervisor.badge}): ${reason}`);
    
    return {
      success: true,
      dismissal: dismissalRecord
    };
    
  } catch (error) {
    console.error('❌ Failed to dismiss alert:', error);
    return { success: false, error: error.message };
  }
}

// Restore dismissed alert
export async function restoreAlert(alertId, supervisorSessionId, reason = '') {
  try {
    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    if (!dismissedAlerts[alertId]) {
      return { success: false, error: 'Alert was not dismissed' };
    }
    
    // Add restoration info to the dismissal record
    dismissedAlerts[alertId].restoredBy = {
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role
    };
    dismissedAlerts[alertId].restoredAt = new Date().toISOString();
    dismissedAlerts[alertId].restorationReason = reason;
    dismissedAlerts[alertId].active = false; // Mark as inactive dismissal
    
    await saveDismissedAlerts();
    
    console.log(`🔔 Alert ${alertId} restored by ${supervisor.name} (${supervisor.badge}): ${reason}`);
    
    return {
      success: true,
      restoration: dismissedAlerts[alertId]
    };
    
  } catch (error) {
    console.error('❌ Failed to restore alert:', error);
    return { success: false, error: error.message };
  }
}

// Check if alert is dismissed
export function isAlertDismissed(alertId) {
  const dismissal = dismissedAlerts[alertId];
  return dismissal && dismissal.active !== false;
}

// Get dismissal info for alert
export function getAlertDismissalInfo(alertId) {
  return dismissedAlerts[alertId] || null;
}

// Get all supervisors
export function getAllSupervisors() {
  return Object.values(supervisors).map(supervisor => ({
    id: supervisor.id,
    name: supervisor.name,
    badge: supervisor.badge,
    role: supervisor.role,
    shift: supervisor.shift,
    active: supervisor.active
  }));
}

// Get supervisor activity log
export function getSupervisorActivity(supervisorId, limit = 50) {
  const activities = [];
  
  // Get dismissals by this supervisor
  Object.entries(dismissedAlerts).forEach(([alertId, dismissal]) => {
    if (dismissal.dismissedBy.supervisorId === supervisorId) {
      activities.push({
        type: 'dismiss',
        timestamp: dismissal.dismissedAt,
        alertId,
        details: `Dismissed: ${dismissal.reason}`,
        notes: dismissal.notes
      });
    }
    
    if (dismissal.restoredBy && dismissal.restoredBy.supervisorId === supervisorId) {
      activities.push({
        type: 'restore',
        timestamp: dismissal.restoredAt,
        alertId,
        details: `Restored: ${dismissal.restorationReason}`
      });
    }
  });
  
  // Sort by timestamp and return limited results
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// Get dismissal statistics
export function getDismissalStatistics(timeRange = 'today') {
  const now = new Date();
  let startTime;
  
  switch (timeRange) {
    case 'today':
      startTime = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startTime = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startTime = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startTime = new Date(0); // All time
  }
  
  const stats = {
    totalDismissals: 0,
    totalRestorations: 0,
    bySupervisor: {},
    byReason: {},
    averageTimeActive: 0
  };
  
  Object.values(dismissedAlerts).forEach(dismissal => {
    const dismissalTime = new Date(dismissal.dismissedAt);
    if (dismissalTime >= startTime) {
      stats.totalDismissals++;
      
      // By supervisor
      const supervisorId = dismissal.dismissedBy.supervisorId;
      stats.bySupervisor[supervisorId] = (stats.bySupervisor[supervisorId] || 0) + 1;
      
      // By reason
      stats.byReason[dismissal.reason] = (stats.byReason[dismissal.reason] || 0) + 1;
      
      // Restorations
      if (dismissal.restoredAt) {
        const restorationTime = new Date(dismissal.restoredAt);
        if (restorationTime >= startTime) {
          stats.totalRestorations++;
        }
      }
    }
  });
  
  return stats;
}

// Sign out supervisor
export function signOutSupervisor(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session) {
    session.active = false;
    session.endTime = new Date().toISOString();
    saveSupervisorSessions();
    return { success: true };
  }
  return { success: false, error: 'Session not found' };
}

// Initialize on module load
initializeSupervisorData();

export default {
  authenticateSupervisor,
  validateSupervisorSession,
  dismissAlert,
  restoreAlert,
  isAlertDismissed,
  getAlertDismissalInfo,
  getAllSupervisors,
  getSupervisorActivity,
  getDismissalStatistics,
  signOutSupervisor
};
