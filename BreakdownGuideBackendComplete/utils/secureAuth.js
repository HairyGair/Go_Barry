// backend/utils/secureAuth.js
// Secure authentication utilities for Go BARRY App

import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12; // High security salt rounds
const TOKEN_LENGTH = 64; // Cryptographically secure token length

/**
 * Hash a password securely using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  if (!password) {
    throw new Error('Password is required');
  }
  
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure session token
 * @returns {string} - Secure random token
 */
export function generateSecureToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Generate a secure session ID
 * @param {string} supervisorId - Supervisor ID
 * @returns {string} - Secure session identifier
 */
export function generateSessionId(supervisorId) {
  const timestamp = Date.now();
  const randomPart = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(`${supervisorId}-${timestamp}-${randomPart}`)
    .digest('hex');
  
  return `sess_${hash.substring(0, 32)}`;
}

/**
 * Create a secure session record
 * @param {string} supervisorId - Supervisor ID
 * @param {string} badge - Supervisor badge
 * @param {string} name - Supervisor name
 * @returns {Object} - Secure session record
 */
export function createSecureSession(supervisorId, badge, name) {
  const now = Date.now();
  const sessionToken = generateSecureToken();
  const sessionId = generateSessionId(supervisorId);
  
  return {
    sessionId,
    sessionToken,
    supervisorId,
    badge,
    name,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
    isValid: true,
    ipAddress: null, // Will be set when creating session
    userAgent: null  // Will be set when creating session
  };
}

/**
 * Validate session expiry and activity
 * @param {Object} session - Session record
 * @returns {boolean} - True if session is valid
 */
export function isSessionValid(session) {
  if (!session || !session.isValid) {
    return false;
  }
  
  const now = Date.now();
  
  // Check if session has expired
  if (session.expiresAt < now) {
    return false;
  }
  
  // Check if session has been inactive too long (10 minutes)
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
  if ((now - session.lastActivity) > INACTIVITY_TIMEOUT) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize session data for client response (removes sensitive data)
 * @param {Object} session - Full session record
 * @returns {Object} - Safe session data for client
 */
export function sanitizeSessionForClient(session) {
  if (!session) return null;
  
  return {
    supervisorId: session.supervisorId,
    badge: session.badge,
    name: session.name,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    expiresAt: session.expiresAt,
    isValid: session.isValid
    // Note: sessionToken and sessionId are NOT included for security
  };
}

/**
 * Validate input for common attacks
 * @param {string} input - User input to validate
 * @returns {boolean} - True if input is safe
 */
export function validateInput(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = /('|(\\)|(;)|(\/\*)|(--)|(\bDROP\b)|(\bDELETE\b)|(\bINSERT\b)|(\bUPDATE\b)|(\bSELECT\b))/i;
  if (sqlPatterns.test(input)) {
    return false;
  }
  
  // Check for XSS patterns
  const xssPatterns = /(<script>|<\/script>|javascript:|onclick=|onerror=)/i;
  if (xssPatterns.test(input)) {
    return false;
  }
  
  return true;
}

/**
 * Rate limiting helper
 * @param {string} key - Rate limit key (IP, user, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - Rate limit status
 */
const rateLimitStore = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, resetTime: now + windowMs };
  
  // Reset if window has passed
  if (now > record.resetTime) {
    record.attempts = 0;
    record.resetTime = now + windowMs;
  }
  
  record.attempts++;
  rateLimitStore.set(key, record);
  
  const isAllowed = record.attempts <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - record.attempts);
  const resetIn = record.resetTime - now;
  
  return {
    isAllowed,
    attempts: record.attempts,
    remaining,
    resetIn
  };
}

/**
 * Clear expired rate limit entries (call periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export default {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSessionId,
  createSecureSession,
  isSessionValid,
  sanitizeSessionForClient,
  validateInput,
  checkRateLimit,
  cleanupRateLimit
};