/**
 * Token Blacklist Service
 * Manages invalidated tokens (for logout functionality)
 * Uses in-memory Map with automatic cleanup
 * Can be extended to use Redis for production
 */
import logger from './logger.js';

/**
 * In-memory token blacklist
 * Key: token hash, Value: { addedAt, expiresAt, badge }
 */
const blacklist = new Map();

/**
 * Hash a token for storage (simple hash for demo - use crypto in production)
 * @param {string} token JWT token
 * @returns {string} Hashed token
 */
function hashToken(token) {
  // Simple hash using base64 encoding of a portion
  // In production, use crypto.createHash('sha256').update(token).digest('hex')
  return Buffer.from(token.substring(token.length - 50)).toString('base64');
}

/**
 * Add a token to the blacklist
 * @param {string} token JWT token
 * @param {number} expiresAt Expiration timestamp
 * @param {string} badge Supervisor badge
 */
export function addToBlacklist(token, expiresAt, badge = 'unknown') {
  const hash = hashToken(token);
  const addedAt = Date.now();

  blacklist.set(hash, {
    addedAt,
    expiresAt,
    badge,
  });

  logger.security('TOKEN_BLACKLISTED', {
    badge,
    expiresIn: Math.ceil((expiresAt - addedAt) / 1000),
  });

  // Schedule cleanup for this token
  const ttl = expiresAt - addedAt;
  if (ttl > 0) {
    setTimeout(() => {
      blacklist.delete(hash);
      logger.debug(`TOKEN_EXPIRED_REMOVED: ${hash.substring(0, 10)}...`);
    }, ttl);
  }
}

/**
 * Check if a token is blacklisted
 * @param {string} token JWT token
 * @returns {boolean} True if blacklisted
 */
export function isBlacklisted(token) {
  const hash = hashToken(token);
  const entry = blacklist.get(hash);

  if (!entry) {
    return false;
  }

  // Check if the entry has expired
  if (Date.now() >= entry.expiresAt) {
    blacklist.delete(hash);
    return false;
  }

  return true;
}

/**
 * Remove a token from the blacklist
 * @param {string} token JWT token
 */
export function removeFromBlacklist(token) {
  const hash = hashToken(token);
  const existed = blacklist.delete(hash);

  if (existed) {
    logger.debug(`TOKEN_REMOVED_FROM_BLACKLIST: ${hash.substring(0, 10)}...`);
  }

  return existed;
}

/**
 * Clean up expired tokens from blacklist
 * Should be called periodically
 */
export function cleanupExpiredTokens() {
  const now = Date.now();
  let removed = 0;

  for (const [hash, entry] of blacklist.entries()) {
    if (now >= entry.expiresAt) {
      blacklist.delete(hash);
      removed++;
    }
  }

  if (removed > 0) {
    logger.debug(`BLACKLIST_CLEANUP: Removed ${removed} expired tokens`);
  }

  return removed;
}

/**
 * Get blacklist statistics
 * @returns {Object} Statistics
 */
export function getStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const entry of blacklist.values()) {
    if (now < entry.expiresAt) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: blacklist.size,
    active,
    expired,
  };
}

/**
 * Clear entire blacklist (for testing or admin use)
 */
export function clearBlacklist() {
  const count = blacklist.size;
  blacklist.clear();
  logger.security('BLACKLIST_CLEARED', { count });
  return count;
}

/**
 * Get all blacklisted badges (for monitoring)
 * @returns {Array<string>} Array of badges
 */
export function getBlacklistedBadges() {
  const badges = new Set();
  const now = Date.now();

  for (const entry of blacklist.values()) {
    if (now < entry.expiresAt) {
      badges.add(entry.badge);
    }
  }

  return Array.from(badges);
}

// Run cleanup every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);

logger.info('Token blacklist service initialized');

// Export for Redis integration in future
export const TokenBlacklist = {
  add: addToBlacklist,
  isBlacklisted,
  remove: removeFromBlacklist,
  cleanup: cleanupExpiredTokens,
  getStats,
  clear: clearBlacklist,
  getBlacklistedBadges,
};

export default TokenBlacklist;
