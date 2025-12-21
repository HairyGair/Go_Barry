-- Migration: 023_create_system_settings.sql
-- Phase 9.1: System Settings for Mandatory Duty Selection
-- Created: December 20, 2025

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- Stores application-wide configuration settings
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
);

-- =====================================================
-- DEFAULT SETTINGS
-- =====================================================

-- Mandatory Duty Selection: When enabled, supervisors cannot skip duty selection
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by)
VALUES
    ('mandatory_duty_selection', 'false', 'boolean',
     'When enabled, supervisors must select a duty shift and cannot skip. View-only access is still allowed for managers/admins.',
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
-- VIEWS
-- =====================================================

-- View for easy settings access
CREATE OR REPLACE VIEW v_system_settings AS
SELECT
    setting_key,
    setting_value,
    setting_type,
    description,
    updated_by,
    updated_at,
    CASE setting_type
        WHEN 'boolean' THEN IF(setting_value = 'true', 'Enabled', 'Disabled')
        WHEN 'number' THEN CONCAT(setting_value, ' (numeric)')
        ELSE setting_value
    END as display_value
FROM system_settings
ORDER BY setting_key;

-- View for compliance settings specifically
CREATE OR REPLACE VIEW v_compliance_settings AS
SELECT
    setting_key,
    setting_value,
    setting_type,
    description,
    updated_at
FROM system_settings
WHERE setting_key IN (
    'mandatory_duty_selection',
    'duty_selection_grace_period_minutes',
    'session_timeout_minutes',
    'session_timeout_warning_minutes'
)
ORDER BY setting_key;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get single setting:
-- SELECT setting_value FROM system_settings WHERE setting_key = 'mandatory_duty_selection';

-- Update setting:
-- UPDATE system_settings SET setting_value = 'true', updated_by = 'AG003' WHERE setting_key = 'mandatory_duty_selection';

-- Get all compliance settings:
-- SELECT * FROM v_compliance_settings;
