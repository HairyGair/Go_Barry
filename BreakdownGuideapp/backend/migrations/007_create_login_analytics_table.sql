/**
 * Migration: Create login_analytics table
 *
 * Purpose: Track all login attempts and sessions for security and analytics
 *
 * Features:
 * - Records every login attempt (success and failure)
 * - Captures IP address and user agent for security
 * - Tracks session duration for usage analytics
 * - Indexes for fast querying by email, time, and success status
 *
 * Usage:
 * - POST /api/analytics/log-login - Called on every login attempt
 * - POST /api/analytics/log-logout - Updates session duration on logout
 * - GET /api/analytics/dashboard - Admin dashboard with login statistics
 * - GET /api/analytics/failed-logins - Security monitoring for failed attempts
 *
 * Created: 2025-11-02
 * Author: Anthony Gair
 */

-- Create login_analytics table
CREATE TABLE IF NOT EXISTS login_analytics (
    -- Primary key
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- User identification
    email VARCHAR(255) NOT NULL,

    -- Login attempt details
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL DEFAULT FALSE,

    -- Security tracking
    ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 address',
    user_agent TEXT NULL COMMENT 'Browser/device user agent string',

    -- Session tracking
    session_duration INT NULL COMMENT 'Session duration in minutes (NULL if still active)',
    logout_time DATETIME NULL COMMENT 'When user logged out (NULL if still active)',

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_login_time (login_time),
    INDEX idx_success (success),
    INDEX idx_email_time (email, login_time),
    INDEX idx_success_time (success, login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Login analytics and security tracking';

-- Verify table creation
SELECT 'login_analytics table created successfully' AS status;

-- Show table structure
DESCRIBE login_analytics;

/**
 * Sample Queries for Testing
 */

-- Count total login attempts
-- SELECT COUNT(*) as total_attempts FROM login_analytics;

-- Count successful vs failed logins
-- SELECT
--   success,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM login_analytics), 2) as percentage
-- FROM login_analytics
-- GROUP BY success;

-- Recent login attempts
-- SELECT
--   email,
--   login_time,
--   success,
--   ip_address,
--   session_duration
-- FROM login_analytics
-- ORDER BY login_time DESC
-- LIMIT 10;

-- Failed login attempts (security monitoring)
-- SELECT
--   email,
--   login_time,
--   ip_address,
--   user_agent
-- FROM login_analytics
-- WHERE success = FALSE
-- ORDER BY login_time DESC
-- LIMIT 20;

-- Average session duration by user
-- SELECT
--   email,
--   COUNT(*) as login_count,
--   ROUND(AVG(session_duration), 2) as avg_session_minutes,
--   MAX(login_time) as last_login
-- FROM login_analytics
-- WHERE success = TRUE AND session_duration IS NOT NULL
-- GROUP BY email
-- ORDER BY login_count DESC;

-- Hourly login distribution
-- SELECT
--   HOUR(login_time) as hour,
--   COUNT(*) as login_count,
--   SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful,
--   SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed
-- FROM login_analytics
-- GROUP BY HOUR(login_time)
-- ORDER BY hour;
