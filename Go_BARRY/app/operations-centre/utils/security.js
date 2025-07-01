/**
 * Security utilities for Operations Centre
 * Phase 7 - Deployment Security
 */

import { Platform } from 'react-native';

// Security headers for web platform
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=()',
};

// Check if user has required permissions
export const checkPermissions = (userRole, requiredRoles = ['supervisor', 'admin']) => {
  return requiredRoles.includes(userRole);
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// Validate API responses
export const validateAPIResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }
  
  if (!response.hasOwnProperty('success')) {
    throw new Error('API response missing success indicator');
  }
  
  return response;
};

// Session validation
export const validateSession = (session) => {
  if (!session || !session.supervisor || !session.token) {
    return false;
  }
  
  // Check session expiry
  const now = Date.now();
  const sessionAge = now - (session.timestamp || 0);
  const maxAge = 600000; // 10 minutes
  
  return sessionAge < maxAge;
};

// Rate limiting helper
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

// Content Security Policy for web
export const getCSP = () => {
  if (Platform.OS !== 'web') return null;
  
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://go-barry.onrender.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': [
      "'self'",
      'https://go-barry.onrender.com',
      'https://standing-octopus-908.convex.cloud',
      'https://haountnqhecfrsonivbq.supabase.co',
      'wss://standing-octopus-908.convex.cloud',
    ],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
  };
};

// Audit log helper
export const auditLog = (action, details) => {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    platform: Platform.OS,
    userAgent: Platform.OS === 'web' ? navigator.userAgent : 'mobile',
  };
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service
  } else {
    console.log('[AUDIT]', entry);
  }
  
  return entry;
};

export default {
  securityHeaders,
  checkPermissions,
  sanitizeInput,
  validateAPIResponse,
  validateSession,
  RateLimiter,
  getCSP,
  auditLog,
};
