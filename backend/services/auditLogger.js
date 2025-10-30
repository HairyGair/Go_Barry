/**
 * Audit Logger Service
 * Logs security events to database for compliance and monitoring
 * Events: login attempts, token refreshes, logout, suspicious activity
 */
import database from './database.js';
import logger from './logger.js';

/**
 * Event types for audit logging
 */
export const AuditEventType = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  TOKEN_REFRESH_FAILURE: 'token_refresh_failure',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_CHANGE_FAILURE: 'password_change_failure',
  BADGE_ENUMERATION: 'badge_enumeration',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  TOKEN_BLACKLISTED: 'token_blacklisted',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
};

/**
 * Initialize audit logs table if it doesn't exist
 */
async function initializeAuditTable() {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        badge VARCHAR(10),
        supervisor_id INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_badge (badge),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await database.query(createTableSQL);
    logger.info('Audit logs table initialized');
    return true;
  } catch (err) {
    logger.error('Failed to initialize audit logs table:', err);
    return false;
  }
}

/**
 * Log an audit event to database
 * @param {Object} event Event details
 * @param {string} event.type Event type from AuditEventType
 * @param {string} event.badge Supervisor badge
 * @param {number} event.supervisorId Supervisor ID
 * @param {string} event.ipAddress IP address
 * @param {string} event.userAgent User agent string
 * @param {boolean} event.success Success status
 * @param {Object} event.details Additional details (stored as JSON)
 * @returns {Promise<number>} Audit log ID
 */
export async function logAuditEvent(event) {
  try {
    const {
      type,
      badge = null,
      supervisorId = null,
      ipAddress = null,
      userAgent = null,
      success,
      details = {}
    } = event;

    // Validate required fields
    if (!type || success === undefined) {
      logger.error('Invalid audit event - missing required fields', { event });
      return null;
    }

    // Insert audit log
    const sql = `
      INSERT INTO audit_logs
      (event_type, badge, supervisor_id, ip_address, user_agent, success, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      type,
      badge,
      supervisorId,
      ipAddress,
      userAgent,
      success,
      JSON.stringify(details)
    ];

    const result = await database.query(sql, params);

    logger.database('AUDIT_LOG_CREATED', {
      id: result.insertId,
      type,
      badge,
      success
    });

    return result.insertId;
  } catch (err) {
    logger.error('Failed to log audit event:', err);
    return null;
  }
}

/**
 * Log login attempt
 * @param {string} badge Supervisor badge
 * @param {boolean} success Success status
 * @param {Object} req Express request object
 * @param {number} supervisorId Supervisor ID (if successful)
 * @param {string} failureReason Reason for failure
 */
export async function logLoginAttempt(badge, success, req, supervisorId = null, failureReason = null) {
  return await logAuditEvent({
    type: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE,
    badge,
    supervisorId,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    success,
    details: {
      failureReason,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log logout event
 * @param {string} badge Supervisor badge
 * @param {number} supervisorId Supervisor ID
 * @param {Object} req Express request object
 */
export async function logLogout(badge, supervisorId, req) {
  return await logAuditEvent({
    type: AuditEventType.LOGOUT,
    badge,
    supervisorId,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true,
    details: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log token refresh
 * @param {string} badge Supervisor badge
 * @param {number} supervisorId Supervisor ID
 * @param {boolean} success Success status
 * @param {Object} req Express request object
 */
export async function logTokenRefresh(badge, supervisorId, success, req) {
  return await logAuditEvent({
    type: success ? AuditEventType.TOKEN_REFRESH : AuditEventType.TOKEN_REFRESH_FAILURE,
    badge,
    supervisorId,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    success,
    details: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log suspicious activity
 * @param {string} activityType Type of suspicious activity
 * @param {Object} details Activity details
 * @param {Object} req Express request object
 */
export async function logSuspiciousActivity(activityType, details, req) {
  return await logAuditEvent({
    type: AuditEventType.SUSPICIOUS_ACTIVITY,
    badge: details.badge || null,
    supervisorId: null,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    success: false,
    details: {
      activityType,
      ...details,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Get recent audit logs
 * @param {Object} options Query options
 * @param {number} options.limit Number of records to return
 * @param {string} options.badge Filter by badge
 * @param {string} options.eventType Filter by event type
 * @param {number} options.hours Number of hours to look back
 * @returns {Promise<Array>} Audit logs
 */
export async function getAuditLogs(options = {}) {
  try {
    const {
      limit = 100,
      badge = null,
      eventType = null,
      hours = 24
    } = options;

    let sql = `
      SELECT
        id, event_type, badge, supervisor_id, ip_address,
        user_agent, success, details, created_at
      FROM audit_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;

    const params = [hours];

    if (badge) {
      sql += ' AND badge = ?';
      params.push(badge);
    }

    if (eventType) {
      sql += ' AND event_type = ?';
      params.push(eventType);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const results = await database.query(sql, params);

    // Parse JSON details
    return results.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));
  } catch (err) {
    logger.error('Failed to get audit logs:', err);
    return [];
  }
}

/**
 * Get failed login attempts for a badge
 * @param {string} badge Supervisor badge
 * @param {number} hours Number of hours to look back
 * @returns {Promise<number>} Count of failed attempts
 */
export async function getFailedLoginCount(badge, hours = 1) {
  try {
    const sql = `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE badge = ?
        AND event_type = ?
        AND success = FALSE
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;

    const results = await database.query(sql, [badge, AuditEventType.LOGIN_FAILURE, hours]);
    return results[0]?.count || 0;
  } catch (err) {
    logger.error('Failed to get failed login count:', err);
    return 0;
  }
}

/**
 * Detect badge enumeration attempts
 * Multiple failed logins with different badges from same IP
 * @param {string} ipAddress IP address to check
 * @param {number} minutes Number of minutes to look back
 * @returns {Promise<boolean>} True if enumeration detected
 */
export async function detectBadgeEnumeration(ipAddress, minutes = 10) {
  try {
    const sql = `
      SELECT COUNT(DISTINCT badge) as unique_badges, COUNT(*) as attempts
      FROM audit_logs
      WHERE ip_address = ?
        AND event_type = ?
        AND success = FALSE
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `;

    const results = await database.query(sql, [ipAddress, AuditEventType.LOGIN_FAILURE, minutes]);
    const { unique_badges, attempts } = results[0] || {};

    // Flag if more than 3 different badges tried from same IP
    const isEnumeration = unique_badges >= 3 && attempts >= 5;

    if (isEnumeration) {
      logger.security('BADGE_ENUMERATION_DETECTED', {
        ipAddress,
        uniqueBadges: unique_badges,
        attempts
      });
    }

    return isEnumeration;
  } catch (err) {
    logger.error('Failed to detect badge enumeration:', err);
    return false;
  }
}

/**
 * Clean up old audit logs (keep last 90 days)
 * @param {number} days Number of days to retain
 * @returns {Promise<number>} Number of deleted records
 */
export async function cleanupOldLogs(days = 90) {
  try {
    const sql = `
      DELETE FROM audit_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await database.query(sql, [days]);

    logger.info(`Cleaned up ${result.affectedRows} old audit logs`);
    return result.affectedRows;
  } catch (err) {
    logger.error('Failed to cleanup old audit logs:', err);
    return 0;
  }
}

// Initialize table on module load
initializeAuditTable();

// Schedule daily cleanup at midnight
const scheduleCleanup = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Tomorrow
    0, 0, 0 // At midnight
  );
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOldLogs(90);
    // Schedule next cleanup
    setInterval(() => cleanupOldLogs(90), 24 * 60 * 60 * 1000); // Daily
  }, msToMidnight);
};

scheduleCleanup();

export default {
  AuditEventType,
  logAuditEvent,
  logLoginAttempt,
  logLogout,
  logTokenRefresh,
  logSuspiciousActivity,
  getAuditLogs,
  getFailedLoginCount,
  detectBadgeEnumeration,
  cleanupOldLogs,
  initializeAuditTable
};
