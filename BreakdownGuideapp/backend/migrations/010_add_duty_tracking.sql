-- Migration: Add Duty Selection and Supervisor Session Tracking
-- Description: Adds duty tracking columns to supervisors table and creates supervisor_sessions table
-- Created: 2025-11-11
-- Purpose: Support mandatory duty selection, session persistence, and live supervisor tracking

-- Step 1: Add duty tracking columns to supervisors table
ALTER TABLE supervisors
  ADD COLUMN IF NOT EXISTS current_duty VARCHAR(20) DEFAULT NULL COMMENT 'Current active duty (Duty 100/200/400/500)',
  ADD COLUMN IF NOT EXISTS duty_start_time DATETIME DEFAULT NULL COMMENT 'When current duty shift started',
  ADD COLUMN IF NOT EXISTS duty_end_time DATETIME DEFAULT NULL COMMENT 'When current duty shift ends',
  ADD COLUMN IF NOT EXISTS duty_locked_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When duty was locked (prevents changes)',
  ADD COLUMN IF NOT EXISTS duty_locked_by VARCHAR(255) DEFAULT NULL COMMENT 'Admin who locked the duty';

-- Step 2: Add indexes for performance
ALTER TABLE supervisors
  ADD INDEX IF NOT EXISTS idx_current_duty (current_duty),
  ADD INDEX IF NOT EXISTS idx_duty_times (duty_start_time, duty_end_time);

-- Step 3: Create supervisor_sessions table for real-time tracking
CREATE TABLE IF NOT EXISTS supervisor_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id INT NOT NULL COMMENT 'Foreign key to supervisors.id',
  supervisor_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  badge_number VARCHAR(20) NOT NULL,
  current_duty VARCHAR(20) DEFAULT NULL COMMENT 'Current duty (Duty 100/200/400/500)',
  duty_start_time DATETIME DEFAULT NULL,
  duty_end_time DATETIME DEFAULT NULL,
  depot VARCHAR(100) DEFAULT NULL,
  role VARCHAR(50) DEFAULT 'supervisor',
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When supervisor logged in',
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last API activity',
  is_online BOOLEAN DEFAULT TRUE COMMENT 'Is supervisor currently online',
  logout_time TIMESTAMP NULL DEFAULT NULL COMMENT 'When supervisor logged out',
  session_duration_minutes INT DEFAULT NULL COMMENT 'Total session duration (filled on logout)',

  -- Constraints
  UNIQUE KEY uq_email (email),
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,

  -- Indexes for performance
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_online (is_online),
  INDEX idx_duty (current_duty),
  INDEX idx_depot (depot),
  INDEX idx_last_activity (last_activity),
  INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Live supervisor session tracking for Control Room Display';

-- Step 4: Create supervisor_shift_history table if it doesn't exist (for duty manager)
CREATE TABLE IF NOT EXISTS supervisor_shift_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id INT NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_badge VARCHAR(20) DEFAULT NULL,
  duty VARCHAR(20) NOT NULL COMMENT 'Duty code (Duty 100/200/400/500)',
  shift_start DATETIME NOT NULL COMMENT 'When shift started',
  shift_end DATETIME DEFAULT NULL COMMENT 'When shift ended',
  breakdowns_handled INT DEFAULT 0 COMMENT 'Breakdowns created during shift',
  assessments_completed INT DEFAULT 0 COMMENT 'Assessments completed during shift',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,

  -- Indexes
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_duty (duty),
  INDEX idx_shift_times (shift_start, shift_end),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historical record of supervisor duty shifts for reporting';

-- Step 5: Create view for active supervisors (for Control Room)
CREATE OR REPLACE VIEW v_active_supervisors AS
SELECT
  s.id,
  s.name,
  s.email,
  s.badge_number,
  s.depot,
  s.role,
  s.current_duty,
  s.duty_start_time,
  s.duty_end_time,
  ss.login_time,
  ss.last_activity,
  ss.is_online,
  TIMESTAMPDIFF(MINUTE, ss.login_time, NOW()) as session_duration_minutes,
  TIMESTAMPDIFF(MINUTE, NOW(), s.duty_end_time) as duty_minutes_remaining
FROM supervisors s
LEFT JOIN supervisor_sessions ss ON s.id = ss.supervisor_id
WHERE ss.is_online = TRUE
  AND s.current_duty IS NOT NULL
ORDER BY s.depot, s.name;

-- Verification queries (commented out - run manually to verify)
-- SELECT COUNT(*) as active_supervisors FROM v_active_supervisors;
-- SELECT * FROM supervisors WHERE current_duty IS NOT NULL;
-- SELECT * FROM supervisor_sessions WHERE is_online = TRUE;
-- SHOW COLUMNS FROM supervisors LIKE '%duty%';
-- SHOW CREATE TABLE supervisor_sessions;
