// Authentication middleware for validating Supabase JWT tokens
// Ensures all protected routes require valid authentication and proper authorization

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://oieliubbvvdzhzvikzal.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rate limiting storage (in-memory for now)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// Clean up old rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.windowStart > RATE_LIMIT_WINDOW) {
            loginAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Rate limiting middleware for login attempts
export const rateLimitLogin = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const identifier = `${clientIP}:${userAgent}`;

    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (!attempts) {
        // First attempt
        loginAttempts.set(identifier, {
            count: 1,
            windowStart: now,
            lastAttempt: now
        });
        return next();
    }

    // Check if window has expired
    if (now - attempts.windowStart > RATE_LIMIT_WINDOW) {
        // Reset window
        loginAttempts.set(identifier, {
            count: 1,
            windowStart: now,
            lastAttempt: now
        });
        return next();
    }

    // Check if rate limit exceeded
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const resetTime = new Date(attempts.windowStart + RATE_LIMIT_WINDOW);

        console.warn(`Rate limit exceeded for ${identifier}. Reset at ${resetTime}`);

        return res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            resetTime: resetTime.toISOString(),
            retryAfter: Math.ceil((resetTime.getTime() - now) / 1000)
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

    loginAttempts.delete(identifier);
    next();
};

// Middleware to verify JWT token from Supabase
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Development bypass for testing
        if (process.env.NODE_ENV === 'development' && (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null')) {
            console.log('🔧 Development mode: bypassing auth for', req.path);
            // Set a mock user for development
            req.user = {
                id: '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0', // Use real UUID to match existing data
                email: 'anthony.gair@gonortheast.co.uk',
                role: 'admin',
                aud: 'authenticated',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000)
            };
            return next();
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Supabase
        const { data: user, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.warn('Invalid token provided:', error?.message || 'User not found');
            return res.status(401).json({
                error: 'Invalid or expired token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        // Decode token to get additional claims
        const decoded = jwt.decode(token);
        if (!decoded) {
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'AUTH_TOKEN_MALFORMED'
            });
        }

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            return res.status(401).json({
                error: 'Token has expired',
                code: 'AUTH_TOKEN_EXPIRED'
            });
        }

        // Attach user info to request
        req.user = {
            id: user.user.id,
            email: user.user.email,
            role: user.user.user_metadata?.role || 'user',
            aud: decoded.aud,
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
                role: 'admin',
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
        const { data: supervisor, error } = await supabase
            .from('supervisors')
            .select('id, email, name, depot, role')
            .eq('email', req.user.email.toLowerCase())
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
                depot: 'SDC',
                role: 'admin'
            };
            req.user.supervisorRole = 'admin';
            req.user.depot = 'SDC';
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

// Combined auth middleware for convenience
export const authenticateUser = [verifyToken, logSecurityEvent('user_access')];
export const authenticateSupervisor = [verifyToken, requireSupervisor, logSecurityEvent('supervisor_access')];
export const authenticateAdmin = [verifyToken, requireSupervisor, requireAdmin, logSecurityEvent('admin_access')];

// Health check endpoint (no auth required)
export const healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        auth: 'configured',
        rateLimit: 'active'
    });
};