/**
 * Token Manager Utility
 * Handles JWT token operations without external dependencies
 * Provides token parsing, validation, and expiry checking
 */

/**
 * Decode a JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function parseJWT(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error parsing JWT:', error.message);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('❌ Error checking token expiry:', error.message);
    return true;
  }
}

/**
 * Check if token will expire soon
 * @param {string} token - JWT token to check
 * @param {number} minutesThreshold - Minutes before expiry to trigger warning (default: 5)
 * @returns {boolean} True if token expires within threshold
 */
export function willExpireSoon(token, minutesThreshold = 5) {
  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdSeconds = minutesThreshold * 60;
    const timeUntilExpiry = decoded.exp - currentTime;

    return timeUntilExpiry <= thresholdSeconds;
  } catch (error) {
    console.error('❌ Error checking token expiry threshold:', error.message);
    return true;
  }
}

/**
 * Get token expiry timestamp
 * @param {string} token - JWT token
 * @returns {number|null} Expiry timestamp in milliseconds or null
 */
export function getTokenExpiry(token) {
  try {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    // Convert exp (seconds) to milliseconds
    return decoded.exp * 1000;
  } catch (error) {
    console.error('❌ Error getting token expiry:', error.message);
    return null;
  }
}

/**
 * Get time remaining until token expires
 * @param {string} token - JWT token
 * @returns {number|null} Milliseconds until expiry or null
 */
export function getTimeUntilExpiry(token) {
  try {
    const expiryTime = getTokenExpiry(token);
    if (!expiryTime) {
      return null;
    }

    const remaining = expiryTime - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('❌ Error calculating time until expiry:', error.message);
    return null;
  }
}

/**
 * Get human-readable time until token expires
 * @param {string} token - JWT token
 * @returns {string|null} Human-readable time string or null
 */
export function getTimeUntilExpiryFormatted(token) {
  try {
    const remaining = getTimeUntilExpiry(token);
    if (remaining === null) {
      return null;
    }

    if (remaining <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  } catch (error) {
    console.error('❌ Error formatting expiry time:', error.message);
    return null;
  }
}

/**
 * Validate token format
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token format is valid
 */
export function isValidTokenFormat(token) {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Try to parse the payload
    const decoded = parseJWT(token);
    return decoded !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get token metadata
 * @param {string} token - JWT token
 * @returns {object|null} Token metadata including expiry, time remaining, etc.
 */
export function getTokenMetadata(token) {
  try {
    const decoded = parseJWT(token);
    if (!decoded) {
      return null;
    }

    const expiryTime = getTokenExpiry(token);
    const timeRemaining = getTimeUntilExpiry(token);
    const expired = isTokenExpired(token);
    const expiringSoon = willExpireSoon(token, 5);

    return {
      payload: decoded,
      expiryTime,
      timeRemaining,
      expired,
      expiringSoon,
      issuedAt: decoded.iat ? decoded.iat * 1000 : null,
      userId: decoded.id,
      userBadge: decoded.badge,
      userName: decoded.name,
      userRole: decoded.role,
    };
  } catch (error) {
    console.error('❌ Error getting token metadata:', error.message);
    return null;
  }
}

export default {
  parseJWT,
  isTokenExpired,
  willExpireSoon,
  getTokenExpiry,
  getTimeUntilExpiry,
  getTimeUntilExpiryFormatted,
  isValidTokenFormat,
  getTokenMetadata,
};
