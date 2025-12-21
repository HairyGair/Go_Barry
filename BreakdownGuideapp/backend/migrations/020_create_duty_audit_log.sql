-- Migration: Create Duty Audit Log Table
-- Phase 9.2: Comprehensive duty action logging for compliance
-- Created: 2025-12-20
-- MySQL Compatible

-- =====================================================
-- Step 1: Create the duty_audit_log table
-- =====================================================

CREATE TABLE IF NOT EXISTS duty_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Who performed the action
  supervisor_id CHAR(36) NOT NULL COMMENT 'UUID of the supervisor',
  supervisor_badge VARCHAR(50) NOT NULL COMMENT 'Badge number for quick lookup',
  supervisor_name VARCHAR(255) NOT NULL COMMENT 'Name at time of action',
  supervisor_depot VARCHAR(50) COMMENT 'Depot at time of action',

  -- What action was performed
  action_type ENUM(
    'DUTY_START',           -- Supervisor started a duty shift
    'DUTY_END',             -- Supervisor ended their shift
    'DUTY_EXTEND',          -- Shift was extended
    'DUTY_CHANGE',          -- Changed from one duty to another
    'DUTY_SKIP',            -- Skipped duty selection (view-only)
    'HANDOVER_INITIATED',   -- Started a handover process
    'HANDOVER_COMPLETED',   -- Completed handover to another supervisor
    'HANDOVER_RECEIVED',    -- Received handover from another supervisor
    'HANDOVER_REJECTED',    -- Rejected incoming handover
    'OVERTIME_START',       -- Entered overtime status
    'OVERTIME_ALERT',       -- Triggered overtime alert (30+ min)
    'BREAK_START',          -- Started a break (future)
    'BREAK_END',            -- Ended a break (future)
    'FORCE_ASSIGN',         -- Admin force-assigned duty
    'FORCE_END',            -- Admin force-ended duty
    'SESSION_TIMEOUT',      -- Session expired during duty
    'NOTE_ADDED',           -- Added a duty note
    'EXTENSION_REQUESTED',  -- Requested shift extension (future)
    'EXTENSION_APPROVED',   -- Extension approved by admin (future)
    'EXTENSION_DENIED'      -- Extension denied by admin (future)
  ) NOT NULL COMMENT 'Type of duty action performed',

  -- Context of the action
  duty_code VARCHAR(10) COMMENT 'Duty code (100/200/400/500)',
  duty_name VARCHAR(100) COMMENT 'Duty name (Early/Day/Late/Night Shift)',
  previous_duty_code VARCHAR(10) COMMENT 'Previous duty (for changes)',

  -- Timing information
  shift_start_time TIME COMMENT 'Scheduled shift start',
  shift_end_time TIME COMMENT 'Scheduled shift end',
  actual_start_time DATETIME COMMENT 'Actual start time',
  actual_end_time DATETIME COMMENT 'Actual end time (if ended)',
  overtime_minutes INT DEFAULT 0 COMMENT 'Minutes of overtime',

  -- Related entities
  related_supervisor_id CHAR(36) COMMENT 'Other supervisor (for handovers)',
  related_supervisor_badge VARCHAR(50) COMMENT 'Other supervisor badge',
  related_breakdown_ids TEXT COMMENT 'JSON array of breakdown IDs (for handovers)',

  -- Additional context
  ip_address VARCHAR(45) COMMENT 'IP address of request',
  user_agent TEXT COMMENT 'Browser/device info',
  notes TEXT COMMENT 'Additional notes or reason',
  metadata JSON COMMENT 'Additional structured data',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common queries
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_action_type (action_type),
  INDEX idx_duty_code (duty_code),
  INDEX idx_created_at (created_at),
  INDEX idx_depot (supervisor_depot),
  INDEX idx_date_range (created_at, action_type),
  INDEX idx_supervisor_date (supervisor_badge, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comprehensive audit trail for all duty-related actions';


-- =====================================================
-- Step 2: Create view for recent audit entries
-- =====================================================

CREATE OR REPLACE VIEW v_recent_duty_audit AS
SELECT
  dal.id,
  dal.supervisor_badge,
  dal.supervisor_name,
  dal.supervisor_depot,
  dal.action_type,
  dal.duty_code,
  dal.duty_name,
  dal.overtime_minutes,
  dal.notes,
  dal.created_at,
  TIMESTAMPDIFF(MINUTE, dal.created_at, NOW()) as minutes_ago
FROM duty_audit_log dal
WHERE dal.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY dal.created_at DESC;


-- =====================================================
-- Step 3: Create view for supervisor duty history
-- =====================================================

CREATE OR REPLACE VIEW v_supervisor_duty_history AS
SELECT
  dal.supervisor_badge,
  dal.supervisor_name,
  DATE(dal.created_at) as duty_date,
  MIN(CASE WHEN dal.action_type = 'DUTY_START' THEN dal.created_at END) as first_start,
  MAX(CASE WHEN dal.action_type = 'DUTY_END' THEN dal.created_at END) as last_end,
  GROUP_CONCAT(DISTINCT dal.duty_code ORDER BY dal.created_at) as duties_worked,
  SUM(CASE WHEN dal.action_type = 'DUTY_START' THEN 1 ELSE 0 END) as shift_starts,
  SUM(CASE WHEN dal.action_type = 'DUTY_END' THEN 1 ELSE 0 END) as shift_ends,
  SUM(CASE WHEN dal.action_type = 'DUTY_EXTEND' THEN 1 ELSE 0 END) as extensions,
  SUM(CASE WHEN dal.action_type = 'HANDOVER_COMPLETED' THEN 1 ELSE 0 END) as handovers_out,
  SUM(CASE WHEN dal.action_type = 'HANDOVER_RECEIVED' THEN 1 ELSE 0 END) as handovers_in,
  SUM(dal.overtime_minutes) as total_overtime_minutes
FROM duty_audit_log dal
GROUP BY dal.supervisor_badge, dal.supervisor_name, DATE(dal.created_at)
ORDER BY duty_date DESC, dal.supervisor_name;


-- =====================================================
-- Step 4: Create view for daily duty summary
-- =====================================================

CREATE OR REPLACE VIEW v_daily_duty_summary AS
SELECT
  DATE(dal.created_at) as audit_date,
  COUNT(DISTINCT dal.supervisor_badge) as unique_supervisors,
  SUM(CASE WHEN dal.action_type = 'DUTY_START' THEN 1 ELSE 0 END) as total_starts,
  SUM(CASE WHEN dal.action_type = 'DUTY_END' THEN 1 ELSE 0 END) as total_ends,
  SUM(CASE WHEN dal.action_type = 'DUTY_EXTEND' THEN 1 ELSE 0 END) as total_extensions,
  SUM(CASE WHEN dal.action_type = 'OVERTIME_START' THEN 1 ELSE 0 END) as overtime_occurrences,
  SUM(CASE WHEN dal.action_type = 'HANDOVER_COMPLETED' THEN 1 ELSE 0 END) as total_handovers,
  SUM(CASE WHEN dal.action_type = 'DUTY_SKIP' THEN 1 ELSE 0 END) as view_only_logins,
  SUM(dal.overtime_minutes) as total_overtime_minutes,
  COUNT(CASE WHEN dal.duty_code = '100' THEN 1 END) as duty_100_events,
  COUNT(CASE WHEN dal.duty_code = '200' THEN 1 END) as duty_200_events,
  COUNT(CASE WHEN dal.duty_code = '400' THEN 1 END) as duty_400_events,
  COUNT(CASE WHEN dal.duty_code = '500' THEN 1 END) as duty_500_events
FROM duty_audit_log dal
GROUP BY DATE(dal.created_at)
ORDER BY audit_date DESC;


-- =====================================================
-- Step 5: Create view for overtime tracking
-- =====================================================

CREATE OR REPLACE VIEW v_overtime_report AS
SELECT
  dal.supervisor_badge,
  dal.supervisor_name,
  dal.supervisor_depot,
  dal.duty_code,
  dal.duty_name,
  dal.overtime_minutes,
  dal.shift_start_time,
  dal.shift_end_time,
  dal.actual_end_time,
  dal.notes,
  dal.created_at as overtime_logged_at
FROM duty_audit_log dal
WHERE dal.action_type IN ('OVERTIME_START', 'OVERTIME_ALERT', 'DUTY_END')
  AND dal.overtime_minutes > 0
ORDER BY dal.created_at DESC;


-- =====================================================
-- Verification queries (run manually after migration)
-- =====================================================

-- DESCRIBE duty_audit_log;
-- SELECT * FROM v_recent_duty_audit LIMIT 10;
-- SELECT * FROM v_daily_duty_summary LIMIT 7;
