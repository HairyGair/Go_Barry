// backend/services/authService.js
// Secure JWT-based authentication service for Go BARRY
// Memory optimized for 2GB RAM constraint

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { 
  hashPassword, 
  verifyPassword, 
  validateInput, 
  checkRateLimit, 
  cleanupRateLimit 
} from '../utils/secureAuth.js';
import dotenv from 'dotenv';

dotenv.config();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours
const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// In-memory session store (in production, use Redis)
// Memory-optimized with size limits
const activeSessions = new Map();
const MAX_SESSIONS = 100; // Memory limit
const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let sessionCleanupInterval;

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiry
 * @returns {string} - JWT token
 */
function generateJWT(payload, expiresIn = JWT_EXPIRES_IN) {
  if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️ WARNING: Using default JWT secret! Change JWT_SECRET in production!');
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn,
    issuer: 'go-barry-app',
    audience: 'go-barry-supervisors'
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'go-barry-app',
      audience: 'go-barry-supervisors'
    });
  } catch (error) {
    console.log(`❌ JWT verification failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate secure session
 * @param {Object} supervisor - Supervisor data
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Object} - Session with tokens
 */
function generateSecureSession(supervisor, ipAddress = null, userAgent = null) {
  const now = new Date();
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create JWT payload
  const jwtPayload = {
    sessionId,
    supervisorId: supervisor.id,
    badge: supervisor.badge,
    name: supervisor.name,
    role: supervisor.role,
    isAdmin: supervisor.role?.includes('Admin') || supervisor.role?.includes('Controller') || false,
    iat: Math.floor(now.getTime() / 1000)
  };
  
  // Generate tokens
  const accessToken = generateJWT(jwtPayload, JWT_EXPIRES_IN);
  const refreshToken = generateJWT(
    { sessionId, supervisorId: supervisor.id, type: 'refresh' }, 
    JWT_REFRESH_EXPIRES_IN
  );
  
  // Create session record
  const session = {
    sessionId,
    supervisorId: supervisor.id,
    badge: supervisor.badge,
    name: supervisor.name,
    role: supervisor.role,
    isAdmin: jwtPayload.isAdmin,
    accessToken,
    refreshToken,
    createdAt: now.toISOString(),
    lastActivity: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    ipAddress,
    userAgent,
    isActive: true
  };
  
  // Store in memory with size limit
  enforceSessionLimit();
  activeSessions.set(sessionId, session);
  
  console.log(`✅ Secure session created for ${supervisor.name} (${supervisor.badge})`);
  
  return session;
}

/**
 * Enforce session memory limits
 */
function enforceSessionLimit() {
  if (activeSessions.size >= MAX_SESSIONS) {
    // Remove oldest sessions
    const sessions = Array.from(activeSessions.entries());
    sessions.sort((a, b) => new Date(a[1].lastActivity) - new Date(b[1].lastActivity));
    
    // Remove oldest 20% of sessions
    const toRemove = Math.floor(MAX_SESSIONS * 0.2);
    for (let i = 0; i < toRemove; i++) {
      activeSessions.delete(sessions[i][0]);
    }
    
    console.log(`🧹 Memory optimization: Removed ${toRemove} oldest sessions`);
  }
}

/**
 * Authenticate supervisor with secure password
 * @param {string} supervisorId - Supervisor ID
 * @param {string} badge - Badge number
 * @param {string} password - Password
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Object} - Authentication result
 */
export async function authenticateSupervisor(supervisorId, badge, password, ipAddress = null, userAgent = null) {
  console.log(`🔐 SECURE AUTH: Attempting login for ${supervisorId} (${badge})`);
  
  // Input validation
  if (!validateInput(supervisorId) || !validateInput(badge) || !validateInput(password)) {
    console.warn(`⚠️ Invalid input detected for ${supervisorId}`);
    return { success: false, error: 'Invalid input format' };
  }
  
  // Rate limiting
  const rateLimitKey = ipAddress || supervisorId;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  
  if (!rateLimit.isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${supervisorId} from ${ipAddress}`);
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
    // First, try to load supervisor from password file
    let supervisor = null;
    let passwordHash = null;
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const passwordsPath = path.join(__dirname, '../data/supervisor-passwords.json');
      
      const passwordData = JSON.parse(await fs.readFile(passwordsPath, 'utf8'));
      
      if (passwordData[badge]) {
        const supervisorData = passwordData[badge];
        const fallbackSupervisor = getFallbackSupervisor(supervisorId, badge);
        
        if (fallbackSupervisor) {
          supervisor = fallbackSupervisor;
          passwordHash = supervisorData.hash;
          console.log(`✅ Found supervisor ${badge} in password file`);
        }
      }
    } catch (fileError) {
      console.log(`⚠️ Could not load password file: ${fileError.message}`);
    }
    
    // If not found in file, try Supabase
    if (!supervisor) {
      const { data: dbSupervisor, error: dbError } = await supabase
        .from('supervisors')
        .select('id, name, badge, role, password_hash, active')
        .eq('id', supervisorId)
        .eq('badge', badge)
        .eq('active', true)
        .single();
      
      if (!dbError && dbSupervisor) {
        supervisor = dbSupervisor;
        passwordHash = dbSupervisor.password_hash;
        console.log(`✅ Found supervisor ${badge} in database`);
      }
    }
    
    // Final fallback to hardcoded data
    if (!supervisor) {
      const fallbackSupervisor = getFallbackSupervisor(supervisorId, badge);
      if (fallbackSupervisor) {
        supervisor = fallbackSupervisor;
        // Use default password for fallback without hash storage
        const isDefaultValid = password === 'Barry123!';
        if (!isDefaultValid) {
          console.log(`❌ Invalid password for fallback user ${supervisorId}`);
          return { success: false, error: 'Invalid credentials' };
        }
        
        // Generate secure session for fallback user
        const session = generateSecureSession(fallbackSupervisor, ipAddress, userAgent);
        
        return {
          success: true,
          message: 'Login successful (fallback mode)',
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
          supervisor: {
            id: fallbackSupervisor.id,
            name: fallbackSupervisor.name,
            badge: fallbackSupervisor.badge,
            role: fallbackSupervisor.role,
            isAdmin: session.isAdmin
          },
          expiresAt: session.expiresAt
        };
      }
      
      console.log(`❌ Supervisor not found: ${supervisorId}/${badge}`);
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Verify password
    if (!passwordHash) {
      console.warn(`⚠️ No password hash found for ${supervisorId} - account setup required`);
      return { 
        success: false, 
        error: 'Account setup required. Please contact administrator.',
        requiresSetup: true 
      };
    }
    
    const passwordValid = await verifyPassword(password, passwordHash);
    if (!passwordValid) {
      console.log(`❌ Invalid password for ${supervisorId}`);
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Generate secure session
    const session = generateSecureSession(supervisor, ipAddress, userAgent);
    
    // Save session to database for persistence
    await saveSessionToDatabase(session);
    
    // Log successful login
    await logAuthEvent('supervisor_login', {
      supervisorId: supervisor.id,
      name: supervisor.name,
      badge: supervisor.badge,
      ipAddress,
      userAgent,
      sessionId: session.sessionId
    });
    
    console.log(`✅ SECURE AUTH SUCCESS: ${supervisor.name} (${supervisorId}) logged in`);
    
    return {
      success: true,
      message: 'Login successful',
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge,
        role: supervisor.role,
        isAdmin: session.isAdmin
      },
      expiresAt: session.expiresAt
    };
    
  } catch (error) {
    console.error(`❌ Authentication error for ${supervisorId}:`, error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Validate JWT token and get session
 * @param {string} token - JWT access token
 * @returns {Object} - Validation result
 */
export async function validateToken(token) {
  if (!token) {
    return { success: false, error: 'Token is required' };
  }
  
  // Verify JWT
  const decoded = verifyJWT(token);
  if (!decoded) {
    return { success: false, error: 'Invalid or expired token' };
  }
  
  // Get session from memory
  const session = activeSessions.get(decoded.sessionId);
  if (!session || !session.isActive) {
    return { success: false, error: 'Session not found or inactive' };
  }
  
  // Update last activity
  session.lastActivity = new Date().toISOString();
  activeSessions.set(decoded.sessionId, session);
  
  return {
    success: true,
    supervisor: {
      id: decoded.supervisorId,
      name: decoded.name,
      badge: decoded.badge,
      role: decoded.role,
      isAdmin: decoded.isAdmin
    },
    sessionId: decoded.sessionId
  };
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - New access token
 */
export async function refreshAccessToken(refreshToken) {
  const decoded = verifyJWT(refreshToken);
  if (!decoded || decoded.type !== 'refresh') {
    return { success: false, error: 'Invalid refresh token' };
  }
  
  const session = activeSessions.get(decoded.sessionId);
  if (!session || !session.isActive) {
    return { success: false, error: 'Session not found or inactive' };
  }
  
  // Generate new access token
  const jwtPayload = {
    sessionId: session.sessionId,
    supervisorId: session.supervisorId,
    badge: session.badge,
    name: session.name,
    role: session.role,
    isAdmin: session.isAdmin,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const newAccessToken = generateJWT(jwtPayload, JWT_EXPIRES_IN);
  
  // Update session
  session.accessToken = newAccessToken;
  session.lastActivity = new Date().toISOString();
  activeSessions.set(session.sessionId, session);
  
  return {
    success: true,
    accessToken: newAccessToken,
    expiresAt: session.expiresAt
  };
}

/**
 * Logout supervisor
 * @param {string} sessionId - Session ID
 * @returns {Object} - Logout result
 */
export async function logoutSupervisor(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found' };
  }
  
  // Mark session as inactive
  session.isActive = false;
  session.logoutAt = new Date().toISOString();
  
  // Remove from memory to save RAM
  activeSessions.delete(sessionId);
  
  // Log logout event
  await logAuthEvent('supervisor_logout', {
    supervisorId: session.supervisorId,
    name: session.name,
    badge: session.badge,
    sessionId,
    sessionDuration: Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000 / 60) + ' minutes'
  });
  
  console.log(`🚪 Supervisor logged out: ${session.name} (${session.badge})`);
  
  return {
    success: true,
    message: 'Logout successful',
    supervisor: {
      name: session.name,
      badge: session.badge
    }
  };
}

/**
 * Get fallback supervisor data (for development)
 */
function getFallbackSupervisor(supervisorId, badge) {
  const fallbackSupervisors = {
    'supervisor001': { id: 'supervisor001', name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor' },
    'supervisor002': { id: 'supervisor002', name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor' },
    'supervisor003': { id: 'supervisor003', name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin' },
    'supervisor004': { id: 'supervisor004', name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor' },
    'supervisor005': { id: 'supervisor005', name: 'David Hall', badge: 'DH005', role: 'Supervisor' },
    'supervisor006': { id: 'supervisor006', name: 'James Daglish', badge: 'JD006', role: 'Supervisor' },
    'supervisor007': { id: 'supervisor007', name: 'John Paterson', badge: 'JP007', role: 'Supervisor' },
    'supervisor008': { id: 'supervisor008', name: 'Simon Glass', badge: 'SG008', role: 'Supervisor' },
    'supervisor009': { id: 'supervisor009', name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller' }
  };
  
  const supervisor = fallbackSupervisors[supervisorId];
  return (supervisor && supervisor.badge === badge) ? supervisor : null;
}

/**
 * Save session to database for persistence
 */
async function saveSessionToDatabase(session) {
  try {
    await supabase
      .from('supervisor_sessions')
      .upsert({
        id: session.sessionId,
        supervisor_id: session.supervisorId,
        supervisor_name: session.name,
        supervisor_badge: session.badge,
        session_token: session.accessToken.substring(0, 32) + '...', // Store only partial token for security
        is_admin: session.isAdmin,
        login_time: session.createdAt,
        last_activity: session.lastActivity,
        expires_at: session.expiresAt,
        is_active: session.isActive,
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        role: session.role
      });
  } catch (error) {
    console.error('❌ Failed to save session to database:', error);
  }
}

/**
 * Log authentication events
 */
async function logAuthEvent(event, data) {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        action: event,
        details: data,
        supervisor_id: data.supervisorId,
        supervisor_name: data.name,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Failed to log auth event:', error);
  }
}

/**
 * Cleanup expired sessions (memory optimization)
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    const expiresAt = new Date(session.expiresAt).getTime();
    const lastActivity = new Date(session.lastActivity).getTime();
    const inactivityLimit = 10 * 60 * 1000; // 10 minutes
    
    // Remove if expired or inactive too long
    if (now > expiresAt || (now - lastActivity) > inactivityLimit) {
      activeSessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Session cleanup: Removed ${cleanedCount} expired sessions`);
  }
  
  // Also cleanup rate limiting
  cleanupRateLimit();
}

/**
 * Get active sessions count
 */
export function getActiveSessionsCount() {
  return activeSessions.size;
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  const sessions = Array.from(activeSessions.values());
  const now = Date.now();
  
  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.isActive).length,
    expiredSessions: sessions.filter(s => new Date(s.expiresAt).getTime() < now).length,
    memoryUsage: {
      sessionMapSize: activeSessions.size,
      maxSessions: MAX_SESSIONS,
      utilizationPercent: Math.round((activeSessions.size / MAX_SESSIONS) * 100)
    }
  };
}

/**
 * Initialize auth service
 */
export function initializeAuthService() {
  console.log('🔐 Initializing secure authentication service...');
  
  // Start session cleanup interval
  sessionCleanupInterval = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);
  
  // Verify JWT secret
  if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️ WARNING: Default JWT secret detected! Change JWT_SECRET in production!');
  }
  
  console.log('✅ Secure authentication service initialized');
  console.log(`🔑 Session limits: ${MAX_SESSIONS} max sessions, cleanup every ${SESSION_CLEANUP_INTERVAL/1000}s`);
  
  return true;
}

/**
 * Shutdown auth service
 */
export function shutdownAuthService() {
  if (sessionCleanupInterval) {
    clearInterval(sessionCleanupInterval);
    sessionCleanupInterval = null;
  }
  
  activeSessions.clear();
  console.log('🛑 Authentication service shut down');
}

// Initialize on module load
initializeAuthService();

// Export main functions
export default {
  authenticateSupervisor,
  validateToken,
  refreshAccessToken,
  logoutSupervisor,
  getActiveSessionsCount,
  getSessionStats,
  initializeAuthService,
  shutdownAuthService
};