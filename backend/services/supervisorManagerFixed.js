// backend/services/supervisorManager.js - FIXED VERSION
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
import memoryMonitor from './memoryMonitor.js';
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

// Get Supabase client with retry logic
let supabaseClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  for (let attempt = 1; attempt <= MAX_CONNECTION_ATTEMPTS; attempt++) {
    try {
      console.log(`🔄 Attempting Supabase connection (attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS})...`);
      
      // Try to get client from optimizer first
      try {
        supabaseClient = supabaseOptimizer.getClient();
        console.log('✅ Got Supabase client from optimizer');
        return supabaseClient;
      } catch (optimizerError) {
        console.log('⚠️ Optimizer client not available, creating new client...');
      }
      
      // Create new client if optimizer fails
      supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );
      
      // Test the connection
      const { error } = await supabaseClient
        .from('supervisors')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Supabase connection successful');
      return supabaseClient;
      
    } catch (error) {
      console.error(`❌ Supabase connection failed (attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS}):`, {
        message: error.message || 'Unknown error',
        details: error.details || error.toString(),
        hint: attempt < MAX_CONNECTION_ATTEMPTS ? `Retrying in ${attempt} seconds...` : 'Max retries reached, continuing in offline mode',
        code: error.code || 'NETWORK_ERROR'
      });
      
      if (attempt < MAX_CONNECTION_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  console.warn('⚠️ Supervisor system starting in offline mode due to Supabase connection issues');
  return null;
}

// Supabase-backed session storage with memory optimization
let supervisorSessions = {}; // Keep as cache with size limit
let sessionCounter = 0;
const MAX_SESSIONS_IN_MEMORY = 50; // Limit to prevent memory bloat
const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes instead of 1 minute

// Debug: Log when module is loaded
const moduleLoadTime = new Date().toISOString();
console.log('🔄 supervisorManager.js module loaded at', moduleLoadTime);

// Initialize sessions from Supabase on startup with proper error handling
async function loadSessionsFromSupabase() {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.warn('⚠️ Skipping session load - Supabase not available');
      return;
    }
    
    const { data, error } = await client
      .from('supervisor_sessions')
      .select('*')
      .eq('is_active', true)
      .limit(20);
    
    if (!error && data) {
      // Rebuild in-memory cache from Supabase
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
      console.log(`✅ Loaded ${Object.keys(supervisorSessions).length} active sessions from Supabase`);
    } else if (error) {
      console.error('❌ Error loading sessions:', error);
    }
  } catch (error) {
    console.error('❌ Failed to load sessions from Supabase:', error);
  }
}

// Save session to Supabase with error handling
async function saveSessionToSupabase(sessionId, sessionData) {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.warn('⚠️ Cannot save session - Supabase offline');
      return false;
    }
    
    const { error } = await client
      .from('supervisor_sessions')
      .upsert({
        id: sessionId,
        supervisor_id: sessionData.supervisorId,
        supervisor_name: sessionData.supervisorName,
        supervisor_badge: sessionData.supervisorBadge,
        session_token: sessionData.sessionToken,
        is_admin: sessionData.isAdmin || false,
        start_time: sessionData.startTime,
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

// Log activity to Supabase with error handling
async function logActivity(action, details, supervisorInfo = null, req = null) {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.warn('⚠️ Cannot log activity - Supabase offline');
      return;
    }
    
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

    const { error } = await client
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

// Initialize supervisor data on startup
async function initializeSupervisorData() {
  console.log('🔄 Initializing supervisor data...');
  
  // First, try to establish Supabase connection
  await getSupabaseClient();
  
  // Then load sessions
  await loadSessionsFromSupabase();
  
  console.log('✅ Supervisor initialization complete');
}

// Call initialization
initializeSupervisorData().catch(error => {
  console.error('❌ Failed to initialize supervisor data:', error);
});

// Export the rest of the module functions here...
// (Copy the rest of the original file's exports)

export default {
  getSupabaseClient,
  loadSessionsFromSupabase,
  saveSessionToSupabase,
  logActivity,
  // ... rest of exports
};
