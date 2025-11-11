-- Migration: Fix Session Uniqueness Constraint
-- Description: Ensures only one active session per supervisor
-- Created: 2025-11-11
-- Purpose: Prevent duplicate active sessions (security fix)

-- Step 1: Drop existing weak constraint
ALTER TABLE supervisor_sessions
  DROP INDEX IF EXISTS uq_email;

-- Step 2: Add proper uniqueness constraint for active sessions
-- This ensures only one row per supervisor where is_online = TRUE
CREATE UNIQUE INDEX uq_active_session
  ON supervisor_sessions (supervisor_id, is_online)
  WHERE is_online = TRUE;

-- Note: The above syntax is for MySQL 8.0.16+
-- For older MySQL versions, use this workaround:
ALTER TABLE supervisor_sessions
  ADD COLUMN active_session_id VARCHAR(100) GENERATED ALWAYS AS (
    CASE WHEN is_online = TRUE THEN CONCAT(supervisor_id, '_active') ELSE NULL END
  ) STORED,
  ADD UNIQUE INDEX uq_active_session_alt (active_session_id);

-- Step 3: Create stored procedure to safely start new session
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS start_supervisor_session(
  IN p_supervisor_id INT,
  IN p_supervisor_name VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_badge_number VARCHAR(20),
  IN p_duty VARCHAR(20),
  IN p_depot VARCHAR(100),
  IN p_role VARCHAR(50)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to start session';
  END;

  START TRANSACTION;

  -- Close any existing active session
  UPDATE supervisor_sessions
  SET
    is_online = FALSE,
    logout_time = NOW(),
    session_duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW())
  WHERE supervisor_id = p_supervisor_id
    AND is_online = TRUE;

  -- Create new session
  INSERT INTO supervisor_sessions (
    supervisor_id,
    supervisor_name,
    email,
    badge_number,
    current_duty,
    depot,
    role,
    login_time,
    last_activity,
    is_online
  ) VALUES (
    p_supervisor_id,
    p_supervisor_name,
    p_email,
    p_badge_number,
    p_duty,
    p_depot,
    p_role,
    NOW(),
    NOW(),
    TRUE
  );

  COMMIT;
END$$

DELIMITER ;

-- Step 4: Add audit table for tracking multiple login attempts
CREATE TABLE IF NOT EXISTS supervisor_session_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id INT NOT NULL,
  event_type ENUM('login', 'logout', 'duplicate_login_prevented', 'session_expired') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  previous_session_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for supervisor session events';

-- Verification
-- SELECT * FROM supervisor_sessions WHERE is_online = TRUE GROUP BY supervisor_id HAVING COUNT(*) > 1;
-- Should return 0 rows if constraint is working