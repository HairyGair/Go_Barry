// backend/middleware/communicationsAuth.js
// Authentication middleware for Communications Platform
// Handles supervisor session verification and API key validation

import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

/**
 * Verify supervisor session from Convex
 */
export const verifySupervisorSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const supervisorId = req.headers['x-supervisor-id'];
    
    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Missing supervisor ID header',
        code: 'MISSING_SUPERVISOR_ID'
      });
    }

    // Verify supervisor session exists in Convex
    // This would integrate with Convex session verification
    const sessionValid = await verifySupervisorInConvex(supervisorId);
    
    if (!sessionValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired supervisor session',
        code: 'INVALID_SESSION'
      });
    }

    // Add supervisor info to request
    req.supervisor = {
      id: supervisorId,
      sessionVerified: true,
      timestamp: Date.now()
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Rate limiting for communications endpoints
 */
export const communicationsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on endpoint type
    if (req.path.includes('/email')) {
      return 100; // 100 emails per 15 min
    }
    if (req.path.includes('/voip')) {
      return 50; // 50 calls per 15 min
    }
    if (req.path.includes('/templates')) {
      return 200; // 200 template operations per 15 min
    }
    return 150; // Default limit
  },
  message: {
    success: false,
    error: 'Rate limit exceeded for communications endpoint',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to rate limit per supervisor
  keyGenerator: (req) => {
    return req.supervisor?.id || req.ip;
  }
});

/**
 * API key validation for external services
 */
export const validateAPIKey = (serviceName) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env[`${serviceName.toUpperCase()}_API_KEY`];
    
    if (!apiKey || apiKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: `Invalid API key for ${serviceName}`,
        code: 'INVALID_API_KEY'
      });
    }
    
    next();
  };
};

/**
 * Admin-only access middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const supervisorId = req.supervisor?.id;
    
    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Supervisor authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if supervisor is admin (AG003 or BP009)
    const isAdmin = ['AG003', 'BP009'].includes(supervisorId);
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    req.supervisor.isAdmin = true;
    next();
  } catch (error) {
    console.error('❌ Admin check error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin verification service unavailable',
      code: 'ADMIN_CHECK_ERROR'
    });
  }
};

/**
 * Helper function to verify supervisor in Convex
 */
async function verifySupervisorInConvex(supervisorId) {
  try {
    // This would integrate with Convex to check active sessions
    // For now, return true for valid supervisor IDs
    const validSupervisors = [
      'AW001', 'AC002', 'AG003', 'CF004', 'DH005',
      'JD006', 'JP007', 'SG008', 'BP009'
    ];
    
    return validSupervisors.includes(supervisorId);
  } catch (error) {
    console.error('❌ Convex session verification error:', error);
    return false;
  }
}

/**
 * Token refresh middleware for Microsoft Graph API
 */
export const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    const token = req.headers['x-ms-token'];
    
    if (token) {
      // Check if token needs refresh (expires within 10 minutes)
      const decoded = jwt.decode(token, { complete: true });
      const now = Math.floor(Date.now() / 1000);
      
      if (decoded?.payload?.exp && (decoded.payload.exp - now) < 600) {
        console.log('🔄 Token expires soon, should refresh');
        // Add refresh flag to request
        req.tokenNeedsRefresh = true;
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Token refresh check error:', error);
    // Don't fail the request, just log the error
    next();
  }
};

export default {
  verifySupervisorSession,
  communicationsRateLimit,
  validateAPIKey,
  requireAdmin,
  refreshTokenIfNeeded
};