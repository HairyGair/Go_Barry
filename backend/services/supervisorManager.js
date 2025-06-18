// backend/services/supervisorManager.js
// Supervisor Management System for BARRY with Supabase Integration

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// In-memory storage for sessions (ephemeral by design)
let supervisorSessions = {};

// Auto-timeout configuration
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
let cleanupInterval;

// Initialize supervisor data and start cleanup
async function initializeSupervisorData() {
  try {
    // Verify Supabase connection
    const { data, error } = await supabase
      .from('supervisors')
      .select('count', { count: 'exact' })
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }

    console.log(`✅ Supervisor system initialized with Supabase: ${data.length} supervisors available`);
    
    // Start auto-timeout cleanup
    startSessionCleanup();
  } catch (error) {
    console.error('❌ Failed to initialize supervisor data:', error);
  }
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
export async function authenticateSupervisor(supervisorId, badge) {
  console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
  
  try {
    // Get supervisor from Supabase
    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .eq('badge', badge)
      .eq('active', true)
      .single();

    if (error || !supervisor) {
      console.log(`❌ Auth failed: Invalid credentials for ${supervisorId}`, error?.message);
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
    
    // Log session creation to Supabase
    await supabase
      .from('supervisor_sessions')
      .insert({
        id: sessionId,
        supervisor_id: supervisorId,
        badge: badge,
        login_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        active: true
      });
    
    console.log(`✅ Session created: ${sessionId} for ${supervisor.name}`);
    
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
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Validate supervisor session
export async function validateSupervisorSession(sessionId) {
  console.log(`🔍 Validating session: ${sessionId}`);
  
  const session = supervisorSessions[sessionId];
  if (!session || !session.active) {
    console.log(`❌ Session validation failed: ${!session ? 'Session not found' : 'Session inactive'}`);
    return { success: false, error: 'Invalid or expired session' };
  }
  
  try {
    // Get supervisor data from Supabase
    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', session.supervisorId)
      .eq('active', true)
      .single();

    if (error || !supervisor) {
      console.log(`❌ Supervisor not found or inactive: ${session.supervisorId}`);
      return { success: false, error: 'Supervisor account not found or inactive' };
    }
    
    // Update last activity in memory and database
    session.lastActivity = new Date().toISOString();
    
    await supabase
      .from('supervisor_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);
    
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
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}

// Dismiss alert with supervisor accountability
export async function dismissAlert(alertId, supervisorSessionId, reason, notes = '') {
  try {
    // Validate supervisor session
    const sessionValidation = await validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Check permissions
    if (!supervisor.permissions.includes('dismiss-alerts')) {
      return { success: false, error: 'Insufficient permissions to dismiss alerts' };
    }
    
    // Create dismissal record in Supabase
    const dismissalRecord = {
      id: `dismiss_${alertId}_${Date.now()}`,
      supervisor_id: supervisor.id,
      supervisor_badge: supervisor.badge,
      reason,
      timestamp: new Date().toISOString(),
      alert_hash: alertId,
      alert_data: {
        notes,
        supervisorName: supervisor.name,
        role: supervisor.role,
        sessionId: supervisorSessionId
      }
    };
    
    const { error } = await supabase
      .from('dismissed_alerts')
      .insert(dismissalRecord);

    if (error) {
      console.error('❌ Failed to save dismissal to database:', error);
      return { success: false, error: 'Failed to save dismissal record' };
    }
    
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

// Check if alert is dismissed
export async function isAlertDismissed(alertId) {
  try {
    const { data, error } = await supabase
      .from('dismissed_alerts')
      .select('*')
      .eq('alert_hash', alertId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error checking dismissal status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Error checking if alert dismissed:', error);
    return false;
  }
}

// Get dismissal info for alert
export async function getAlertDismissalInfo(alertId) {
  try {
    const { data, error } = await supabase
      .from('dismissed_alerts')
      .select('*')
      .eq('alert_hash', alertId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error getting dismissal info:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ Error getting dismissal info:', error);
    return null;
  }
}

// Get all supervisors
export async function getAllSupervisors() {
  try {
    const { data, error } = await supabase
      .from('supervisors')
      .select('id, name, badge, role, shift, active')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('❌ Error getting supervisors:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error getting supervisors:', error);
    return [];
  }
}

// Get active supervisors (currently signed in)
export function getActiveSupervisors() {
  console.log(`🔍 getActiveSupervisors called`);
  console.log(`💾 Sessions available: ${Object.keys(supervisorSessions).length}`);
  
  const activeSessions = Object.values(supervisorSessions).filter(session => session.active);
  console.log(`✅ Active sessions found: ${activeSessions.length}`);
  
  const result = activeSessions.map(session => ({
    supervisorId: session.supervisorId,
    name: session.supervisorName,
    sessionStart: session.startTime,
    lastActivity: session.lastActivity
  }));
  
  console.log(`📋 Returning ${result.length} active supervisors:`, result.map(s => s.name));
  return result;
}

// Get supervisor activity log
export async function getSupervisorActivity(supervisorId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('dismissed_alerts')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error getting supervisor activity:', error);
      return [];
    }

    return data.map(dismissal => ({
      type: 'dismiss',
      timestamp: dismissal.timestamp,
      alertId: dismissal.alert_hash,
      details: `Dismissed: ${dismissal.reason}`,
      notes: dismissal.alert_data?.notes || ''
    }));
  } catch (error) {
    console.error('❌ Error getting supervisor activity:', error);
    return [];
  }
}

// Get dismissal statistics
export async function getDismissalStatistics(timeRange = 'today') {
  try {
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

    const { data, error } = await supabase
      .from('dismissed_alerts')
      .select('*')
      .gte('timestamp', startTime.toISOString());

    if (error) {
      console.error('❌ Error getting dismissal statistics:', error);
      return {
        totalDismissals: 0,
        bySupervisor: {},
        byReason: {}
      };
    }

    const stats = {
      totalDismissals: data.length,
      bySupervisor: {},
      byReason: {}
    };

    data.forEach(dismissal => {
      // By supervisor
      const supervisorId = dismissal.supervisor_id;
      stats.bySupervisor[supervisorId] = (stats.bySupervisor[supervisorId] || 0) + 1;
      
      // By reason
      stats.byReason[dismissal.reason] = (stats.byReason[dismissal.reason] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error getting dismissal statistics:', error);
    return {
      totalDismissals: 0,
      bySupervisor: {},
      byReason: {}
    };
  }
}

// Update session activity (call this on any API interaction)
export function updateSessionActivity(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session && session.active) {
    session.lastActivity = new Date().toISOString();
    
    // Update in database (fire and forget)
    supabase
      .from('supervisor_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) console.error('Failed to update session activity in DB:', error);
      });
    
    return true;
  }
  return false;
}

// Sign out supervisor
export async function signOutSupervisor(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session) {
    session.active = false;
    session.endTime = new Date().toISOString();
    session.signoutReason = 'Manual logout';
    
    // Update database
    await supabase
      .from('supervisor_sessions')
      .update({ 
        active: false,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);
    
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
export async function hasAdminPermissions(supervisorId) {
  try {
    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('permissions')
      .eq('id', supervisorId)
      .single();

    if (error || !supervisor) return false;
    
    return supervisor.permissions.includes('manage-supervisors');
  } catch (error) {
    console.error('❌ Error checking admin permissions:', error);
    return false;
  }
}

// Log out all supervisors (admin function)
export async function logoutAllSupervisors(adminSessionId) {
  try {
    // Validate admin session
    const sessionValidation = await validateSupervisorSession(adminSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid admin session' };
    }
    
    const adminSupervisor = sessionValidation.supervisor;
    
    // Check admin permissions
    if (!(await hasAdminPermissions(adminSupervisor.id))) {
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

    // Update database sessions
    await supabase
      .from('supervisor_sessions')
      .update({ 
        active: false,
        last_activity: new Date().toISOString()
      })
      .eq('active', true);
    
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

// Initialize on module load
initializeSupervisorData();

export default {
  authenticateSupervisor,
  validateSupervisorSession,
  dismissAlert,
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
  // Export sessions for debugging
  supervisorSessions
};
