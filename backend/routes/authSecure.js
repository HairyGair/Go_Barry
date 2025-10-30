/**
 * Secure Authentication Routes
 * Enhanced security with timing attack prevention, rate limiting, audit logging
 * JWT token-based authentication with refresh tokens
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import database from '../services/database.js';
import logger from '../services/logger.js';
import auditLogger from '../services/auditLogger.js';
import tokenBlacklist from '../services/tokenBlacklist.js';
import {
  validateLogin,
  validateAuthHeader,
  validateContentType,
  validateBodySize
} from '../middleware/validation.js';
import {
  strictLoginLimiter,
  badgeLimiter,
  incrementBadgeAttempts,
  clearBadgeAttempts,
  refreshLimiter
} from '../middleware/rateLimiting.js';

dotenv.config();

const router = express.Router();

// JWT configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'change-this-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret';
const JWT_ISSUER = process.env.JWT_ISSUER || 'go-barry-api';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Validate JWT secrets on startup
if (JWT_ACCESS_SECRET === 'change-this-secret' || JWT_REFRESH_SECRET === 'change-this-refresh-secret') {
  logger.warn('⚠️  Using default JWT secrets - CHANGE THESE IN PRODUCTION!');
}

/**
 * Generate JWT access token
 * @param {Object} supervisor Supervisor data
 * @returns {string} JWT token
 */
function generateAccessToken(supervisor) {
  const payload = {
    sub: supervisor.id,
    badge: supervisor.badge_number,
    type: 'access',
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    algorithm: 'HS256'
  });
}

/**
 * Generate JWT refresh token
 * @param {Object} supervisor Supervisor data
 * @returns {string} JWT token
 */
function generateRefreshToken(supervisor) {
  const payload = {
    sub: supervisor.id,
    badge: supervisor.badge_number,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    algorithm: 'HS256'
  });
}

/**
 * Parse JWT expiry to timestamp
 * @param {string} expiry Expiry string (e.g., '15m', '7d')
 * @returns {number} Timestamp in milliseconds
 */
function parseExpiryToTimestamp(expiry) {
  const now = Date.now();
  const match = expiry.match(/^(\d+)([smhd])$/);

  if (!match) return now + (15 * 60 * 1000); // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return now + (value * multipliers[unit]);
}

/**
 * POST /api/auth/login
 * Authenticate supervisor with badge and password
 */
router.post('/login',
  validateContentType,
  validateBodySize(10 * 1024), // 10KB max
  strictLoginLimiter,
  badgeLimiter,
  validateLogin,
  async (req, res) => {
    const startTime = Date.now();
    const { badge, password } = req.body;
    const normalizedBadge = badge.toUpperCase();

    logger.auth('LOGIN_ATTEMPT', normalizedBadge, null, req);

    try {
      // Always query database to prevent timing attacks
      const supervisors = await database.query(
        'SELECT id, email, name, badge_number, depot, role, password_hash, is_active FROM supervisors WHERE badge_number = ? LIMIT 1',
        [normalizedBadge]
      );

      const supervisor = supervisors[0];

      // Prepare dummy hash for timing attack prevention
      const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO';
      const hashToCompare = supervisor?.password_hash || dummyHash;

      // Always run bcrypt comparison to prevent timing attacks
      const passwordValid = await bcrypt.compare(password, hashToCompare);

      // Check if supervisor exists and password is valid
      if (!supervisor || !passwordValid) {
        logger.auth('LOGIN_FAILED', normalizedBadge, false, req);

        // Increment badge attempt counter
        incrementBadgeAttempts(normalizedBadge);

        // Log to audit
        await auditLogger.logLoginAttempt(
          normalizedBadge,
          false,
          req,
          null,
          supervisor ? 'invalid_password' : 'badge_not_found'
        );

        // Check for badge enumeration
        await auditLogger.detectBadgeEnumeration(
          req.ip || req.connection?.remoteAddress,
          10
        );

        // Generic error message
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'AUTH_FAILED'
        });
      }

      // Check if supervisor is active
      if (!supervisor.is_active) {
        logger.auth('LOGIN_INACTIVE', normalizedBadge, false, req);

        await auditLogger.logLoginAttempt(
          normalizedBadge,
          false,
          req,
          supervisor.id,
          'account_inactive'
        );

        return res.status(403).json({
          success: false,
          error: 'Account is inactive. Please contact an administrator.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(supervisor);
      const refreshToken = generateRefreshToken(supervisor);

      // Set refresh token in HttpOnly cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: parseExpiryToTimestamp(REFRESH_TOKEN_EXPIRY) - Date.now(),
        path: '/'
      };

      res.cookie('refreshToken', refreshToken, cookieOptions);

      // Clear badge attempts on successful login
      clearBadgeAttempts(normalizedBadge);

      // Log successful login
      const duration = Date.now() - startTime;
      logger.auth('LOGIN_SUCCESS', normalizedBadge, true, req);

      await auditLogger.logLoginAttempt(
        normalizedBadge,
        true,
        req,
        supervisor.id
      );

      logger.info(`✅ Login successful: ${supervisor.name} (${normalizedBadge}) - ${duration}ms`);

      // Return success response
      return res.json({
        success: true,
        token: accessToken,
        user: {
          id: supervisor.id,
          badge: supervisor.badge_number,
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role,
          depot: supervisor.depot,
        },
        message: 'Login successful'
      });

    } catch (error) {
      logger.error('Login error:', error);

      return res.status(500).json({
        success: false,
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  refreshLimiter,
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        logger.security('REFRESH_NO_TOKEN', {}, req);
        return res.status(401).json({
          success: false,
          error: 'No refresh token provided',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      // Check if token is blacklisted
      if (tokenBlacklist.isBlacklisted(refreshToken)) {
        logger.security('REFRESH_BLACKLISTED_TOKEN', {}, req);
        res.clearCookie('refreshToken');

        return res.status(401).json({
          success: false,
          error: 'Token has been invalidated',
          code: 'TOKEN_BLACKLISTED'
        });
      }

      // Verify refresh token
      jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err) {
          logger.security('REFRESH_INVALID_TOKEN', { error: err.message }, req);

          await auditLogger.logTokenRefresh(
            decoded?.badge || 'unknown',
            decoded?.sub || null,
            false,
            req
          );

          res.clearCookie('refreshToken');

          return res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token',
            code: 'INVALID_REFRESH_TOKEN'
          });
        }

        // Validate token type
        if (decoded.type !== 'refresh') {
          logger.security('REFRESH_WRONG_TOKEN_TYPE', { type: decoded.type }, req);

          return res.status(401).json({
            success: false,
            error: 'Invalid token type',
            code: 'INVALID_TOKEN_TYPE'
          });
        }

        // Fetch fresh supervisor data
        const supervisors = await database.query(
          'SELECT id, badge_number, name, email, role, depot, is_active FROM supervisors WHERE id = ? AND is_active = 1 LIMIT 1',
          [decoded.sub]
        );

        if (!supervisors || supervisors.length === 0) {
          logger.security('REFRESH_SUPERVISOR_NOT_FOUND', { id: decoded.sub }, req);

          return res.status(401).json({
            success: false,
            error: 'Supervisor not found or inactive',
            code: 'SUPERVISOR_NOT_FOUND'
          });
        }

        const supervisor = supervisors[0];

        // Generate new access token
        const newAccessToken = generateAccessToken(supervisor);

        logger.auth('TOKEN_REFRESHED', supervisor.badge_number, true, req);

        await auditLogger.logTokenRefresh(
          supervisor.badge_number,
          supervisor.id,
          true,
          req
        );

        return res.json({
          success: true,
          token: newAccessToken,
          message: 'Token refreshed successfully'
        });
      });

    } catch (error) {
      logger.error('Token refresh error:', error);

      return res.status(500).json({
        success: false,
        error: 'Token refresh service temporarily unavailable',
        code: 'REFRESH_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout and blacklist tokens
 */
router.post('/logout',
  async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      let badge = 'unknown';
      let supervisorId = null;

      // Decode tokens to get user info
      if (refreshToken) {
        try {
          const decoded = jwt.decode(refreshToken);
          badge = decoded?.badge || badge;
          supervisorId = decoded?.sub || supervisorId;

          // Add refresh token to blacklist
          const expiresAt = parseExpiryToTimestamp(REFRESH_TOKEN_EXPIRY);
          tokenBlacklist.add(refreshToken, expiresAt, badge);
        } catch (err) {
          logger.debug('Error decoding refresh token during logout:', err.message);
        }
      }

      if (accessToken) {
        try {
          const decoded = jwt.decode(accessToken);
          badge = decoded?.badge || badge;
          supervisorId = decoded?.sub || supervisorId;

          // Add access token to blacklist
          const expiresAt = parseExpiryToTimestamp(ACCESS_TOKEN_EXPIRY);
          tokenBlacklist.add(accessToken, expiresAt, badge);
        } catch (err) {
          logger.debug('Error decoding access token during logout:', err.message);
        }
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      logger.auth('LOGOUT', badge, true, req);

      await auditLogger.logLogout(badge, supervisorId, req);

      return res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);

      return res.status(500).json({
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/verify
 * Verify current access token
 */
router.post('/verify',
  validateAuthHeader,
  async (req, res) => {
    try {
      const token = req.token;

      // Check if token is blacklisted
      if (tokenBlacklist.isBlacklisted(token)) {
        logger.security('VERIFY_BLACKLISTED_TOKEN', {}, req);

        return res.status(401).json({
          success: false,
          valid: false,
          error: 'Token has been invalidated',
          code: 'TOKEN_BLACKLISTED'
        });
      }

      // Verify token
      jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
          logger.security('VERIFY_INVALID_TOKEN', { error: err.message }, req);

          return res.status(401).json({
            success: false,
            valid: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        }

        // Validate token type
        if (decoded.type !== 'access') {
          logger.security('VERIFY_WRONG_TOKEN_TYPE', { type: decoded.type }, req);

          return res.status(401).json({
            success: false,
            valid: false,
            error: 'Invalid token type',
            code: 'INVALID_TOKEN_TYPE'
          });
        }

        return res.json({
          success: true,
          valid: true,
          user: {
            id: decoded.sub,
            badge: decoded.badge,
          },
          message: 'Token is valid'
        });
      });

    } catch (error) {
      logger.error('Token verification error:', error);

      return res.status(500).json({
        success: false,
        error: 'Verification service temporarily unavailable',
        code: 'VERIFICATION_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current supervisor information
 */
router.get('/me',
  validateAuthHeader,
  async (req, res) => {
    try {
      const token = req.token;

      // Check if token is blacklisted
      if (tokenBlacklist.isBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          error: 'Token has been invalidated',
          code: 'TOKEN_BLACKLISTED'
        });
      }

      // Verify and decode token
      jwt.verify(token, JWT_ACCESS_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        }

        // Fetch current supervisor data from database
        const supervisors = await database.query(
          'SELECT id, badge_number, name, email, role, depot, is_active FROM supervisors WHERE id = ? LIMIT 1',
          [decoded.sub]
        );

        if (!supervisors || supervisors.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Supervisor not found',
            code: 'SUPERVISOR_NOT_FOUND'
          });
        }

        const supervisor = supervisors[0];

        if (!supervisor.is_active) {
          return res.status(403).json({
            success: false,
            error: 'Account is inactive',
            code: 'ACCOUNT_INACTIVE'
          });
        }

        return res.json({
          success: true,
          user: {
            id: supervisor.id,
            badge: supervisor.badge_number,
            name: supervisor.name,
            email: supervisor.email,
            role: supervisor.role,
            depot: supervisor.depot,
          }
        });
      });

    } catch (error) {
      logger.error('Get current user error:', error);

      return res.status(500).json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/health
 * Health check for auth service
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await database.testConnection();

    // Get blacklist stats
    const blacklistStats = tokenBlacklist.getStats();

    return res.json({
      success: true,
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      blacklist: blacklistStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Auth health check error:', error);

    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
