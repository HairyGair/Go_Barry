-- Migration: Create Duty Extensions Table
-- Phase 2.5: Duty Extension Request functionality
-- Created: 2025-12-20
-- MySQL Compatible

-- =====================================================
-- Step 1: Create the duty_extensions table
-- =====================================================

CREATE TABLE IF NOT EXISTS duty_extensions (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Supervisor info
  supervisor_id CHAR(36) NOT NULL COMMENT 'UUID of the supervisor',
  supervisor_badge VARCHAR(50) NOT NULL COMMENT 'Badge number',
  supervisor_name VARCHAR(255) NOT NULL COMMENT 'Name at time of request',

  -- Duty context
  duty_code VARCHAR(10) NOT NULL COMMENT 'Current duty (100/200/400/500)',
  shift_date DATE NOT NULL COMMENT 'Date of the shift',
  original_end_time TIME NOT NULL COMMENT 'Original scheduled end time',
  new_end_time TIME NOT NULL COMMENT 'Requested new end time',
  extension_minutes INT NOT NULL COMMENT 'Duration of extension in minutes',

  -- Request details
  reason TEXT NOT NULL COMMENT 'Reason for extension request',
  request_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When extension was requested',

  -- Approval workflow
  status ENUM('pending', 'approved', 'denied', 'cancelled') DEFAULT 'pending',
  approved_by_id CHAR(36) DEFAULT NULL COMMENT 'UUID of approving manager/admin',
  approved_by_name VARCHAR(255) DEFAULT NULL COMMENT 'Name of approver',
  approval_time DATETIME DEFAULT NULL COMMENT 'When decision was made',
  approval_notes TEXT DEFAULT NULL COMMENT 'Notes from approver',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_duty_code (duty_code),
  INDEX idx_shift_date (shift_date),
  INDEX idx_status (status),
  INDEX idx_request_time (request_time),
  INDEX idx_supervisor_date (supervisor_badge, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks duty extension requests and approvals';


-- =====================================================
-- Step 2: Create view for pending extension requests
-- =====================================================

CREATE OR REPLACE VIEW v_pending_extensions AS
SELECT
  de.id,
  de.supervisor_id,
  de.supervisor_badge,
  de.supervisor_name,
  de.duty_code,
  de.shift_date,
  de.original_end_time,
  de.new_end_time,
  de.extension_minutes,
  de.reason,
  de.request_time,
  TIMESTAMPDIFF(MINUTE, de.request_time, NOW()) as minutes_pending,
  s.depot
FROM duty_extensions de
LEFT JOIN supervisors s ON de.supervisor_id = s.id
WHERE de.status = 'pending'
ORDER BY de.request_time ASC;


-- =====================================================
-- Step 3: Create view for extension history
-- =====================================================

CREATE OR REPLACE VIEW v_extension_history AS
SELECT
  de.id,
  de.supervisor_badge,
  de.supervisor_name,
  de.duty_code,
  de.shift_date,
  de.extension_minutes,
  de.reason,
  de.status,
  de.approved_by_name,
  de.approval_notes,
  de.request_time,
  de.approval_time,
  TIMESTAMPDIFF(MINUTE, de.request_time, de.approval_time) as response_time_minutes
FROM duty_extensions de
WHERE de.status IN ('approved', 'denied')
ORDER BY de.shift_date DESC, de.request_time DESC;


-- =====================================================
-- Step 4: Create view for extension statistics
-- =====================================================

CREATE OR REPLACE VIEW v_extension_stats AS
SELECT
  de.supervisor_badge,
  de.supervisor_name,
  COUNT(*) as total_requests,
  SUM(CASE WHEN de.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN de.status = 'denied' THEN 1 ELSE 0 END) as denied_count,
  SUM(CASE WHEN de.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
  AVG(CASE WHEN de.status = 'approved' THEN de.extension_minutes ELSE NULL END) as avg_extension_minutes,
  SUM(CASE WHEN de.status = 'approved' THEN de.extension_minutes ELSE 0 END) as total_extension_minutes
FROM duty_extensions de
WHERE de.shift_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY de.supervisor_badge, de.supervisor_name
ORDER BY total_requests DESC;


-- =====================================================
-- Step 5: Add extension tracking columns to supervisors table
-- =====================================================

-- Check if columns exist before adding
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'supervisors'
                   AND COLUMN_NAME = 'shift_extended');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE supervisors ADD COLUMN shift_extended BOOLEAN DEFAULT FALSE COMMENT ''Currently on extended shift''',
  'SELECT ''Column shift_extended already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'supervisors'
                   AND COLUMN_NAME = 'extended_end_time');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE supervisors ADD COLUMN extended_end_time TIME DEFAULT NULL COMMENT ''New end time if extended''',
  'SELECT ''Column extended_end_time already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =====================================================
-- Verification queries (run manually after migration)
-- =====================================================

-- DESCRIBE duty_extensions;
-- SELECT * FROM v_pending_extensions;
-- SELECT * FROM v_extension_history LIMIT 10;
-- DESCRIBE supervisors;
