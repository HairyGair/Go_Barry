// backend/middleware/jwtAuth.js
// JWT-based authentication middleware for Go BARRY API routes
// Memory optimized for 2GB RAM constraint

import { validateToken } from '../services/authService.js';

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and protects routes
 */
export function authenticateJWT(req, res, next) {
  // Check for token in Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.query.token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required',
      code: 'TOKEN_MISSING'
    });
  }
  
  // Validate token using auth service
  validateToken(token)
    .then(result => {
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
          code: 'TOKEN_INVALID'
        });
      }
      
      // Attach supervisor info to request
      req.supervisor = result.supervisor;
      req.sessionId = result.sessionId;
      
      next();
    })
    .catch(error => {
      console.error('❌ JWT middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    });
}

/**
 * Admin-only middleware
 * Requires JWT authentication and admin permissions
 */
export function requireAdmin(req, res, next) {
  authenticateJWT(req, res, (error) => {
    if (error) return next(error);
    
    if (!req.supervisor || !req.supervisor.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  });
}

/**
 * Optional authentication middleware
 * Adds supervisor info if token is present, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.query.token;
  
  if (!token) {
    return next(); // Continue without authentication
  }
  
  validateToken(token)
    .then(result => {
      if (result.success) {
        req.supervisor = result.supervisor;
        req.sessionId = result.sessionId;
      }
      next();
    })
    .catch(error => {
      console.error('❌ Optional auth error:', error);
      // Don't fail the request, just continue without auth
      next();
    });
}

/**
 * Rate limiting middleware for sensitive operations
 */
export function rateLimitSensitive(req, res, next) {
  // This would integrate with the rate limiting in authService
  // For now, just continue - actual implementation would check rates
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req, res, next) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

export default {
  authenticateJWT,
  requireAdmin,
  optionalAuth,
  rateLimitSensitive,
  securityHeaders
};