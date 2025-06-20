// backend/services/supervisorManager.js
// Supervisor Management System for BARRY with Supabase Integration

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Log environment variables
console.log('🔍 Supabase Config:');
console.log('  URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : '❌ Missing');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Supabase-backed session storage
let supervisorSessions = {}; // Keep as cache
let sessionCounter = 0;

// Debug: Log when module is loaded
const moduleLoadTime = new Date().toISOString();
console.log('🔄 supervisorManager.js module loaded at', moduleLoadTime);

// Initialize sessions from Supabase on startup
async function loadSessionsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('supervisor_sessions')
      .select('*')
      .eq('is_active', true);
    
    if (!error && data) {
      // Rebuild in-memory cache from Supabase
      supervisorSessions = {};
      data.forEach(session => {
        supervisorSessions[session.id] = {
          supervisorId: session.supervisor_id,
          supervisorName: session.supervisor_name,
          supervisorBadge: session.supervisor_badge, // Changed from badge_number
          sessionToken: session.session_token,
          startTime: session.login_time,
          lastActivity: session.last_activity,
          expiresAt: session.expires_at,
          active: session.is_active,
          isAdmin: session.is_admin,
          role: session.role,
          shift: session.shift
        };
      });
      console.log(`✅ Loaded ${Object.keys(supervisorSessions).length} active sessions from Supabase`);
    }
  } catch (error) {
    console.error('❌ Failed to load sessions from Supabase:', error);
  }
}

// Save session to Supabase
async function saveSessionToSupabase(sessionId, sessionData) {
  try {
    const { error } = await supabase
      .from('supervisor_sessions')
      .upsert({
        id: sessionId,
        supervisor_id: sessionData.supervisorId,
        supervisor_name: sessionData.supervisorName,
        supervisor_badge: sessionData.supervisorBadge, // Changed from badge_number
        session_token: sessionData.sessionToken,
        is_admin: sessionData.isAdmin || false,
        start_time: sessionData.startTime,  // Add this field
        login_time: sessionData.startTime,
        last_activity: sessionData.lastActivity,
        expires_at: sessionData.expiresAt,
        is_active: sessionData.active,
        role: sessionData.role,
        shift: sessionData.shift,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Failed to save session to Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Error saving session to Supabase:', error);
    return false;
  }
}

// Log activity to Supabase
async function logActivity(action, details, supervisorInfo = null, req = null) {
  try {
    const activityLog = {
      action,
      details,
      supervisor_id: supervisorInfo?.id || null,
      supervisor_name: supervisorInfo?.name || null,
      screen_type: details.screenType || 'supervisor',
      ip_address: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityLog);

    if (error) {
      console.error('❌ Failed to log activity:', error);
    } else {
      console.log(`📝 Activity logged: ${action}`);
    }
  } catch (error) {
    console.error('❌ Error logging activity:', error);
  }
}

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

    console.log(`✅ Supervisor system initialized with Supabase`);
    
    // Load existing sessions from Supabase
    await loadSessionsFromSupabase();
    
    // Start auto-timeout cleanup
    startSessionCleanup();
  } catch (error) {
    console.error('❌ Failed to initialize supervisor data:', error);
  }
}

// Auto-timeout: Clean up inactive sessions
async function cleanupInactiveSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of Object.entries(supervisorSessions)) {
    if (session.active) {
      const lastActivityTime = new Date(session.lastActivity).getTime();
      const timeSinceActivity = now - lastActivityTime;
      
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        console.log(`⏰ Auto-timeout: Session ${sessionId} for ${session.supervisorName} (inactive for ${Math.round(timeSinceActivity / 1000 / 60)}m)`);
        session.active = false;
        session.endTime = new Date().toISOString();
        session.timeoutReason = 'Auto-timeout after 10 minutes of inactivity';
        cleanedCount++;
        
        // Update Supabase
        try {
          await supabase
            .from('supervisor_sessions')
            .update({ 
              is_active: false,
              end_time: session.endTime,
              timeout_reason: session.timeoutReason
            })
            .eq('id', sessionId);
            
          // Log the auto-timeout
          await logActivity('session_timeout', {
            sessionId,
            supervisorId: session.supervisorId,
            supervisorName: session.supervisorName,
            timeoutReason: 'Auto-timeout after 10 minutes of inactivity',
            inactiveMinutes: Math.round(timeSinceActivity / 1000 / 60)
          });
        } catch (error) {
          console.error('❌ Failed to update session timeout in Supabase:', error);
        }
      }
    }
  }
  
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

// Supervisor authentication with fallback
export async function authenticateSupervisor(supervisorId, badge) {
  console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
  console.log(`🔍 Looking for supervisor with ID: '${supervisorId}' and badge: '${badge}'`);
  
  // Fallback supervisor data (matches frontend mapping)
  const fallbackSupervisors = {
    'supervisor001': { name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor002': { name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor003': { name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents', 'manage-supervisors'] },
    'supervisor004': { name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor005': { name: 'David Hall', badge: 'DH005', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor006': { name: 'James Daglish', badge: 'JD006', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor007': { name: 'John Paterson', badge: 'JP007', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor008': { name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor009': { name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents', 'manage-supervisors'] }
  };
  
  console.log(`📋 Available supervisor IDs: ${Object.keys(fallbackSupervisors).join(', ')}`);
  
  try {
    let supervisor = null;
    
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('id', supervisorId)
        .eq('badge', badge)
        .eq('active', true)
        .single();

      if (!error && data) {
        supervisor = data;
        console.log(`✅ Supabase auth successful for ${supervisor.name}`);
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase auth failed, using fallback:', supabaseError.message);
    }
    
    // Fallback to local data if Supabase fails
    if (!supervisor) {
      console.log(`🔍 Checking fallback for ID: '${supervisorId}'`);
      const fallbackSupervisor = fallbackSupervisors[supervisorId];
      console.log(`📋 Fallback result:`, fallbackSupervisor);
      
      if (fallbackSupervisor && fallbackSupervisor.badge === badge) {
        supervisor = {
          id: supervisorId,
          ...fallbackSupervisor,
          active: true
        };
        console.log(`✅ Fallback auth successful for ${supervisor.name}`);
        console.log(`👤 Full supervisor object:`, supervisor);
      } else {
        console.log(`❌ No match found - fallback badge: ${fallbackSupervisor?.badge}, provided badge: ${badge}`);
      }
    }
    
    if (!supervisor) {
      console.log(`❌ Auth failed: Invalid credentials for ${supervisorId}`);
      return { success: false, error: 'Invalid supervisor credentials' };
    }
    
    // Generate session token
    const sessionToken = `token_${supervisorId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionId = `session_${supervisorId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
    
    // Create session with correct structure for getActiveSupervisors
    supervisorSessions[sessionId] = {
      supervisorId: supervisorId,
      supervisorName: supervisor.name,  // getActiveSupervisors expects this
      supervisorBadge: supervisor.badge,
      sessionToken: sessionToken,
      startTime: new Date().toISOString(),  // getActiveSupervisors expects this
      lastActivity: new Date().toISOString(),
      expiresAt: expiresAt,
      active: true,
      isAdmin: supervisor.role?.includes('Admin') || supervisor.role?.includes('Controller') || false,
      // Additional info
      role: supervisor.role,
      shift: supervisor.shift,
      permissions: supervisor.permissions
    };
    
    // Save session to Supabase for persistence
    const supabaseSaved = await saveSessionToSupabase(sessionId, supervisorSessions[sessionId]);
    if (supabaseSaved) {
      console.log(`✅ Session saved to Supabase: ${sessionId}`);
    } else {
      console.warn('⚠️ Failed to save session to Supabase, but continuing with local session');
    }
    
    sessionCounter++;
    console.log(`✅ Session created: ${sessionId} for ${supervisor.name}`);
    console.log(`📊 Total sessions created in this process: ${sessionCounter}`);
    console.log(`💾 Current session count in memory: ${Object.keys(supervisorSessions).length}`);
    
    // Log successful login
    await logActivity('supervisor_login', {
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role,
      sessionId: sessionId
    }, { id: supervisor.id, name: supervisor.name });
    
    return {
      success: true,
      sessionId,
      sessionToken,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role,
        shift: supervisor.shift,
        permissions: supervisor.permissions,
        isAdmin: supervisor.role?.includes('Admin') || supervisor.role?.includes('Controller') || false
      },
      // Also include the session for debugging
      session: supervisorSessions[sessionId]
    };
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Validate supervisor session with fallback
export async function validateSupervisorSession(sessionId) {
  console.log(`🔍 Validating session: ${sessionId}`);
  
  const session = supervisorSessions[sessionId];
  if (!session || !session.active) {
    console.log(`❌ Session validation failed: ${!session ? 'Session not found' : 'Session inactive'}`);
    return { success: false, error: 'Invalid or expired session' };
  }
  
  // Fallback supervisor data (same as auth function)
  const fallbackSupervisors = {
    'supervisor001': { name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor002': { name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor003': { name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents', 'manage-supervisors'] },
    'supervisor004': { name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor005': { name: 'David Hall', badge: 'DH005', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor006': { name: 'James Daglish', badge: 'JD006', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor007': { name: 'John Paterson', badge: 'JP007', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor008': { name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents'] },
    'supervisor009': { name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', shift: 'Day', permissions: ['dismiss-alerts', 'create-incidents', 'manage-supervisors'] }
  };
  
  try {
    let supervisor = null;
    
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('id', session.supervisorId)
        .eq('active', true)
        .single();

      if (!error && data) {
        supervisor = data;
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase lookup failed during validation, using fallback');
    }
    
    // Fallback to local data if Supabase fails
    if (!supervisor) {
      const fallbackSupervisor = fallbackSupervisors[session.supervisorId];
      if (fallbackSupervisor) {
        supervisor = {
          id: session.supervisorId,
          ...fallbackSupervisor,
          active: true
        };
      }
    }

    if (!supervisor) {
      console.log(`❌ Supervisor not found or inactive: ${session.supervisorId}`);
      return { success: false, error: 'Supervisor account not found or inactive' };
    }
    
    // Update last activity
    await updateSessionActivity(sessionId);
    
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
export async function dismissAlert(alertId, supervisorSessionId, reason, notes = '', req = null) {
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
    
    // Log the dismissal activity
    await logActivity('alert_dismissed', {
      alertId,
      reason,
      notes,
      sessionId: supervisorSessionId
    }, { id: supervisor.id, name: supervisor.name }, req);
    
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
export async function getActiveSupervisors() {
  console.log(`🔍 getActiveSupervisors called`);
  
  try {
    // Query Supabase for active sessions
    const { data, error } = await supabase
      .from('supervisor_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity', { ascending: false });
    
    if (error) {
      console.error('❌ Error querying Supabase for active sessions:', error);
      // Fall back to memory cache
      return getActiveFromMemory();
    }
    
    if (data) {
      console.log(`💾 Found ${data.length} active sessions in Supabase`);
      
      // Update memory cache
      supervisorSessions = {};
      data.forEach(session => {
        supervisorSessions[session.id] = {
        supervisorId: session.supervisor_id,
        supervisorName: session.supervisor_name,
        supervisorBadge: session.supervisor_badge, // Changed from badge_number
        sessionToken: session.session_token,
        startTime: session.login_time,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at,
        active: session.is_active,
          isAdmin: session.is_admin,
        role: session.role,
        shift: session.shift
      };
      });
      
      // Check for timeouts
      const now = Date.now();
      const activeSessions = data.filter(session => {
        const lastActivity = new Date(session.last_activity).getTime();
        const timeSinceActivity = now - lastActivity;
        return timeSinceActivity <= SESSION_TIMEOUT_MS;
      });
      
      const result = activeSessions.map(session => ({
        supervisorId: session.supervisor_id,
        name: session.supervisor_name,
        sessionStart: session.login_time,
        lastActivity: session.last_activity
      }));
      
      console.log(`✅ Returning ${result.length} active supervisors from Supabase:`, result.map(s => s.name));
      return result;
    }
  } catch (error) {
    console.error('❌ Exception getting active supervisors:', error);
  }
  
  // Fallback to memory
  return getActiveFromMemory();
}

// Helper function for memory-based active supervisors
function getActiveFromMemory() {
  console.log(`💾 Using memory cache for active supervisors`);
  const activeSessions = Object.values(supervisorSessions).filter(session => session.active);
  console.log(`✅ Active sessions found in memory: ${activeSessions.length}`);
  
  const result = activeSessions.map(session => ({
    supervisorId: session.supervisorId,
    name: session.supervisorName,
    sessionStart: session.startTime,
    lastActivity: session.lastActivity
  }));
  
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
export async function updateSessionActivity(sessionId) {
  const session = supervisorSessions[sessionId];
  if (session && session.active) {
    session.lastActivity = new Date().toISOString();
    
    // Update in database (fire and forget)
    supabase
      .from('supervisor_sessions')
      .update({ 
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) console.error('Failed to update session activity in DB:', error);
      });
    
    return true;
  }
  return false;
}

// Sign out supervisor
export async function signOutSupervisor(sessionId, req = null) {
  const session = supervisorSessions[sessionId];
  if (session) {
    session.active = false;
    session.endTime = new Date().toISOString();
    session.signoutReason = 'Manual logout';
    
    // Update Supabase
    try {
      await supabase
        .from('supervisor_sessions')
        .update({ 
          is_active: false,
          end_time: session.endTime,
          signout_reason: session.signoutReason,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('❌ Failed to update logout in Supabase:', error);
    }
    
    console.log(`🚪 Supervisor signed out: ${session.supervisorName}`);
    
    // Log the logout activity
    await logActivity('supervisor_logout', {
      sessionId,
      supervisorId: session.supervisorId,
      supervisorName: session.supervisorName,
      sessionDuration: Math.round((new Date() - new Date(session.startTime)) / 1000 / 60) + ' minutes',
      logoutType: 'manual'
    }, null, req);
    
    // Get supervisor details for activity logging
    let supervisorInfo = null;
    try {
      const { data: supervisor, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('id', session.supervisorId)
        .single();
        
      if (!error && supervisor) {
        supervisorInfo = {
          id: supervisor.id,
          name: supervisor.name,
          badge: supervisor.badge,
          role: supervisor.role
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve supervisor info for logout:', error.message);
    }
    
    return { 
      success: true, 
      supervisor: supervisorInfo 
    };
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
        is_active: false,
        last_activity: new Date().toISOString()
      })
      .eq('is_active', true);
    
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

// Validate if supervisor exists by ID only (for roadwork creation)
export async function validateSupervisorById(supervisorId) {
  try {
    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('id, name, badge, role')
      .eq('id', supervisorId)
      .eq('active', true)
      .single();

    if (error || !supervisor) {
      console.log(`❌ Supervisor validation failed: ${supervisorId}`);
      return { success: false, error: 'Supervisor not found' };
    }

    console.log(`✅ Supervisor validated: ${supervisor.name}`);
    return {
      success: true,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role
      }
    };
  } catch (error) {
    console.error('❌ Supervisor validation error:', error);
    return { success: false, error: 'Validation failed' };
  }
}

// Get activity logs with filtering options
export async function getActivityLogs(options = {}) {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.supervisorId) {
      query = query.eq('supervisor_id', options.supervisorId);
    }
    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.screenType) {
      query = query.eq('screen_type', options.screenType);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching activity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error getting activity logs:', error);
    return [];
  }
}

// Get display screen activity (view from display screen)
export async function logDisplayScreenView(alertCount, req = null) {
  await logActivity('display_screen_view', {
    screenType: 'display',
    alertCount,
    timestamp: new Date().toISOString()
  }, null, req);
}

// Initialize on module load
initializeSupervisorData();

// Export logActivity for other modules
export { logActivity };

export default {
  authenticateSupervisor,
  validateSupervisorSession,
  validateSupervisorById,
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
  // Activity logging
  logActivity,
  getActivityLogs,
  logDisplayScreenView,
  // Admin functions
  hasAdminPermissions,
  logoutAllSupervisors,
  // Export sessions for debugging
  supervisorSessions,
  moduleLoadTime
};
