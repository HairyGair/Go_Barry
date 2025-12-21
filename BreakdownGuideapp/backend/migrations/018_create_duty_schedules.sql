-- Migration: Create Duty Schedules Table for Admin Management
-- Description: Enables admins to pre-assign duty shifts to supervisors
-- Created: 2025-12-20
-- Phase 5.1: Duty Schedule Management

-- Step 1: Create duty_schedules table for planned/assigned shifts
-- NOTE: supervisor_id uses CHAR(36) to match supervisors.id (UUID format)
CREATE TABLE IF NOT EXISTS duty_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id CHAR(36) NOT NULL COMMENT 'Assigned supervisor (UUID)',
  supervisor_name VARCHAR(255) NOT NULL COMMENT 'Cached supervisor name',
  supervisor_badge VARCHAR(50) DEFAULT NULL COMMENT 'Cached badge number',

  -- Schedule details
  duty_code VARCHAR(20) NOT NULL COMMENT 'Duty code (100/200/400/500 or custom)',
  duty_name VARCHAR(100) DEFAULT NULL COMMENT 'Custom name or standard shift name',
  schedule_date DATE NOT NULL COMMENT 'Date of the scheduled shift',
  start_time TIME NOT NULL COMMENT 'Shift start time',
  end_time TIME NOT NULL COMMENT 'Shift end time',

  -- Status tracking
  status ENUM('scheduled', 'confirmed', 'active', 'completed', 'cancelled', 'no_show')
    DEFAULT 'scheduled' COMMENT 'Current status of the schedule',
  confirmed_at DATETIME DEFAULT NULL COMMENT 'When supervisor confirmed the shift',
  started_at DATETIME DEFAULT NULL COMMENT 'When shift actually started',
  ended_at DATETIME DEFAULT NULL COMMENT 'When shift actually ended',

  -- Admin tracking
  assigned_by CHAR(36) DEFAULT NULL COMMENT 'Admin who created the assignment (UUID)',
  assigned_by_name VARCHAR(255) DEFAULT NULL COMMENT 'Admin name',
  notes TEXT DEFAULT NULL COMMENT 'Admin notes for this schedule',

  -- Metadata
  depot VARCHAR(100) DEFAULT NULL COMMENT 'Depot for this shift',
  is_override BOOLEAN DEFAULT FALSE COMMENT 'Was this an override of existing schedule',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints (foreign key to supervisors table with CHAR(36) UUID id)
  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE,

  -- Indexes for performance
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_schedule_date (schedule_date),
  INDEX idx_duty_code (duty_code),
  INDEX idx_status (status),
  INDEX idx_depot (depot),
  INDEX idx_date_status (schedule_date, status),

  -- Prevent duplicate assignments (same supervisor, same date, same duty)
  UNIQUE KEY uq_supervisor_date_duty (supervisor_id, schedule_date, duty_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pre-planned duty schedule assignments for supervisors';

-- Step 2: Create shift_templates table for custom shift patterns
CREATE TABLE IF NOT EXISTS shift_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT 'Template name (e.g., "Match Day Shift")',
  code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Short code for the template',
  description TEXT DEFAULT NULL COMMENT 'Description of when to use this template',

  -- Timing
  start_time TIME NOT NULL COMMENT 'Default start time',
  end_time TIME NOT NULL COMMENT 'Default end time',
  duration_minutes INT GENERATED ALWAYS AS (
    TIMESTAMPDIFF(MINUTE, start_time,
      CASE WHEN end_time < start_time
        THEN ADDTIME(end_time, '24:00:00')
        ELSE end_time
      END)
  ) STORED COMMENT 'Calculated shift duration',

  -- Styling
  color VARCHAR(20) DEFAULT '#6366f1' COMMENT 'Display color for UI',
  icon VARCHAR(10) DEFAULT '📋' COMMENT 'Display icon',

  -- Status
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Is template available for use',
  is_standard BOOLEAN DEFAULT FALSE COMMENT 'Is this a standard duty (100/200/400/500)',

  -- Metadata
  created_by INT DEFAULT NULL COMMENT 'Admin who created template',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Custom shift templates beyond standard duties';

-- Step 3: Insert standard duty templates
INSERT INTO shift_templates (name, code, start_time, end_time, color, icon, is_active, is_standard) VALUES
  ('Early Shift', '100', '06:00:00', '15:30:00', '#3b82f6', '🌅', TRUE, TRUE),
  ('Day Shift', '200', '07:30:00', '17:00:00', '#10b981', '☀️', TRUE, TRUE),
  ('Late Shift', '400', '12:30:00', '22:00:00', '#f59e0b', '🌆', TRUE, TRUE),
  ('Night Shift', '500', '14:45:00', '00:15:00', '#8b5cf6', '🌙', TRUE, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Step 4: Create view for upcoming schedules
CREATE OR REPLACE VIEW v_upcoming_schedules AS
SELECT
  ds.id,
  ds.supervisor_id,
  ds.supervisor_name,
  ds.supervisor_badge,
  ds.duty_code,
  ds.duty_name,
  ds.schedule_date,
  ds.start_time,
  ds.end_time,
  ds.status,
  ds.depot,
  ds.notes,
  ds.assigned_by_name,
  ds.created_at,
  st.color,
  st.icon,
  CASE
    WHEN ds.schedule_date = CURDATE() THEN 'today'
    WHEN ds.schedule_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'tomorrow'
    WHEN ds.schedule_date < CURDATE() THEN 'past'
    ELSE 'future'
  END as schedule_type
FROM duty_schedules ds
LEFT JOIN shift_templates st ON ds.duty_code = st.code
WHERE ds.status NOT IN ('cancelled', 'completed')
ORDER BY ds.schedule_date, ds.start_time;

-- Step 5: Create view for schedule conflicts
CREATE OR REPLACE VIEW v_schedule_conflicts AS
SELECT
  a.id as schedule_a_id,
  b.id as schedule_b_id,
  a.supervisor_id,
  a.supervisor_name,
  a.schedule_date,
  a.duty_code as duty_a,
  b.duty_code as duty_b,
  a.start_time as start_a,
  a.end_time as end_a,
  b.start_time as start_b,
  b.end_time as end_b
FROM duty_schedules a
JOIN duty_schedules b ON a.supervisor_id = b.supervisor_id
  AND a.schedule_date = b.schedule_date
  AND a.id < b.id
  AND a.status NOT IN ('cancelled', 'completed')
  AND b.status NOT IN ('cancelled', 'completed')
  AND (
    (a.start_time < b.end_time AND a.end_time > b.start_time)
  );

-- Verification (run manually)
-- SHOW CREATE TABLE duty_schedules;
-- SHOW CREATE TABLE shift_templates;
-- SELECT * FROM shift_templates;
-- SELECT * FROM v_upcoming_schedules LIMIT 10;
