/**
 * Rate Limiting Middleware
 * Multi-tier rate limiting for authentication and API endpoints
 */
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';

/**
 * Store for tracking failed login attempts per badge
 */
const badgeAttempts = new Map();

/**
 * Clean up expired badge attempts every hour
 */
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [badge, data] of badgeAttempts.entries()) {
    if (now - data.resetAt > oneHour) {
      badgeAttempts.delete(badge);
    }
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  logger.security('RATE_LIMIT_EXCEEDED', {
    ip: req.ip,
    path: req.path,
    badge: req.body?.badge,
  }, req);

  res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Skip rate limiting for successful requests in some cases
 */
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

/**
 * Strict rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
export const strictLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler,
  skip: (req, res) => {
    // Don't count successful logins against the limit
    return res.statusCode === 200;
  },
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/**
 * Per-badge rate limiter
 * 3 failed attempts per hour per badge
 */
export const badgeLimiter = (req, res, next) => {
  const badge = req.body?.badge?.toUpperCase();

  if (!badge) {
    return next();
  }

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Get or create badge attempt tracking
  let attempts = badgeAttempts.get(badge);

  if (!attempts || now - attempts.resetAt > oneHour) {
    // Reset attempts if expired or doesn't exist
    attempts = {
      count: 0,
      resetAt: now + oneHour,
      blockedUntil: 0
    };
    badgeAttempts.set(badge, attempts);
  }

  // Check if badge is currently blocked
  if (attempts.blockedUntil > now) {
    const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000 / 60);

    logger.security('BADGE_BLOCKED', {
      badge,
      remainingMinutes: remainingTime,
    }, req);

    return res.status(429).json({
      success: false,
      error: `This badge is temporarily blocked. Please try again in ${remainingTime} minutes.`,
      code: 'BADGE_BLOCKED',
      retryAfter: remainingTime * 60
    });
  }

  // Check if attempts exceeded
  if (attempts.count >= 3) {
    // Block for 1 hour
    attempts.blockedUntil = now + oneHour;
    badgeAttempts.set(badge, attempts);

    logger.security('BADGE_LIMIT_EXCEEDED', {
      badge,
      attempts: attempts.count,
    }, req);

    return res.status(429).json({
      success: false,
      error: 'Too many failed login attempts for this badge. Please try again in 60 minutes.',
      code: 'BADGE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }

  // Attach badge attempt tracking to response for downstream middleware
  res.locals.badgeAttempts = attempts;
  res.locals.badge = badge;

  next();
};

/**
 * Increment failed badge attempts (call after failed login)
 */
export const incrementBadgeAttempts = (badge) => {
  const attempts = badgeAttempts.get(badge);
  if (attempts) {
    attempts.count++;
    badgeAttempts.set(badge, attempts);

    logger.security('BADGE_FAILED_ATTEMPT', {
      badge,
      count: attempts.count,
      remaining: 3 - attempts.count,
    });
  }
};

/**
 * Clear badge attempts (call after successful login)
 */
export const clearBadgeAttempts = (badge) => {
  if (badgeAttempts.has(badge)) {
    badgeAttempts.delete(badge);
    logger.auth('BADGE_ATTEMPTS_CLEARED', badge, true);
  }
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/**
 * Token refresh rate limiter
 * 10 refreshes per hour per IP
 */
export const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per window
  message: 'Too many token refresh requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/**
 * Password change rate limiter
 * 3 attempts per hour per IP
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: 'Too many password change attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/**
 * Get badge attempts (for debugging/monitoring)
 */
export const getBadgeAttempts = (badge) => {
  return badgeAttempts.get(badge?.toUpperCase());
};

/**
 * Clear all badge attempts (for admin use)
 */
export const clearAllBadgeAttempts = () => {
  const count = badgeAttempts.size;
  badgeAttempts.clear();
  logger.auth('ALL_BADGE_ATTEMPTS_CLEARED', 'ADMIN', true);
  return count;
};

export default {
  strictLoginLimiter,
  badgeLimiter,
  incrementBadgeAttempts,
  clearBadgeAttempts,
  apiLimiter,
  refreshLimiter,
  passwordChangeLimiter,
  getBadgeAttempts,
  clearAllBadgeAttempts
};
