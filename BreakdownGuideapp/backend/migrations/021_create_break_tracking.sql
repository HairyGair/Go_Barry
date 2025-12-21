-- Migration: Create Break Tracking Tables
-- Phase 2.3: Track supervisor breaks during shifts
-- Created: 2025-12-20
-- MySQL Compatible

-- =====================================================
-- Step 1: Create the duty_breaks table
-- =====================================================

CREATE TABLE IF NOT EXISTS duty_breaks (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Supervisor info
  supervisor_id CHAR(36) NOT NULL COMMENT 'UUID of the supervisor',
  supervisor_badge VARCHAR(50) NOT NULL COMMENT 'Badge number',
  supervisor_name VARCHAR(255) NOT NULL COMMENT 'Name at time of break',

  -- Duty context
  duty_code VARCHAR(10) NOT NULL COMMENT 'Current duty (100/200/400/500)',
  shift_date DATE NOT NULL COMMENT 'Date of the shift',

  -- Break timing
  break_start DATETIME NOT NULL COMMENT 'When break started',
  break_end DATETIME DEFAULT NULL COMMENT 'When break ended (NULL if ongoing)',
  break_duration_minutes INT DEFAULT NULL COMMENT 'Calculated duration',

  -- Break type
  break_type ENUM('meal', 'comfort', 'other') DEFAULT 'other' COMMENT 'Type of break',

  -- Status
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',

  -- Notes
  notes TEXT DEFAULT NULL COMMENT 'Optional notes',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_duty_code (duty_code),
  INDEX idx_shift_date (shift_date),
  INDEX idx_status (status),
  INDEX idx_break_start (break_start),
  INDEX idx_supervisor_date (supervisor_badge, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks supervisor breaks during duty shifts';


-- =====================================================
-- Step 2: Create view for active breaks
-- =====================================================

CREATE OR REPLACE VIEW v_active_breaks AS
SELECT
  db.id,
  db.supervisor_id,
  db.supervisor_badge,
  db.supervisor_name,
  db.duty_code,
  db.break_start,
  db.break_type,
  TIMESTAMPDIFF(MINUTE, db.break_start, NOW()) as minutes_on_break
FROM duty_breaks db
WHERE db.status = 'active'
  AND db.break_end IS NULL;


-- =====================================================
-- Step 3: Create view for daily break summary
-- =====================================================

CREATE OR REPLACE VIEW v_daily_break_summary AS
SELECT
  db.supervisor_badge,
  db.supervisor_name,
  db.shift_date,
  db.duty_code,
  COUNT(*) as total_breaks,
  SUM(db.break_duration_minutes) as total_break_minutes,
  SUM(CASE WHEN db.break_type = 'meal' THEN db.break_duration_minutes ELSE 0 END) as meal_break_minutes,
  SUM(CASE WHEN db.break_type = 'comfort' THEN db.break_duration_minutes ELSE 0 END) as comfort_break_minutes,
  MIN(db.break_start) as first_break,
  MAX(db.break_end) as last_break
FROM duty_breaks db
WHERE db.status = 'completed'
GROUP BY db.supervisor_badge, db.supervisor_name, db.shift_date, db.duty_code
ORDER BY db.shift_date DESC, db.supervisor_name;


-- =====================================================
-- Step 4: Create view for break patterns analysis
-- =====================================================

CREATE OR REPLACE VIEW v_break_patterns AS
SELECT
  db.duty_code,
  db.break_type,
  HOUR(db.break_start) as break_hour,
  COUNT(*) as break_count,
  AVG(db.break_duration_minutes) as avg_duration_minutes,
  MIN(db.break_duration_minutes) as min_duration,
  MAX(db.break_duration_minutes) as max_duration
FROM duty_breaks db
WHERE db.status = 'completed'
  AND db.break_duration_minutes IS NOT NULL
GROUP BY db.duty_code, db.break_type, HOUR(db.break_start)
ORDER BY db.duty_code, break_hour;


-- =====================================================
-- Step 5: Add break tracking columns to supervisors table
-- =====================================================

-- Check if columns exist before adding
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'supervisors'
                   AND COLUMN_NAME = 'on_break');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE supervisors ADD COLUMN on_break BOOLEAN DEFAULT FALSE COMMENT ''Currently on break''',
  'SELECT ''Column on_break already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'supervisors'
                   AND COLUMN_NAME = 'break_start_time');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE supervisors ADD COLUMN break_start_time DATETIME DEFAULT NULL COMMENT ''Current break start time''',
  'SELECT ''Column break_start_time already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'supervisors'
                   AND COLUMN_NAME = 'total_break_minutes_today');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE supervisors ADD COLUMN total_break_minutes_today INT DEFAULT 0 COMMENT ''Total break minutes for current shift''',
  'SELECT ''Column total_break_minutes_today already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =====================================================
-- Verification queries (run manually after migration)
-- =====================================================

-- DESCRIBE duty_breaks;
-- SELECT * FROM v_active_breaks;
-- SELECT * FROM v_daily_break_summary LIMIT 10;
-- DESCRIBE supervisors;
