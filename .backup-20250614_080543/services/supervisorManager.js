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

// Auto-timeout configuration
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
let cleanupInterval;

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
          name: 'Alex Woodcock',
          badge: 'AW001',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor002': {
          id: 'supervisor002', 
          name: 'Andrew Cowley',
          badge: 'AC002',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor003': {
          id: 'supervisor003',
          name: 'Anthony Gair',
          badge: 'AG003',
          role: 'Developer/Admin',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts', 'view-reports', 'manage-supervisors'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor004': {
          id: 'supervisor004',
          name: 'Claire Fiddler',
          badge: 'CF004',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor005': {
          id: 'supervisor005',
          name: 'David Hall',
          badge: 'DH005',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor006': {
          id: 'supervisor006',
          name: 'James Daglish',
          badge: 'JD006',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor007': {
          id: 'supervisor007',
          name: 'John Paterson',
          badge: 'JP007',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor008': {
          id: 'supervisor008',
          name: 'Simon Glass',
          badge: 'SG008',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts'],
          active: true,
          createdAt: new Date().toISOString()
        },
        'supervisor009': {
          id: 'supervisor009',
          name: 'Barry Perryman',
          badge: 'BP009',
          role: 'Service Delivery Controller - Line Manager',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts', 'view-reports', 'manage-supervisors'],
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

    // Load supervisor sessions (MEMORY ONLY - files don't persist on Render)
    // Don't load from file on cloud platforms
    supervisorSessions = {};
    console.log('💾 Using in-memory sessions only (cloud-compatible)');

    console.log(`✅ Supervisor system initialized: ${Object.keys(supervisors).length} supervisors, ${Object.keys(dismissedAlerts).length} dismissed alerts`);
    
    // Start auto-timeout cleanup
    startSessionCleanup();
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
  // Don't save sessions to file on cloud platforms - use memory only
  // console.log('💾 Sessions stored in memory only');
}

// Auto-timeout: Clean up inactive sessions
function cleanupInactiveSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  
  Object.entries(supervisorSessions).forEach(([sessionId, session]) => {
    if (session.active) {
      const lastActivityTime = new Date(session.lastActivity).getTime();
      const timeSinceActivity = now - lastActivityTime;
      
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        console.log(`⏰ Auto-timeout: Session ${sessionId} for ${session.supervisorName} (inactive for ${Math.round(timeSinceActivity / 1000 / 60)}m)`);
        session.active = false;
        session.endTime = new Date().toISOString();
        session.timeoutReason = 'Auto-timeout after 10 minutes of inactivity';
        cleanedCount++;
      }
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Auto-cleanup: ${cleanedCount} inactive session(s) timed out`);
    console.log(`📊 Active sessions remaining: ${Object.values(supervisorSessions).filter(s => s.active).length}`);
  }
}

// Start auto-cleanup interval
function startSessionCleanup() {
  // Clean up every minute
  cleanupInterval = setInterval(cleanupInactiveSessions, 60 * 1000);
  console.log('🕐 Session auto-timeout enabled: 10 minutes inactivity limit, cleanup every 60 seconds');
}

// Stop auto-cleanup interval  
function stopSessionCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Session auto-timeout disabled');
  }
}

// Supervisor authentication
export function authenticateSupervisor(supervisorId, badge) {
  console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
  
  const supervisor = supervisors[supervisorId];
  if (!supervisor || !supervisor.active || supervisor.badge !== badge) {
    console.log(`❌ Auth failed: Invalid credentials for ${supervisorId}`);
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
  
  console.log(`✅ Session created: ${sessionId} for ${supervisor.name}`);
  console.log(`💾 Active sessions after creation: ${Object.keys(supervisorSessions).length}`);
  console.log(`📊 Sessions object:`, Object.keys(supervisorSessions));
  
  // Don't save to file - memory only
  // saveSupervisorSessions();
  
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
  console.log(`🔍 Validating session: ${sessionId}`);
  console.log(`💾 Active sessions: ${Object.keys(supervisorSessions).join(', ')}`);
  
  const session = supervisorSessions[sessionId];
  if (!session || !session.active) {
    console.log(`❌ Session validation failed: ${!session ? 'Session not found' : 'Session inactive'}`);
    return { success: false, error: 'Invalid or expired session' };
  }
  
  // Update last activity
  session.lastActivity = new Date().toISOString();
  // Don't save to file - memory only
  // saveSupervisorSessions();
  
  const supervisor = supervisors[session.supervisorId];
  console.log(`✅ Session valid for: ${supervisor.name}`);
  
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

// Get active supervisors (currently signed in)
export function getActiveSupervisors() {
  console.log(`🔍 getActiveSupervisors called`);
  console.log(`💾 Sessions available: ${Object.keys(supervisorSessions).length}`);
  console.log(`🗂️ Session IDs:`, Object.keys(supervisorSessions));
  
  const activeSessions = Object.values(supervisorSessions).filter(session => session.active);
  console.log(`✅ Active sessions found: ${activeSessions.length}`);
  
  const result = activeSessions.map(session => {
    const supervisor = supervisors[session.supervisorId];
    return {
      supervisorId: session.supervisorId,
      name: session.supervisorName,
      role: supervisor?.role || 'Supervisor',
      shift: supervisor?.shift || 'Unknown',
      sessionStart: session.startTime,
      lastActivity: session.lastActivity
    };
  });
  
  console.log(`📋 Returning ${result.length} active supervisors:`, result.map(s => s.name));
  return result;
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

// Update session activity (call this on any API interaction)
export function updateSessionActivity(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session && session.active) {
    session.lastActivity = new Date().toISOString();
    return true;
  }
  return false;
}

// Sign out supervisor
export function signOutSupervisor(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session) {
    session.active = false;
    session.endTime = new Date().toISOString();
    session.signoutReason = 'Manual logout';
    // Don't save to file - memory only
    // saveSupervisorSessions();
    console.log(`🚪 Supervisor signed out: ${session.supervisorName}`);
    return { success: true };
  }
  return { success: false, error: 'Session not found' };
}

// Get session timeout info
export function getSessionTimeoutInfo() {
  return {
    timeoutMinutes: SESSION_TIMEOUT_MS / (60 * 1000),
    timeoutMs: SESSION_TIMEOUT_MS,
    cleanupIntervalMs: 60 * 1000,
    activeSessions: Object.values(supervisorSessions).filter(s => s.active).length,
    totalSessions: Object.keys(supervisorSessions).length
  };
}

// ===== ADMIN FUNCTIONS =====

// Check if supervisor has admin permissions
export function hasAdminPermissions(supervisorId) {
  const supervisor = supervisors[supervisorId];
  return supervisor && supervisor.permissions.includes('manage-supervisors');
}

// Log out all supervisors (admin function)
export function logoutAllSupervisors(adminSessionId) {
  try {
    // Validate admin session
    const sessionValidation = validateSupervisorSession(adminSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid admin session' };
    }
    
    const adminSupervisor = sessionValidation.supervisor;
    
    // Check admin permissions
    if (!hasAdminPermissions(adminSupervisor.id)) {
      return { success: false, error: 'Insufficient permissions - admin access required' };
    }
    
    // Count active sessions before logout
    const activeSessions = Object.values(supervisorSessions).filter(s => s.active);
    const loggedOutCount = activeSessions.length;
    
    // Log out all active sessions
    Object.entries(supervisorSessions).forEach(([sessionId, session]) => {
      if (session.active) {
        session.active = false;
        session.endTime = new Date().toISOString();
        session.adminLogout = true;
        session.loggedOutBy = {
          supervisorId: adminSupervisor.id,
          supervisorName: adminSupervisor.name,
          badge: adminSupervisor.badge
        };
      }
    });
    
    console.log(`🚨 ADMIN ACTION: ${adminSupervisor.name} (${adminSupervisor.badge}) logged out all ${loggedOutCount} active supervisors`);
    
    return {
      success: true,
      message: `Successfully logged out ${loggedOutCount} supervisors`,
      loggedOutCount,
      adminSupervisor: {
        id: adminSupervisor.id,
        name: adminSupervisor.name,
        badge: adminSupervisor.badge
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to logout all supervisors:', error);
    return { success: false, error: error.message };
  }
}

// Add new supervisor (admin function)
export async function addSupervisor(adminSessionId, supervisorData) {
  try {
    // Validate admin session
    const sessionValidation = validateSupervisorSession(adminSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid admin session' };
    }
    
    const adminSupervisor = sessionValidation.supervisor;
    
    // Check admin permissions
    if (!hasAdminPermissions(adminSupervisor.id)) {
      return { success: false, error: 'Insufficient permissions - admin access required' };
    }
    
    // Validate required fields
    const { name, role, badge } = supervisorData;
    if (!name || !role || !badge) {
      return { success: false, error: 'Name, role, and badge are required' };
    }
    
    // Generate supervisor ID
    const existingIds = Object.keys(supervisors).map(id => {
      const match = id.match(/supervisor(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNumber = Math.max(...existingIds) + 1;
    const supervisorId = `supervisor${nextNumber.toString().padStart(3, '0')}`;
    
    // Check if badge already exists
    const existingBadge = Object.values(supervisors).find(s => s.badge === badge);
    if (existingBadge) {
      return { success: false, error: `Badge ${badge} already exists for ${existingBadge.name}` };
    }
    
    // Create new supervisor
    const newSupervisor = {
      id: supervisorId,
      name: name.trim(),
      badge: badge.trim().toUpperCase(),
      role: role.trim(),
      shift: supervisorData.shift || 'Day',
      permissions: supervisorData.permissions || ['view-alerts', 'dismiss-alerts'],
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: {
        supervisorId: adminSupervisor.id,
        supervisorName: adminSupervisor.name,
        badge: adminSupervisor.badge
      }
    };
    
    // Add to supervisors
    supervisors[supervisorId] = newSupervisor;
    await saveSupervisors();
    
    console.log(`👥 ADMIN ACTION: ${adminSupervisor.name} added new supervisor: ${newSupervisor.name} (${newSupervisor.badge})`);
    
    return {
      success: true,
      message: `Successfully added supervisor ${newSupervisor.name}`,
      supervisor: {
        id: newSupervisor.id,
        name: newSupervisor.name,
        badge: newSupervisor.badge,
        role: newSupervisor.role,
        shift: newSupervisor.shift,
        permissions: newSupervisor.permissions
      },
      adminSupervisor: {
        id: adminSupervisor.id,
        name: adminSupervisor.name,
        badge: adminSupervisor.badge
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to add supervisor:', error);
    return { success: false, error: error.message };
  }
}

// Delete supervisor (admin function)
export async function deleteSupervisor(adminSessionId, supervisorIdToDelete) {
  try {
    // Validate admin session
    const sessionValidation = validateSupervisorSession(adminSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid admin session' };
    }
    
    const adminSupervisor = sessionValidation.supervisor;
    
    // Check admin permissions
    if (!hasAdminPermissions(adminSupervisor.id)) {
      return { success: false, error: 'Insufficient permissions - admin access required' };
    }
    
    // Prevent self-deletion
    if (supervisorIdToDelete === adminSupervisor.id) {
      return { success: false, error: 'Cannot delete your own supervisor account' };
    }
    
    // Check if supervisor exists
    const supervisorToDelete = supervisors[supervisorIdToDelete];
    if (!supervisorToDelete) {
      return { success: false, error: 'Supervisor not found' };
    }
    
    // Prevent deletion of Barry Perryman (Service Delivery Controller)
    if (supervisorIdToDelete === 'supervisor009') {
      return { success: false, error: 'Cannot delete Service Delivery Controller account' };
    }
    
    // Log out any active sessions for this supervisor
    Object.entries(supervisorSessions).forEach(([sessionId, session]) => {
      if (session.supervisorId === supervisorIdToDelete && session.active) {
        session.active = false;
        session.endTime = new Date().toISOString();
        session.deletedByAdmin = true;
        session.deletedBy = {
          supervisorId: adminSupervisor.id,
          supervisorName: adminSupervisor.name,
          badge: adminSupervisor.badge
        };
      }
    });
    
    // Mark supervisor as deleted (don't actually delete for audit trail)
    supervisorToDelete.active = false;
    supervisorToDelete.deletedAt = new Date().toISOString();
    supervisorToDelete.deletedBy = {
      supervisorId: adminSupervisor.id,
      supervisorName: adminSupervisor.name,
      badge: adminSupervisor.badge
    };
    
    await saveSupervisors();
    
    console.log(`🗑️ ADMIN ACTION: ${adminSupervisor.name} deleted supervisor: ${supervisorToDelete.name} (${supervisorToDelete.badge})`);
    
    return {
      success: true,
      message: `Successfully deleted supervisor ${supervisorToDelete.name}`,
      deletedSupervisor: {
        id: supervisorToDelete.id,
        name: supervisorToDelete.name,
        badge: supervisorToDelete.badge,
        role: supervisorToDelete.role
      },
      adminSupervisor: {
        id: adminSupervisor.id,
        name: adminSupervisor.name,
        badge: adminSupervisor.badge
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to delete supervisor:', error);
    return { success: false, error: error.message };
  }
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
  getActiveSupervisors,
  getSupervisorActivity,
  getDismissalStatistics,
  signOutSupervisor,
  updateSessionActivity,
  getSessionTimeoutInfo,
  cleanupInactiveSessions,
  startSessionCleanup,
  stopSessionCleanup,
  // Admin functions
  hasAdminPermissions,
  logoutAllSupervisors,
  addSupervisor,
  deleteSupervisor,
  // Export sessions for debugging
  supervisorSessions
};
