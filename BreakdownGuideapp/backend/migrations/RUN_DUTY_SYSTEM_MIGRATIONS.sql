-- =====================================================
-- COMBINED DUTY SYSTEM MIGRATIONS
-- Run this script on production to fix 500 errors
-- Created: December 21, 2025
-- =====================================================

-- =====================================================
-- 1. DUTY NOTES TABLE (fixes /api/duty/notes/current 500 error)
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supervisor_id VARCHAR(36),
    supervisor_badge VARCHAR(20) NOT NULL,
    supervisor_name VARCHAR(100),
    duty_code VARCHAR(10) NOT NULL,
    duty_start_time DATETIME,
    note TEXT NOT NULL,
    note_type ENUM('general', 'breakdown', 'handover', 'priority', 'info') DEFAULT 'general',
    breakdown_id VARCHAR(50),
    is_priority BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supervisor_badge (supervisor_badge),
    INDEX idx_duty_code (duty_code),
    INDEX idx_created_at (created_at),
    INDEX idx_note_type (note_type),
    INDEX idx_is_priority (is_priority),
    INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. DUTY HANDOVERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_handovers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outgoing_supervisor_badge VARCHAR(20) NOT NULL,
    outgoing_supervisor_name VARCHAR(100),
    outgoing_duty_code VARCHAR(10),
    incoming_supervisor_badge VARCHAR(20),
    incoming_supervisor_name VARCHAR(100),
    general_notes TEXT,
    breakdowns_count INT DEFAULT 0,
    handover_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'acknowledged') DEFAULT 'completed',
    acknowledged_at DATETIME,
    acknowledged_by VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_outgoing_badge (outgoing_supervisor_badge),
    INDEX idx_incoming_badge (incoming_supervisor_badge),
    INDEX idx_handover_time (handover_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. HANDOVER BREAKDOWNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS handover_breakdowns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    handover_id INT NOT NULL,
    breakdown_id VARCHAR(50),
    fleet_no VARCHAR(20),
    issue_category VARCHAR(100),
    severity VARCHAR(20),
    handover_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (handover_id) REFERENCES duty_handovers(id) ON DELETE CASCADE,
    INDEX idx_handover_id (handover_id),
    INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. DUTY BREAKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_breaks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id CHAR(36) NOT NULL,
  supervisor_badge VARCHAR(50) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  duty_code VARCHAR(10) NOT NULL,
  shift_date DATE NOT NULL,
  break_start DATETIME NOT NULL,
  break_end DATETIME DEFAULT NULL,
  break_duration_minutes INT DEFAULT NULL,
  break_type ENUM('meal', 'comfort', 'other') DEFAULT 'other',
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_duty_code (duty_code),
  INDEX idx_shift_date (shift_date),
  INDEX idx_status (status),
  INDEX idx_break_start (break_start),
  INDEX idx_supervisor_date (supervisor_badge, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. DUTY EXTENSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_extensions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id CHAR(36) NOT NULL,
  supervisor_badge VARCHAR(50) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  duty_code VARCHAR(10) NOT NULL,
  shift_date DATE NOT NULL,
  original_end_time TIME NOT NULL,
  new_end_time TIME NOT NULL,
  extension_minutes INT NOT NULL,
  reason TEXT NOT NULL,
  request_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'denied', 'cancelled') DEFAULT 'pending',
  approved_by_id CHAR(36) DEFAULT NULL,
  approved_by_name VARCHAR(255) DEFAULT NULL,
  approval_time DATETIME DEFAULT NULL,
  approval_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_duty_code (duty_code),
  INDEX idx_shift_date (shift_date),
  INDEX idx_status (status),
  INDEX idx_request_time (request_time),
  INDEX idx_supervisor_date (supervisor_badge, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. DUTY AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duty_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supervisor_id CHAR(36) NOT NULL,
  supervisor_badge VARCHAR(50) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  supervisor_depot VARCHAR(50),
  action_type ENUM(
    'DUTY_START', 'DUTY_END', 'DUTY_EXTEND', 'DUTY_CHANGE', 'DUTY_SKIP',
    'HANDOVER_INITIATED', 'HANDOVER_COMPLETED', 'HANDOVER_RECEIVED', 'HANDOVER_REJECTED',
    'OVERTIME_START', 'OVERTIME_ALERT',
    'BREAK_START', 'BREAK_END',
    'FORCE_ASSIGN', 'FORCE_END', 'SESSION_TIMEOUT', 'NOTE_ADDED',
    'EXTENSION_REQUESTED', 'EXTENSION_APPROVED', 'EXTENSION_DENIED',
    'SETTING_CHANGED'
  ) NOT NULL,
  duty_code VARCHAR(10),
  duty_name VARCHAR(100),
  previous_duty_code VARCHAR(10),
  shift_start_time TIME,
  shift_end_time TIME,
  actual_start_time DATETIME,
  actual_end_time DATETIME,
  overtime_minutes INT DEFAULT 0,
  related_supervisor_id CHAR(36),
  related_supervisor_badge VARCHAR(50),
  related_breakdown_ids TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  previous_value TEXT,
  new_value TEXT,
  action_details TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_supervisor_badge (supervisor_badge),
  INDEX idx_supervisor_id (supervisor_id),
  INDEX idx_action_type (action_type),
  INDEX idx_duty_code (duty_code),
  INDEX idx_created_at (created_at),
  INDEX idx_depot (supervisor_depot),
  INDEX idx_date_range (created_at, action_type),
  INDEX idx_supervisor_date (supervisor_badge, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
    description VARCHAR(500),
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by)
VALUES
    ('mandatory_duty_selection', 'false', 'boolean',
     'When enabled, supervisors must select a duty shift and cannot skip.',
     'system'),
    ('duty_selection_grace_period_minutes', '5', 'number',
     'Grace period in minutes after login before duty selection is required',
     'system'),
    ('session_timeout_minutes', '480', 'number',
     'Session timeout in minutes (default 8 hours)',
     'system'),
    ('session_timeout_warning_minutes', '30', 'number',
     'Minutes before session expiry to show warning',
     'system')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- =====================================================
-- 8. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add break tracking columns to supervisors (if they don't exist)
-- These may fail if columns already exist - that's OK

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 'Checking tables created...' as status;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('duty_notes', 'duty_handovers', 'handover_breakdowns',
                   'duty_breaks', 'duty_extensions', 'duty_audit_log', 'system_settings');

SELECT 'MIGRATION COMPLETE!' as status;
