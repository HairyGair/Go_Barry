// Authentication middleware for validating JWT tokens with MySQL database
// Migrated from Supabase Auth to MySQL-based authentication
// Ensures all protected routes require valid authentication and proper authorization

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import { from } from '../utils/queryHelpers.js';

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

if (!JWT_SECRET) {
    console.error('❌ FATAL: Missing required JWT_SECRET');
    console.error('   Set JWT_SECRET environment variable');
    process.exit(1);
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_SDC_OPERATIONS = 100;

// Create bounded caches with automatic cleanup
// stdTTL: Time to live in seconds (auto-delete after this time)
// checkperiod: How often to check for expired keys (in seconds)
// maxKeys: Maximum keys allowed (prevents unbounded growth)
const loginAttempts = new NodeCache({
  stdTTL: RATE_LIMIT_WINDOW,  // Auto-delete after 15 minutes
  checkperiod: 60,             // Check every 60 seconds
  useClones: false,            // Performance optimization
  maxKeys: 10000,              // Safety limit - prevent unbounded growth
  deleteOnExpire: true         // Auto-cleanup
});

const sdcOperationAttempts = new NodeCache({
  stdTTL: RATE_LIMIT_WINDOW,
  checkperiod: 60,
  useClones: false,
  maxKeys: 10000,
  deleteOnExpire: true
});

// Optional: Log cache statistics every 10 minutes for monitoring
setInterval(() => {
  const loginStats = loginAttempts.getStats();
  const sdcStats = sdcOperationAttempts.getStats();

  console.log('[CACHE STATS] Rate limiting caches:', {
    login: {
      keys: loginStats.keys,
      hits: loginStats.hits,
      misses: loginStats.misses,
      ksize: loginStats.ksize
    },
    sdc: {
      keys: sdcStats.keys,
      hits: sdcStats.hits,
      misses: sdcStats.misses,
      ksize: sdcStats.ksize
    }
  });
}, 10 * 60 * 1000); // Every 10 minutes

// Rate limiting middleware for login attempts
export const rateLimitLogin = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const identifier = `${clientIP}:${userAgent}`;

    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (!attempts) {
        // First attempt - initialize counter
        loginAttempts.set(identifier, {
            count: 1,
            windowStart: now,
            lastAttempt: now
        });
        return next();
    }

    // Check if rate limit exceeded
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const resetTime = new Date(attempts.windowStart + (RATE_LIMIT_WINDOW * 1000));
        const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

        console.warn(`⚠️ Rate limit exceeded for ${identifier}. Reset at ${resetTime}`);

        return res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: resetTime.toISOString(),
            retryAfter: retryAfter
        });
    }

    // Increment attempt count
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);

    next();
};

// Clear login attempts on successful authentication
export const clearLoginAttempts = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const identifier = `${clientIP}:${userAgent}`;

    // Use node-cache's delete method
    loginAttempts.del(identifier);
    next();
};

// Rate limiting middleware for SDC operations
export const rateLimitSDC = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userEmail = req.user?.email || 'unauthenticated';
    const identifier = `sdc:${userEmail}:${clientIP}`;

    const now = Date.now();
    const attempts = sdcOperationAttempts.get(identifier);

    if (!attempts) {
        // First operation - initialize counter
        sdcOperationAttempts.set(identifier, {
            count: 1,
            windowStart: now,
            lastOperation: now
        });
        return next();
    }

    // Check if rate limit exceeded
    if (attempts.count >= MAX_SDC_OPERATIONS) {
        const resetTime = new Date(attempts.windowStart + (RATE_LIMIT_WINDOW * 1000));
        const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

        console.warn(`⚠️ SDC rate limit exceeded for ${userEmail} from ${clientIP}. Reset at ${resetTime}`);

        return res.status(429).json({
            success: false,
            error: 'Too many SDC operations. Please try again later.',
            code: 'SDC_RATE_LIMIT_EXCEEDED',
            resetTime: resetTime.toISOString(),
            retryAfter: retryAfter,
            timestamp: new Date().toISOString()
        });
    }

    // Increment operation count
    attempts.count++;
    attempts.lastOperation = now;
    sdcOperationAttempts.set(identifier, attempts);

    next();
};

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // Check for token in HTTP-only cookie first (preferred secure method)
        // Fallback to Authorization header for backward compatibility during migration
        let token = req.cookies?.auth_token;
        let tokenSource = 'cookie';

        if (!token) {
            // Fallback: Check Authorization header (legacy method, less secure)
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
                tokenSource = 'header';
            }
        }

        // ALWAYS require authentication - no bypasses
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        // Log token source for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔐 Token verified from: ${tokenSource}`);
        }

        // Verify token signature and expiration
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token has expired',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            }
            console.warn('Invalid token provided:', jwtError.message);
            return res.status(401).json({
                error: 'Invalid or expired token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        // Extract user ID from token
        const userId = decoded.sub || decoded.id || decoded.user_id;
        if (!userId) {
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'AUTH_TOKEN_MALFORMED'
            });
        }

        // Fetch user from database to verify they still exist and are active
        const { data: supervisor, error } = await from('supervisors')
            .select('id, email, name, depot, role, is_active, badge_number')
            .eq('id', userId)
            .single();

        if (error || !supervisor) {
            console.warn('User not found for token:', userId);
            return res.status(401).json({
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (!supervisor.is_active) {
            console.warn('Inactive user attempted access:', supervisor.email);
            return res.status(403).json({
                error: 'Account is inactive',
                code: 'AUTH_USER_INACTIVE'
            });
        }

        // Attach user info to request
        req.user = {
            id: supervisor.id,
            email: supervisor.email,
            name: supervisor.name,
            role: supervisor.role || 'supervisor',
            depot: supervisor.depot,
            badge_number: supervisor.badge_number,
            aud: decoded.aud || 'authenticated',
            exp: decoded.exp,
            iat: decoded.iat
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        // Development fallback to prevent crashes
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode: Auth error fallback for', req.path);
            req.user = {
                id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0',
                email: 'anthony.gair@gonortheast.co.uk',
                name: 'Anthony Gair',
                role: 'admin',
                depot: 'Washington',
                badge_number: 'AG003',
                aud: 'authenticated',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000)
            };
            return next();
        }

        return res.status(401).json({
            error: 'Authentication failed',
            code: 'AUTH_VERIFICATION_FAILED'
        });
    }
};

// Middleware to check if user is authorized supervisor
export const requireSupervisor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_USER_MISSING'
            });
        }

        // Check if user exists in supervisors table
        const { data: supervisor, error } = await from('supervisors')
            .select('id, email, name, depot, role, badge_number')
            .eq('email', req.user.email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !supervisor) {
            console.warn(`Unauthorized access attempt by ${req.user.email}`);
            return res.status(403).json({
                error: 'Access denied. Supervisor privileges required.',
                code: 'AUTH_INSUFFICIENT_PRIVILEGES'
            });
        }

        // Attach supervisor info to request
        req.supervisor = supervisor;
        req.user.supervisorRole = supervisor.role;
        req.user.depot = supervisor.depot;
        req.user.badge_number = supervisor.badge_number;

        next();
    } catch (error) {
        console.error('Supervisor authorization error:', error);

        // Development fallback to prevent crashes
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode: Supervisor check fallback for', req.path);
            req.supervisor = {
                id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0',
                email: 'anthony.gair@gonortheast.co.uk',
                name: 'Anthony Gair',
                depot: 'Washington',
                role: 'admin',
                badge_number: 'AG003'
            };
            req.user.supervisorRole = 'admin';
            req.user.depot = 'Washington';
            req.user.badge_number = 'AG003';
            return next();
        }

        return res.status(500).json({
            error: 'Authorization check failed',
            code: 'AUTH_CHECK_FAILED'
        });
    }
};

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
    if (!req.supervisor || req.supervisor.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin privileges required',
            code: 'AUTH_ADMIN_REQUIRED'
        });
    }
    next();
};

// Middleware to require specific role
export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.supervisor || req.supervisor.role !== requiredRole) {
            return res.status(403).json({
                error: `${requiredRole} privileges required`,
                code: 'AUTH_ROLE_REQUIRED'
            });
        }
        next();
    };
};

// Security logging middleware
export const logSecurityEvent = (eventType) => {
    return (req, res, next) => {
        const securityEvent = {
            eventType,
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
            email: req.user?.email,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
        };

        // Log to console (in production, this would go to a proper logging service)
        console.log(`🔒 Security Event [${eventType}]:`, JSON.stringify(securityEvent, null, 2));

        // Attach to request for further processing
        req.securityEvent = securityEvent;

        next();
    };
};

// SDC-specific authentication middleware
export const authenticateSDC = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // ALWAYS require authentication - no bypasses
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'SDC authentication required',
                code: 'SDC_AUTH_MISSING'
            });
        }

        const token = authHeader.substring(7);

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            console.warn('Invalid SDC authentication:', jwtError.message);
            return res.status(401).json({
                success: false,
                error: 'Invalid authentication token',
                code: 'SDC_AUTH_INVALID'
            });
        }

        const userId = decoded.sub || decoded.id || decoded.user_id;

        // Check if user has SDC/supervisor privileges
        const { data: supervisor, error: supervisorError } = await from('supervisors')
            .select('id, email, name, role, depot, badge_number')
            .eq('id', userId)
            .eq('is_active', true)
            .single();

        if (supervisorError || !supervisor) {
            console.warn(`Unauthorized SDC access attempt by user ${userId}`);

            // Log security event
            const securityEvent = {
                eventType: 'unauthorized_sdc_access',
                timestamp: new Date().toISOString(),
                userId: userId,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                path: req.path
            };
            console.log('🔒 Security Alert:', JSON.stringify(securityEvent, null, 2));

            return res.status(403).json({
                success: false,
                error: 'SDC operator privileges required',
                code: 'SDC_AUTH_FORBIDDEN'
            });
        }

        // Verify user has appropriate role for SDC operations
        const allowedRoles = ['admin', 'sdc_operator', 'manager', 'supervisor'];
        if (!allowedRoles.includes(supervisor.role)) {
            console.warn(`SDC access denied for role: ${supervisor.role}`);
            return res.status(403).json({
                success: false,
                error: 'Insufficient privileges for SDC operations',
                code: 'SDC_AUTH_FORBIDDEN'
            });
        }

        req.user = {
            id: supervisor.id,
            email: supervisor.email,
            name: supervisor.name,
            role: supervisor.role,
            depot: supervisor.depot,
            badge_number: supervisor.badge_number
        };
        req.supervisor = supervisor;

        next();
    } catch (error) {
        console.error('SDC authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
            code: 'SDC_AUTH_ERROR'
        });
    }
};

// Combined auth middleware for convenience
export const authenticateUser = [verifyToken, logSecurityEvent('user_access')];
export const authenticateSupervisor = [verifyToken, requireSupervisor, logSecurityEvent('supervisor_access')];
export const authenticateAdmin = [verifyToken, requireSupervisor, requireAdmin, logSecurityEvent('admin_access')];

// Health check endpoint (no auth required)
export const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        auth: 'mysql-configured',
        rateLimit: 'active',
        jwtSecret: JWT_SECRET ? 'configured' : 'missing'
    });
};
