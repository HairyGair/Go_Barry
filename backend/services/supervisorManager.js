// backend/services/supervisorManager.js
// Supervisor Management System for BARRY with Supabase Integration

import { createClient } from '@supabase/supabase-js';
import { 
  hashPassword, 
  verifyPassword, 
  createSecureSession, 
  isSessionValid, 
  sanitizeSessionForClient, 
  validateInput, 
  checkRateLimit 
} from '../utils/secureAuth.js';
import { supabaseOptimizer } from './supabaseOptimizer.js';
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
    // Use optimized query with caching
    const { data, error } = await supabaseOptimizer.optimizedSelect(supabase, 'supervisor_sessions', {
      filters: { is_active: true },
      limit: 20, // Limit active sessions
      cacheTTL: 180, // 3 minutes cache for session data
      cacheKey: 'active_supervisor_sessions'
    });
    
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

// ===== STREETMANAGER ROADWORK ACTIONS =====

// Acknowledge a roadwork alert
export async function acknowledgeRoadwork(roadworkId, supervisorSessionId, acknowledgmentType = 'reviewed', notes = '', req = null) {
  try {
    // Validate supervisor session
    const sessionValidation = await validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create acknowledgment record
    const acknowledgmentRecord = {
      id: `ack_${roadworkId}_${Date.now()}`,
      roadwork_id: roadworkId,
      supervisor_id: supervisor.id,
      supervisor_name: supervisor.name,
      supervisor_badge: supervisor.badge,
      acknowledgment_type: acknowledgmentType, // 'reviewed', 'monitoring', 'action_taken'
      notes: notes,
      timestamp: new Date().toISOString(),
      session_id: supervisorSessionId
    };
    
    // Save to Supabase
    const { error } = await supabase
      .from('roadwork_acknowledgments')
      .insert(acknowledgmentRecord);

    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        console.log('🔄 Creating roadwork_acknowledgments table...');
        // Table creation would be handled by Supabase migrations
      }
      console.error('❌ Failed to save acknowledgment:', error);
      return { success: false, error: 'Failed to save acknowledgment' };
    }
    
    console.log(`✅ Roadwork ${roadworkId} acknowledged by ${supervisor.name}: ${acknowledgmentType}`);
    
    // Log the activity
    await logActivity('roadwork_acknowledged', {
      roadworkId,
      acknowledgmentType,
      notes,
      sessionId: supervisorSessionId
    }, { id: supervisor.id, name: supervisor.name }, req);
    
    return {
      success: true,
      acknowledgment: acknowledgmentRecord
    };
    
  } catch (error) {
    console.error('❌ Failed to acknowledge roadwork:', error);
    return { success: false, error: error.message };
  }
}

// Create a diversion plan for a roadwork
export async function createDiversionPlan(roadworkId, supervisorSessionId, diversionData, req = null) {
  try {
    // Validate supervisor session
    const sessionValidation = await validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create diversion plan record
    const diversionPlan = {
      id: `diversion_${roadworkId}_${Date.now()}`,
      roadwork_id: roadworkId,
      supervisor_id: supervisor.id,
      supervisor_name: supervisor.name,
      supervisor_badge: supervisor.badge,
      affected_routes: diversionData.affectedRoutes || [],
      diversion_routes: diversionData.diversionRoutes || [],
      diversion_description: diversionData.description,
      estimated_delay_reduction: diversionData.estimatedDelayReduction || 0,
      implementation_status: 'proposed', // 'proposed', 'approved', 'active', 'completed'
      priority: diversionData.priority || 'medium', // 'low', 'medium', 'high', 'critical'
      start_time: diversionData.startTime || null,
      end_time: diversionData.endTime || null,
      created_at: new Date().toISOString(),
      session_id: supervisorSessionId,
      
      // Additional operational data
      affected_stops: diversionData.affectedStops || [],
      temporary_stops: diversionData.temporaryStops || [],
      lost_mileage: diversionData.lostMileage || 0,
      gained_mileage: diversionData.gainedMileage || 0,
      passenger_impact: diversionData.passengerImpact || 'unknown',
      driver_instructions: diversionData.driverInstructions || '',
      
      // Approval workflow
      requires_approval: diversionData.requiresApproval || false,
      approved_by: null,
      approved_at: null
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('diversion_plans')
      .insert(diversionPlan)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to save diversion plan:', error);
      return { success: false, error: 'Failed to save diversion plan' };
    }
    
    console.log(`🗺️ Diversion plan created for roadwork ${roadworkId} by ${supervisor.name}`);
    
    // Log the activity
    await logActivity('diversion_plan_created', {
      roadworkId,
      diversionPlanId: diversionPlan.id,
      affectedRoutes: diversionPlan.affected_routes.join(', '),
      priority: diversionPlan.priority,
      sessionId: supervisorSessionId
    }, { id: supervisor.id, name: supervisor.name }, req);
    
    // If high priority, send notification
    if (diversionPlan.priority === 'high' || diversionPlan.priority === 'critical') {
      // Trigger notification system (would integrate with notification service)
      console.log(`🚨 High priority diversion plan - notifications would be sent`);
    }
    
    return {
      success: true,
      diversionPlan: data
    };
    
  } catch (error) {
    console.error('❌ Failed to create diversion plan:', error);
    return { success: false, error: error.message };
  }
}

// Notify drivers about a roadwork
export async function notifyDriversAboutRoadwork(roadworkId, supervisorSessionId, notificationData, req = null) {
  try {
    // Validate supervisor session
    const sessionValidation = await validateSupervisorSession(supervisorSessionId);
    if (!sessionValidation.success) {
      return { success: false, error: 'Invalid supervisor session' };
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create notification record
    const driverNotification = {
      id: `notify_${roadworkId}_${Date.now()}`,
      roadwork_id: roadworkId,
      supervisor_id: supervisor.id,
      supervisor_name: supervisor.name,
      supervisor_badge: supervisor.badge,
      notification_type: notificationData.type || 'roadwork_alert', // 'roadwork_alert', 'diversion_active', 'delay_warning'
      priority: notificationData.priority || 'medium',
      
      // Message content
      title: notificationData.title || 'Roadwork Alert',
      message: notificationData.message,
      affected_routes: notificationData.affectedRoutes || [],
      
      // Delivery details
      delivery_channels: notificationData.channels || ['in_app'], // 'in_app', 'sms', 'radio', 'email'
      target_drivers: notificationData.targetDrivers || 'affected_routes', // 'all', 'affected_routes', 'specific_list'
      specific_drivers: notificationData.specificDrivers || [],
      
      // Timing
      send_immediately: notificationData.sendImmediately !== false,
      scheduled_time: notificationData.scheduledTime || null,
      expiry_time: notificationData.expiryTime || null,
      
      // Status tracking
      status: 'pending', // 'pending', 'sent', 'delivered', 'failed'
      sent_at: null,
      delivery_stats: {
        total_recipients: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      },
      
      created_at: new Date().toISOString(),
      session_id: supervisorSessionId
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('driver_notifications')
      .insert(driverNotification)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to save driver notification:', error);
      return { success: false, error: 'Failed to save notification' };
    }
    
    // Simulate sending notification (in production, this would integrate with actual notification systems)
    if (driverNotification.send_immediately) {
      // Update status to 'sent'
      await supabase
        .from('driver_notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          'delivery_stats.total_recipients': notificationData.affectedRoutes?.length * 10 || 50 // Estimate
        })
        .eq('id', driverNotification.id);
      
      console.log(`📢 Driver notification sent for roadwork ${roadworkId}`);
    } else {
      console.log(`🕑 Driver notification scheduled for roadwork ${roadworkId}`);
    }
    
    // Log the activity
    await logActivity('drivers_notified', {
      roadworkId,
      notificationId: driverNotification.id,
      notificationType: driverNotification.notification_type,
      affectedRoutes: driverNotification.affected_routes.join(', '),
      channels: driverNotification.delivery_channels.join(', '),
      priority: driverNotification.priority,
      sessionId: supervisorSessionId
    }, { id: supervisor.id, name: supervisor.name }, req);
    
    return {
      success: true,
      notification: data,
      message: driverNotification.send_immediately ? 
        `Notification sent to drivers on routes: ${notificationData.affectedRoutes?.join(', ')}` :
        `Notification scheduled for ${notificationData.scheduledTime}`
    };
    
  } catch (error) {
    console.error('❌ Failed to notify drivers:', error);
    return { success: false, error: error.message };
  }
}

// Get roadwork action history
export async function getRoadworkActionHistory(roadworkId) {
  try {
    // Get acknowledgments
    const { data: acknowledgments, error: ackError } = await supabase
      .from('roadwork_acknowledgments')
      .select('*')
      .eq('roadwork_id', roadworkId)
      .order('timestamp', { ascending: false });
    
    // Get diversion plans
    const { data: diversionPlans, error: divError } = await supabase
      .from('diversion_plans')
      .select('*')
      .eq('roadwork_id', roadworkId)
      .order('created_at', { ascending: false });
    
    // Get driver notifications
    const { data: notifications, error: notifError } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('roadwork_id', roadworkId)
      .order('created_at', { ascending: false });
    
    if (ackError || divError || notifError) {
      console.error('❌ Error fetching roadwork history:', { ackError, divError, notifError });
      return { success: false, error: 'Failed to fetch action history' };
    }
    
    return {
      success: true,
      history: {
        acknowledgments: acknowledgments || [],
        diversionPlans: diversionPlans || [],
        notifications: notifications || [],
        summary: {
          totalAcknowledgments: acknowledgments?.length || 0,
          totalDiversionPlans: diversionPlans?.length || 0,
          totalNotifications: notifications?.length || 0,
          lastAction: getLastAction(acknowledgments, diversionPlans, notifications)
        }
      }
    };
  } catch (error) {
    console.error('❌ Failed to get roadwork history:', error);
    return { success: false, error: error.message };
  }
}

// Helper to get the most recent action
function getLastAction(acks, divs, notifs) {
  const allActions = [
    ...(acks || []).map(a => ({ type: 'acknowledgment', ...a, actionTime: a.timestamp })),
    ...(divs || []).map(d => ({ type: 'diversion_plan', ...d, actionTime: d.created_at })),
    ...(notifs || []).map(n => ({ type: 'notification', ...n, actionTime: n.created_at }))
  ];
  
  allActions.sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime));
  return allActions[0] || null;
}

// Auto-timeout configuration
const SESSION_TIMEOUT_MS = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
let cleanupInterval;

// Initialize supervisor data and start cleanup with retry logic
async function initializeSupervisorData() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Attempting Supabase connection (attempt ${retryCount + 1}/${maxRetries})...`);
      
      // Verify Supabase connection with timeout
      const { data, error } = await Promise.race([
        supabase
          .from('supervisors')
          .select('count', { count: 'exact' })
          .limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
        
      if (error) {
        throw error;
      }

      console.log(`✅ Supervisor system initialized with Supabase (attempt ${retryCount + 1})`);
      return; // Success, exit retry loop
      
    } catch (error) {
      retryCount++;
      console.error(`❌ Supabase connection failed (attempt ${retryCount}/${maxRetries}):`, {
        message: error.message,
        details: error.stack?.substring(0, 200) + '...',
        hint: retryCount < maxRetries ? 'Retrying in 2 seconds...' : 'Max retries reached, continuing in offline mode',
        code: error.code || 'NETWORK_ERROR'
      });
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }
  
  console.log('⚠️ Supervisor system starting in offline mode due to Supabase connection issues');
  
  try {
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
        session.timeoutReason = 'Auto-timeout after 10 hours of inactivity';
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
            timeoutReason: 'Auto-timeout after 10 hours of inactivity',
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
  console.log('🕐 Session auto-timeout enabled: 10 hours inactivity limit, cleanup every 60 seconds');
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
// NEW: Secure authentication with password
export async function authenticateSupervisorSecure(supervisorId, badge, password, clientIP = null, userAgent = null) {
  console.log(`🔐 SECURE AUTH: Attempting login for ${supervisorId}`);
  
  // Input validation
  if (!validateInput(supervisorId) || !validateInput(badge) || !validateInput(password)) {
    console.warn(`⚠️ Invalid input detected for ${supervisorId}`);
    return { success: false, error: 'Invalid input format' };
  }
  
  // Rate limiting
  const rateLimitKey = clientIP || supervisorId;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  
  if (!rateLimit.isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${supervisorId} from ${clientIP}`);
    return { 
      success: false, 
      error: 'Too many login attempts. Please try again later.',
      rateLimitInfo: {
        attempts: rateLimit.attempts,
        resetIn: Math.ceil(rateLimit.resetIn / 1000 / 60) // minutes
      }
    };
  }
  
  try {
    let supervisor = null;
    let storedPasswordHash = null;
    
    // Try Supabase first for secure storage
    try {
      const { data, error } = await supabase
        .from('supervisors')
        .select('*, password_hash')  // Include password hash
        .eq('id', supervisorId)
        .eq('badge', badge)
        .eq('active', true)
        .single();

      if (!error && data) {
        supervisor = data;
        storedPasswordHash = data.password_hash;
        console.log(`✅ Supervisor found in Supabase: ${supervisor.name}`);
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase auth failed, checking fallback:', supabaseError.message);
    }
    
    // If not in Supabase, check fallback data with default password
    if (!supervisor) {
      const fallbackSupervisors = {
        'supervisor001': { name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor002': { name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor003': { name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', defaultPassword: 'Barry123' },
        'supervisor004': { name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor005': { name: 'David Hall', badge: 'DH005', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor006': { name: 'James Daglish', badge: 'JD006', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor007': { name: 'John Paterson', badge: 'JP007', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor008': { name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', defaultPassword: 'Barry123' },
        'supervisor009': { name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', defaultPassword: 'Barry123' }
      };
      
      const fallbackData = fallbackSupervisors[supervisorId];
      if (fallbackData && fallbackData.badge === badge) {
        supervisor = {
          id: supervisorId,
          name: fallbackData.name,
          badge: fallbackData.badge,
          role: fallbackData.role,
          active: true
        };
        // For fallback users, check against default password
        storedPasswordHash = await hashPassword(fallbackData.defaultPassword);
        console.log(`🔄 Using fallback data for ${supervisor.name}`);
      }
    }
    
    if (!supervisor) {
      console.log(`❌ Supervisor not found: ${supervisorId}/${badge}`);
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Verify password
    if (!storedPasswordHash) {
      console.warn(`⚠️ No password hash found for ${supervisorId}`);
      return { success: false, error: 'Account setup required. Please contact administrator.' };
    }
    
    const passwordValid = await verifyPassword(password, storedPasswordHash);
    if (!passwordValid) {
      console.log(`❌ Invalid password for ${supervisorId}`);
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Create secure session
    const sessionRecord = createSecureSession(supervisorId, badge, supervisor.name);
    sessionRecord.ipAddress = clientIP;
    sessionRecord.userAgent = userAgent;
    sessionRecord.role = supervisor.role;
    
    // Store session securely in memory (in production, use Redis or similar)
    if (!global.secureSessions) {
      global.secureSessions = new Map();
    }
    global.secureSessions.set(sessionRecord.sessionId, sessionRecord);
    
    console.log(`✅ SECURE AUTH SUCCESS: ${supervisor.name} (${supervisorId}) logged in`);
    
    return {
      success: true,
      session: sanitizeSessionForClient(sessionRecord),
      sessionToken: sessionRecord.sessionToken, // Only send once during login
      sessionId: sessionRecord.sessionId,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role
      }
    };
    
  } catch (error) {
    console.error(`❌ Secure authentication error for ${supervisorId}:`, error);
    return { success: false, error: 'Authentication failed' };
  }
}

// LEGACY: Authenticate supervisor with badge number only (DEPRECATED - use authenticateSupervisorSecure)
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
    console.log(`👥 Active supervisors after login: ${Object.values(supervisorSessions).filter(s => s.active).length}`);
    
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
      .select('id, name, badge, role, shift, active, permissions')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('❌ Error getting supervisors:', error);
      // Fallback to local data if Supabase fails
      const fallbackSupervisors = [
        { id: 'supervisor001', name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor002', name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor003', name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts', 'manage-supervisors'], active: true },
        { id: 'supervisor004', name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor005', name: 'David Hall', badge: 'DH005', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor006', name: 'James Daglish', badge: 'JD006', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor007', name: 'John Paterson', badge: 'JP007', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor008', name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'], active: true },
        { id: 'supervisor009', name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts', 'manage-supervisors'], active: true }
      ];
      return fallbackSupervisors;
    }

    // Filter out any null/undefined entries and ensure all required fields exist
    const validData = (data || []).filter(supervisor => 
      supervisor && 
      supervisor.id && 
      supervisor.name && 
      supervisor.badge
    ).map(supervisor => ({
      ...supervisor,
      role: supervisor.role || 'Supervisor',
      shift: supervisor.shift || 'Day',
      permissions: supervisor.permissions || ['view-alerts', 'dismiss-alerts']
    }));

    return validData;
  } catch (error) {
    console.error('❌ Error getting supervisors:', error);
    return [];
  }
}

// Get active supervisors (currently signed in) - FIXED
export async function getActiveSupervisors() {
  console.log(`🔍 getActiveSupervisors called`);
  console.log(`💾 Current sessions in memory: ${Object.keys(supervisorSessions).length}`);
  console.log(`📋 Session IDs: ${Object.keys(supervisorSessions).join(', ')}`);
  
  try {
    // First, always try to use memory cache as it's most reliable
    const memoryResult = getActiveFromMemory();
    console.log(`💾 Memory cache returned ${memoryResult.length} active supervisors`);
    
    if (memoryResult.length > 0) {
      console.log(`✅ Returning ${memoryResult.length} active supervisors from memory`);
      return memoryResult;
    }
    
    // If memory is empty, try Supabase as backup
    console.log(`📡 Memory empty, trying Supabase...`);
    
    const { data, error } = await supabase
      .from('supervisor_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity', { ascending: false });
    
    if (error) {
      console.error('❌ Error querying Supabase for active sessions:', error);
      // Return empty array on error
      return [];
    }
    
    if (data && data.length > 0) {
      console.log(`💾 Found ${data.length} active sessions in Supabase`);
      
      // Update memory cache
      supervisorSessions = {};
      data.forEach(session => {
        supervisorSessions[session.id] = {
          supervisorId: session.supervisor_id,
          supervisorName: session.supervisor_name,
          supervisorBadge: session.supervisor_badge,
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
    
    console.log(`📭 No active sessions found in Supabase either`);
    return [];
    
  } catch (error) {
    console.error('❌ Exception getting active supervisors:', error);
    return [];
  }
}

// Helper function for memory-based active supervisors - IMPROVED
function getActiveFromMemory() {
  console.log(`💾 Checking memory cache for active supervisors`);
  console.log(`📊 Total sessions in memory: ${Object.keys(supervisorSessions).length}`);
  
  const activeSessions = Object.values(supervisorSessions).filter(session => {
    console.log(`  Checking session: ${session.supervisorName}, active: ${session.active}`);
    return session.active === true;
  });
  
  console.log(`✅ Found ${activeSessions.length} active sessions in memory`);
  
  const result = activeSessions.map(session => ({
    supervisorId: session.supervisorId,
    name: session.supervisorName,
    sessionStart: session.startTime,
    lastActivity: session.lastActivity
  }));
  
  if (result.length > 0) {
    console.log(`📋 Active supervisors:`, result.map(s => s.name).join(', '));
  }
  
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

// Add new supervisor (admin only)
export async function addSupervisor(adminSessionId, supervisorData) {
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
    
    // Generate new supervisor ID
    const { data: existingSupervisors, error: countError } = await supabase
      .from('supervisors')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    let newId;
    if (existingSupervisors && existingSupervisors.length > 0) {
      const lastId = existingSupervisors[0].id;
      const lastNum = parseInt(lastId.replace('supervisor', ''));
      newId = `supervisor${String(lastNum + 1).padStart(3, '0')}`;
    } else {
      newId = 'supervisor010'; // Start from 010 since we have 001-009
    }
    
    // Check if badge already exists
    const { data: existingBadge, error: badgeError } = await supabase
      .from('supervisors')
      .select('badge')
      .eq('badge', supervisorData.badge)
      .single();
    
    if (existingBadge) {
      return { success: false, error: 'Badge number already exists' };
    }
    
    // Create new supervisor
    const newSupervisor = {
      id: newId,
      name: supervisorData.name,
      badge: supervisorData.badge,
      role: supervisorData.role || 'Supervisor',
      shift: supervisorData.shift || 'Day',
      permissions: supervisorData.permissions || ['view-alerts', 'dismiss-alerts'],
      active: true,
      created_at: new Date().toISOString(),
      created_by: adminSupervisor.id
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('supervisors')
      .insert(newSupervisor)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to add supervisor:', error);
      return { success: false, error: 'Failed to add supervisor to database' };
    }
    
    // Update local JSON file as backup
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const supervisorsPath = path.join(__dirname, '..', 'data', 'supervisors.json');
      
      const supervisorsData = JSON.parse(await fs.readFile(supervisorsPath, 'utf8'));
      supervisorsData[newId] = newSupervisor;
      await fs.writeFile(supervisorsPath, JSON.stringify(supervisorsData, null, 2));
    } catch (fileError) {
      console.warn('⚠️ Failed to update local supervisors.json:', fileError);
    }
    
    // Log the action
    await logActivity('supervisor_added', {
      newSupervisorId: newId,
      newSupervisorName: supervisorData.name,
      newSupervisorBadge: supervisorData.badge,
      addedBy: adminSupervisor.name
    }, { id: adminSupervisor.id, name: adminSupervisor.name });
    
    console.log(`✅ New supervisor added: ${supervisorData.name} (${supervisorData.badge}) by ${adminSupervisor.name}`);
    
    return {
      success: true,
      message: `Successfully added supervisor ${supervisorData.name}`,
      supervisor: data,
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

// Delete supervisor (admin only)
export async function deleteSupervisor(adminSessionId, supervisorIdToDelete) {
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
    
    // Prevent deleting self
    if (supervisorIdToDelete === adminSupervisor.id) {
      return { success: false, error: 'Cannot delete your own account' };
    }
    
    // Get supervisor details before deletion
    const { data: supervisorToDelete, error: fetchError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', supervisorIdToDelete)
      .single();
    
    if (fetchError || !supervisorToDelete) {
      return { success: false, error: 'Supervisor not found' };
    }
    
    // Soft delete - set active to false instead of hard delete
    const { error } = await supabase
      .from('supervisors')
      .update({ 
        active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: adminSupervisor.id
      })
      .eq('id', supervisorIdToDelete);
    
    if (error) {
      console.error('❌ Failed to delete supervisor:', error);
      return { success: false, error: 'Failed to delete supervisor from database' };
    }
    
    // Update local JSON file as backup
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const supervisorsPath = path.join(__dirname, '..', 'data', 'supervisors.json');
      
      const supervisorsData = JSON.parse(await fs.readFile(supervisorsPath, 'utf8'));
      if (supervisorsData[supervisorIdToDelete]) {
        supervisorsData[supervisorIdToDelete].active = false;
        supervisorsData[supervisorIdToDelete].deletedAt = new Date().toISOString();
        supervisorsData[supervisorIdToDelete].deletedBy = adminSupervisor.id;
        await fs.writeFile(supervisorsPath, JSON.stringify(supervisorsData, null, 2));
      }
    } catch (fileError) {
      console.warn('⚠️ Failed to update local supervisors.json:', fileError);
    }
    
    // Sign out any active sessions for the deleted supervisor
    Object.entries(supervisorSessions).forEach(([sessionId, session]) => {
      if (session.supervisorId === supervisorIdToDelete && session.active) {
        session.active = false;
        session.endTime = new Date().toISOString();
        session.deletionLogout = true;
        session.deletedBy = adminSupervisor.id;
      }
    });
    
    // Log the action
    await logActivity('supervisor_deleted', {
      deletedSupervisorId: supervisorIdToDelete,
      deletedSupervisorName: supervisorToDelete.name,
      deletedSupervisorBadge: supervisorToDelete.badge,
      deletedBy: adminSupervisor.name
    }, { id: adminSupervisor.id, name: adminSupervisor.name });
    
    console.log(`🗑️ Supervisor deleted: ${supervisorToDelete.name} (${supervisorToDelete.badge}) by ${adminSupervisor.name}`);
    
    return {
      success: true,
      message: `Successfully deleted supervisor ${supervisorToDelete.name}`,
      deletedSupervisor: {
        id: supervisorToDelete.id,
        name: supervisorToDelete.name,
        badge: supervisorToDelete.badge
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

// Reset supervisor password (admin only)
export async function resetSupervisorPassword(adminSessionId, supervisorIdToReset, newPassword) {
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
    
    // Get supervisor details
    const { data: supervisorToReset, error: fetchError } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', supervisorIdToReset)
      .single();
    
    if (fetchError || !supervisorToReset) {
      return { success: false, error: 'Supervisor not found' };
    }
    
    // Hash the new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update password in Supabase
    const { error: updateError } = await supabase
      .from('supervisors')
      .update({ 
        password_hash: passwordHash,
        password_reset_at: new Date().toISOString(),
        password_reset_by: adminSupervisor.id
      })
      .eq('id', supervisorIdToReset);
    
    if (updateError) {
      console.error('❌ Failed to reset password:', updateError);
      return { success: false, error: 'Failed to update password in database' };
    }
    
    // Log out any active sessions for the user whose password was reset
    Object.entries(supervisorSessions).forEach(([sessionId, session]) => {
      if (session.supervisorId === supervisorIdToReset && session.active) {
        session.active = false;
        session.endTime = new Date().toISOString();
        session.passwordReset = true;
        session.resetBy = adminSupervisor.id;
      }
    });
    
    // Update Supabase sessions
    await supabase
      .from('supervisor_sessions')
      .update({ 
        is_active: false,
        end_time: new Date().toISOString(),
        signout_reason: 'Password reset by admin'
      })
      .eq('supervisor_id', supervisorIdToReset)
      .eq('is_active', true);
    
    // Log the action
    await logActivity('password_reset', {
      targetSupervisorId: supervisorIdToReset,
      targetSupervisorName: supervisorToReset.name,
      targetSupervisorBadge: supervisorToReset.badge,
      resetBy: adminSupervisor.name
    }, { id: adminSupervisor.id, name: adminSupervisor.name });
    
    console.log(`🔐 Password reset for ${supervisorToReset.name} (${supervisorToReset.badge}) by ${adminSupervisor.name}`);
    
    return {
      success: true,
      message: `Successfully reset password for ${supervisorToReset.name}`,
      resetSupervisor: {
        id: supervisorToReset.id,
        name: supervisorToReset.name,
        badge: supervisorToReset.badge
      },
      adminSupervisor: {
        id: adminSupervisor.id,
        name: adminSupervisor.name,
        badge: adminSupervisor.badge
      }
    };
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
    return { success: false, error: error.message };
  }
}

// Initialize on module load
initializeSupervisorData();

// Export logActivity for other modules
export { logActivity };

export default {
  authenticateSupervisor,
  authenticateSupervisorSecure,  // NEW: Secure authentication
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
  addSupervisor,
  deleteSupervisor,
  resetSupervisorPassword,  // NEW: Password reset
  // NEW: StreetManager roadwork actions
  acknowledgeRoadwork,
  createDiversionPlan,
  notifyDriversAboutRoadwork,
  getRoadworkActionHistory,
  // Export sessions for debugging
  supervisorSessions,
  moduleLoadTime
};
