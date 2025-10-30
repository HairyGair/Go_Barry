-- =====================================================
-- FOR PHPMYADMIN: Import this file directly. Delimiters are handled automatically.
-- =====================================================
-- MYSQL CPANEL MIGRATION SCHEMA - PHPMYADMIN COMPATIBLE VERSION
-- =====================================================
-- MySQL-compatible migration script for Go BARRY Breakdown Guide
-- Converted from PostgreSQL/Supabase schema to MySQL 8.0+
--
-- REQUIREMENTS:
-- - MySQL 8.0+ (for UUID() function support)
-- - For MySQL 5.7: Replace UUID() with application-generated UUIDs and use VARCHAR(36)
-- - UTF-8 character set with utf8mb4_unicode_ci collation
--
-- IMPORTANT NOTES:
-- - RLS (Row Level Security) policies removed - implement access control in application layer
-- - All timestamps use UTC timezone - ensure application sets timezone properly
-- - JSONB converted to JSON (MySQL doesn't have JSONB type)
-- - PostgreSQL array types converted to JSON arrays
-- - All procedural code converted to MySQL stored procedures/functions
-- - DELIMITER statements added for phpMyAdmin compatibility
--
-- Created: 2025-10-14
-- Modified: 2025-10-14 (phpMyAdmin delimiter fixes)
-- Purpose: Complete cPanel MySQL migration from Supabase PostgreSQL
--
-- Tables Created:
-- 1. supervisors - User accounts and authentication
-- 2. breakdowns - Breakdown tracking with full engineering workflow
-- 3. engineers - Engineer management and assignment
-- 4. wizard_progress - Assessment workflow tracking
-- 5. fleet_vehicles - Fleet database
-- 6. user_preferences - User settings and preferences
-- 7. notification_preferences - Notification settings
-- 8. activities - Unified activity feed
-- =====================================================

-- Set character set and collation for the session
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Disable foreign key checks during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE 1: SUPERVISORS
-- =====================================================
-- Purpose: User authentication and supervisor management
-- Includes: Signup workflow, role-based access, depot management
-- =====================================================

DROP TABLE IF EXISTS `supervisors`;

CREATE TABLE `supervisors` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Authentication
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `auth_user_id` CHAR(36),

    -- Profile Information
    `name` VARCHAR(255) NOT NULL,
    `badge_number` VARCHAR(50),
    `depot` VARCHAR(100) DEFAULT 'Washington',
    `role` ENUM('admin', 'supervisor', 'manager', 'engineering') DEFAULT 'supervisor',

    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `pending_approval` BOOLEAN DEFAULT FALSE,

    -- Timestamps
    `signup_date` TIMESTAMP NULL,
    `approved_date` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_supervisors_email` (`email`),
    INDEX `idx_supervisors_badge_number` (`badge_number`),
    INDEX `idx_supervisors_pending_approval` (`pending_approval`),
    INDEX `idx_supervisors_role` (`role`),
    INDEX `idx_supervisors_depot` (`depot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts for supervisors, managers, admins, and engineers';

-- =====================================================
-- TABLE 2: BREAKDOWNS
-- =====================================================
-- Purpose: Core breakdown tracking with complete engineering workflow
-- Includes: All engineering phases, resolution tracking, secured mileage
-- MySQL Note: CHECK constraints converted to application-level validation where complex
-- =====================================================

DROP TABLE IF EXISTS `breakdowns`;

CREATE TABLE `breakdowns` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Basic Breakdown Info
    `fleet_no` VARCHAR(50) NOT NULL,
    `wizard_type` VARCHAR(100),
    `status` VARCHAR(50) DEFAULT 'active',

    -- Supervisor Information
    `supervisor_id` VARCHAR(100),
    `supervisor_email` VARCHAR(255),
    `supervisor_name` VARCHAR(255),

    -- Location Data
    `location_lat` DECIMAL(10, 8),
    `location_lng` DECIMAL(11, 8),
    `location_address` TEXT,

    -- Assessment Data (JSONB -> JSON)
    `assessment_data` JSON,

    -- Engineering Workflow Timestamps
    `engineer_accepted_at` TIMESTAMP NULL,
    `engineer_on_site_at` TIMESTAMP NULL,
    `engineer_fixing_at` TIMESTAMP NULL,
    `engineer_completed_at` TIMESTAMP NULL,

    -- Engineering Data Fields
    `engineer_notes` JSON DEFAULT (JSON_ARRAY()),
    `parts_used` JSON,
    `labor_hours` DECIMAL(5,2),
    `repair_category` VARCHAR(100),
    `root_cause` TEXT,

    -- Engineer Assignment Tracking
    `engineer_id` VARCHAR(50),
    `engineer_name` VARCHAR(100),
    `engineer_badge` VARCHAR(20),
    `engineer_eta_minutes` INT,

    -- Resolution Tracking
    `resolved_at` TIMESTAMP NULL,
    `resolved_by` VARCHAR(100),
    `resolution_type` ENUM('fixed', 'changeover', 'cancelled', 'duplicate', 'other'),
    `resolution_notes` TEXT,
    `returned_to_service` BOOLEAN DEFAULT FALSE,

    -- Business Critical Fields
    `secured_mileage` BOOLEAN DEFAULT FALSE,

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,

    INDEX `idx_breakdowns_supervisor_email` (`supervisor_email`),
    INDEX `idx_breakdowns_created_at` (`created_at` DESC),
    INDEX `idx_breakdowns_status` (`status`),
    INDEX `idx_breakdowns_fleet_no` (`fleet_no`),
    INDEX `idx_breakdowns_engineer_id` (`engineer_id`),
    INDEX `idx_breakdowns_engineer_accepted_at` (`engineer_accepted_at`),
    INDEX `idx_breakdowns_repair_category` (`repair_category`),
    INDEX `idx_breakdowns_resolved_at` (`resolved_at`),
    INDEX `idx_breakdowns_resolution_type` (`resolution_type`),
    INDEX `idx_breakdowns_secured_mileage` (`secured_mileage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Breakdown records with full engineering workflow and resolution tracking';

-- =====================================================
-- TABLE 3: ENGINEERS
-- =====================================================
-- Purpose: Engineer management, skills tracking, and assignment
-- =====================================================

DROP TABLE IF EXISTS `engineers`;

CREATE TABLE `engineers` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Engineer Identity
    `badge_number` VARCHAR(20) UNIQUE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255),
    `phone` VARCHAR(20),

    -- Assignment and Location
    `depot` VARCHAR(50) NOT NULL,
    `status` ENUM('available', 'on_job', 'off_duty', 'unavailable') DEFAULT 'available',
    `current_breakdown_id` VARCHAR(50),

    -- Skills and Certifications (TEXT[] -> JSON arrays)
    `skills` JSON DEFAULT (JSON_ARRAY()),
    `certifications` JSON DEFAULT (JSON_ARRAY()),

    -- Shift Information
    `shift_start` TIME,
    `shift_end` TIME,

    -- Status
    `is_active` BOOLEAN DEFAULT TRUE,

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_engineers_depot` (`depot`),
    INDEX `idx_engineers_status` (`status`),
    INDEX `idx_engineers_badge_number` (`badge_number`),
    INDEX `idx_engineers_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Engineer database with skills, availability, and assignment tracking';

-- =====================================================
-- TABLE 4: WIZARD_PROGRESS
-- =====================================================
-- Purpose: Track multi-step assessment wizard progress
-- =====================================================

DROP TABLE IF EXISTS `wizard_progress`;

CREATE TABLE `wizard_progress` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Supervisor Information
    `supervisor_id` VARCHAR(100),
    `supervisor_email` VARCHAR(255),

    -- Wizard State
    `wizard_type` VARCHAR(100) NOT NULL,
    `current_step` INT DEFAULT 0,
    `total_steps` INT,
    `progress_data` JSON,
    `status` VARCHAR(50) DEFAULT 'in_progress',

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_wizard_progress_supervisor` (`supervisor_email`),
    INDEX `idx_wizard_progress_status` (`status`),
    INDEX `idx_wizard_progress_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks progress through multi-step diagnostic wizard assessments';

-- =====================================================
-- TABLE 5: FLEET_VEHICLES
-- =====================================================
-- Purpose: Fleet database for vehicle lookup and validation
-- =====================================================

DROP TABLE IF EXISTS `fleet_vehicles`;

CREATE TABLE `fleet_vehicles` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Vehicle Identity
    `fleet_no` VARCHAR(50) UNIQUE NOT NULL,
    `registration` VARCHAR(20),

    -- Vehicle Details
    `vehicle_type` VARCHAR(100),
    `make` VARCHAR(100),
    `model` VARCHAR(100),
    `year` INT,

    -- Assignment
    `depot` VARCHAR(100),

    -- Status
    `is_active` BOOLEAN DEFAULT TRUE,

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_fleet_vehicles_fleet_no` (`fleet_no`),
    INDEX `idx_fleet_vehicles_depot` (`depot`),
    INDEX `idx_fleet_vehicles_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fleet vehicle database for validation and lookup';

-- =====================================================
-- TABLE 6: USER_PREFERENCES
-- =====================================================
-- Purpose: User settings and preferences (replaces localStorage)
-- MySQL Note: Foreign key constraint added for referential integrity
-- =====================================================

DROP TABLE IF EXISTS `user_preferences`;

CREATE TABLE `user_preferences` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `supervisor_id` CHAR(36) NOT NULL,

    -- Appearance Settings
    `theme` ENUM('light', 'dark') DEFAULT 'dark',
    `font_size` ENUM('small', 'medium', 'large') DEFAULT 'medium',
    `view_density` ENUM('compact', 'comfortable', 'spacious') DEFAULT 'comfortable',
    `animations_enabled` BOOLEAN DEFAULT TRUE,

    -- Dashboard Settings
    `default_dashboard` VARCHAR(100) DEFAULT 'breakdown-guide',
    `auto_refresh_interval` INT DEFAULT 60,
    `show_activity_feed` BOOLEAN DEFAULT TRUE,

    -- Map Settings
    `map_view` ENUM('roadmap', 'satellite', 'hybrid', 'terrain') DEFAULT 'roadmap',
    `show_traffic_layer` BOOLEAN DEFAULT TRUE,

    -- Filter Preferences
    `filter_my_depot` BOOLEAN DEFAULT FALSE,
    `hide_resolved` BOOLEAN DEFAULT TRUE,
    `highlight_priority` BOOLEAN DEFAULT TRUE,

    -- Notification Settings (quick toggles)
    `notifications_enabled` BOOLEAN DEFAULT TRUE,
    `notification_email` BOOLEAN DEFAULT TRUE,
    `notification_push` BOOLEAN DEFAULT FALSE,
    `sound_alerts` BOOLEAN DEFAULT FALSE,
    `desktop_notifications` BOOLEAN DEFAULT FALSE,
    `quiet_hours_start` TIME,
    `quiet_hours_end` TIME,

    -- Advanced Settings
    `offline_mode` BOOLEAN DEFAULT FALSE,

    -- Flexible JSON storage for additional preferences
    `custom_settings` JSON DEFAULT (JSON_OBJECT()),

    -- Metadata
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ensure one preference record per supervisor
    UNIQUE KEY `unique_supervisor_preferences` (`supervisor_id`),

    -- Foreign key constraint
    CONSTRAINT `fk_user_preferences_supervisor`
        FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors`(`id`)
        ON DELETE CASCADE,

    INDEX `idx_user_preferences_supervisor_id` (`supervisor_id`),
    INDEX `idx_user_preferences_updated_at` (`updated_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User preferences and settings (replaces localStorage)';

-- =====================================================
-- TABLE 7: NOTIFICATION_PREFERENCES
-- =====================================================
-- Purpose: Detailed notification preferences and delivery settings
-- =====================================================

DROP TABLE IF EXISTS `notification_preferences`;

CREATE TABLE `notification_preferences` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    `supervisor_id` CHAR(36) NOT NULL,

    -- Notification Channels
    `email_enabled` BOOLEAN DEFAULT TRUE,
    `push_enabled` BOOLEAN DEFAULT FALSE,
    `sms_enabled` BOOLEAN DEFAULT FALSE,

    -- Notification Types
    `breakdown_created` BOOLEAN DEFAULT TRUE,
    `breakdown_updated` BOOLEAN DEFAULT TRUE,
    `breakdown_resolved` BOOLEAN DEFAULT FALSE,
    `assessment_assigned` BOOLEAN DEFAULT TRUE,
    `priority_alert` BOOLEAN DEFAULT TRUE,

    -- Quiet Hours
    `quiet_hours_enabled` BOOLEAN DEFAULT FALSE,
    `quiet_hours_start` TIME,
    `quiet_hours_end` TIME,
    `quiet_hours_timezone` VARCHAR(50) DEFAULT 'Europe/London',

    -- Delivery Preferences
    `email_address` VARCHAR(255),
    `push_device_tokens` JSON DEFAULT (JSON_ARRAY()),
    `sms_phone_number` VARCHAR(20),

    -- Metadata
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ensure one notification preference record per supervisor
    UNIQUE KEY `unique_supervisor_notifications` (`supervisor_id`),

    -- Foreign key constraint
    CONSTRAINT `fk_notification_preferences_supervisor`
        FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors`(`id`)
        ON DELETE CASCADE,

    INDEX `idx_notification_preferences_supervisor_id` (`supervisor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detailed notification preferences per supervisor';

-- =====================================================
-- TABLE 8: ACTIVITIES
-- =====================================================
-- Purpose: Unified activity feed for all system events
-- MySQL Note: Full-text search index added for message field
-- =====================================================

DROP TABLE IF EXISTS `activities`;

CREATE TABLE `activities` (
    `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Activity Type and Action
    `activity_type` VARCHAR(100) NOT NULL,
    `action` VARCHAR(255) NOT NULL,

    -- Actor Information
    `actor_type` VARCHAR(100) NOT NULL,
    `actor_id` VARCHAR(100),
    `actor_name` VARCHAR(255),

    -- Entity Information
    `entity_type` VARCHAR(100),
    `entity_id` VARCHAR(100),
    `entity_details` JSON DEFAULT (JSON_OBJECT()),

    -- Context
    `depot` VARCHAR(100),
    `severity` VARCHAR(50) DEFAULT 'info',
    `priority` INT DEFAULT 5,
    `source` VARCHAR(255),
    `source_url` TEXT,

    -- Display
    `icon` VARCHAR(100),
    `message` TEXT,

    -- Additional Metadata
    `metadata` JSON DEFAULT (JSON_OBJECT()),

    -- Timestamps
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_activities_type` (`activity_type`),
    INDEX `idx_activities_created` (`created_at` DESC),
    INDEX `idx_activities_depot` (`depot`),
    INDEX `idx_activities_entity` (`entity_id`),
    INDEX `idx_activities_actor` (`actor_id`),
    INDEX `idx_activities_severity` (`severity`),
    FULLTEXT INDEX `idx_activities_message_search` (`message`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Unified activity feed for all system events and user actions';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- STORED PROCEDURES AND FUNCTIONS
-- =====================================================
-- MySQL-converted versions of PostgreSQL functions
-- phpMyAdmin Compatible: DELIMITER statements properly formatted
-- =====================================================

-- Drop existing procedures/functions if they exist
DROP PROCEDURE IF EXISTS `get_or_create_preferences`;
DROP PROCEDURE IF EXISTS `cleanup_old_breakdowns`;

DELIMITER $$

-- =====================================================
-- PROCEDURE: get_or_create_preferences
-- =====================================================
-- Purpose: Get or create user preferences for a supervisor
-- Usage: CALL get_or_create_preferences('supervisor-uuid-here');
-- =====================================================

CREATE PROCEDURE `get_or_create_preferences`(
    IN p_supervisor_id CHAR(36)
)
BEGIN
    DECLARE v_exists INT;

    -- Check if preferences exist
    SELECT COUNT(*) INTO v_exists
    FROM `user_preferences`
    WHERE `supervisor_id` = p_supervisor_id;

    -- If not found, create with defaults
    IF v_exists = 0 THEN
        INSERT INTO `user_preferences` (`supervisor_id`)
        VALUES (p_supervisor_id);
    END IF;

    -- Return the preferences
    SELECT * FROM `user_preferences`
    WHERE `supervisor_id` = p_supervisor_id;
END$$

DELIMITER ;

DELIMITER $$

-- =====================================================
-- PROCEDURE: cleanup_old_breakdowns
-- =====================================================
-- Purpose: Cleanup function for old resolved breakdowns (30-day retention)
-- Usage: CALL cleanup_old_breakdowns();
-- Returns: Number of deleted records and cleanup timestamp
-- =====================================================

CREATE PROCEDURE `cleanup_old_breakdowns`()
BEGIN
    DECLARE rows_deleted INT DEFAULT 0;

    -- Delete old resolved breakdowns
    DELETE FROM `breakdowns`
    WHERE `status` = 'resolved'
        AND `resolved_at` IS NOT NULL
        AND `resolved_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);

    -- Get number of rows deleted
    SET rows_deleted = ROW_COUNT();

    -- Return results
    SELECT
        rows_deleted AS deleted_count,
        NOW() AS cleanup_date;
END$$

DELIMITER ;

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================
-- MySQL Note: Views created without materialization
-- =====================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS `supervisor_preferences_view`;
DROP VIEW IF EXISTS `active_breakdowns_view`;
DROP VIEW IF EXISTS `engineer_availability_view`;

-- =====================================================
-- VIEW: supervisor_preferences_view
-- =====================================================
-- Purpose: Combines supervisor + preferences for easy querying
-- =====================================================

CREATE VIEW `supervisor_preferences_view` AS
SELECT
    s.`id` AS supervisor_id,
    s.`email`,
    s.`name`,
    s.`depot`,
    s.`role`,
    up.`theme`,
    up.`font_size`,
    up.`view_density`,
    up.`animations_enabled`,
    up.`default_dashboard`,
    up.`auto_refresh_interval`,
    up.`show_activity_feed`,
    up.`map_view`,
    up.`show_traffic_layer`,
    up.`filter_my_depot`,
    up.`hide_resolved`,
    up.`highlight_priority`,
    up.`notifications_enabled`,
    up.`sound_alerts`,
    up.`desktop_notifications`,
    up.`custom_settings`,
    up.`updated_at` AS preferences_updated_at
FROM `supervisors` s
LEFT JOIN `user_preferences` up ON s.`id` = up.`supervisor_id`;

-- =====================================================
-- VIEW: active_breakdowns_view
-- =====================================================
-- Purpose: Active breakdowns (excludes resolved) with supervisor and engineer details
-- =====================================================

CREATE VIEW `active_breakdowns_view` AS
SELECT
    b.*,
    s.`name` AS supervisor_full_name,
    s.`depot` AS supervisor_depot,
    e.`name` AS engineer_full_name,
    e.`status` AS engineer_status
FROM `breakdowns` b
LEFT JOIN `supervisors` s ON b.`supervisor_email` = s.`email`
LEFT JOIN `engineers` e ON b.`engineer_badge` = e.`badge_number`
WHERE b.`status` != 'resolved' OR b.`status` IS NULL;

-- =====================================================
-- VIEW: engineer_availability_view
-- =====================================================
-- Purpose: Engineer availability with current breakdown details
-- =====================================================

CREATE VIEW `engineer_availability_view` AS
SELECT
    e.`id`,
    e.`badge_number`,
    e.`name`,
    e.`depot`,
    e.`status`,
    e.`skills`,
    e.`shift_start`,
    e.`shift_end`,
    b.`fleet_no` AS current_breakdown_fleet,
    b.`location_address` AS current_breakdown_location
FROM `engineers` e
LEFT JOIN `breakdowns` b ON e.`current_breakdown_id` = b.`id`
WHERE e.`is_active` = TRUE;

-- =====================================================
-- SAMPLE DATA: DEFAULT SUPERVISORS
-- =====================================================

INSERT INTO `supervisors` (`email`, `name`, `depot`, `role`, `badge_number`, `is_active`, `pending_approval`)
VALUES
    ('anthony.gair@gonortheast.co.uk', 'Anthony Gair', 'Washington', 'admin', 'AG003', TRUE, FALSE),
    ('barry.perryman@gonortheast.co.uk', 'Barry Perryman', 'Washington', 'manager', 'BP009', TRUE, FALSE),
    ('lee.mutch@gonortheast.co.uk', 'Lee Mutch', 'Washington', 'admin', 'LM001', TRUE, FALSE),
    ('joshua.devlin@gonortheast.co.uk', 'Joshua Devlin', 'Washington', 'supervisor', 'JD002', TRUE, FALSE),
    ('test@test.com', 'Test Supervisor', 'Washington', 'supervisor', 'TEST01', TRUE, FALSE)
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `depot` = VALUES(`depot`),
    `role` = VALUES(`role`),
    `badge_number` = VALUES(`badge_number`),
    `updated_at` = CURRENT_TIMESTAMP;

-- =====================================================
-- SAMPLE DATA: DEFAULT ENGINEERS
-- =====================================================

INSERT INTO `engineers` (`badge_number`, `name`, `email`, `depot`, `skills`, `status`)
VALUES
    ('ENG001', 'John Smith', 'john.smith@gonortheast.co.uk', 'Washington', JSON_ARRAY('electrical', 'mechanical'), 'available'),
    ('ENG002', 'Sarah Johnson', 'sarah.johnson@gonortheast.co.uk', 'Riverside', JSON_ARRAY('hvac', 'mechanical'), 'available'),
    ('ENG003', 'Mike Williams', 'mike.williams@gonortheast.co.uk', 'Consett', JSON_ARRAY('electrical', 'diagnostics'), 'available'),
    ('ENG004', 'Emma Brown', 'emma.brown@gonortheast.co.uk', 'Washington', JSON_ARRAY('mechanical', 'hydraulics'), 'available'),
    ('ENG005', 'David Wilson', 'david.wilson@gonortheast.co.uk', 'Deptford', JSON_ARRAY('electrical', 'mechanical', 'hvac'), 'available')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `email` = VALUES(`email`),
    `depot` = VALUES(`depot`),
    `updated_at` = CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration was successful
-- =====================================================

-- Display table counts and verification report
SELECT 'MIGRATION VERIFICATION REPORT' AS '';
SELECT '========================================' AS '';
SELECT CONCAT('✅ supervisors: ', COUNT(*), ' records') AS status FROM `supervisors`
UNION ALL
SELECT CONCAT('✅ breakdowns: ', COUNT(*), ' records') FROM `breakdowns`
UNION ALL
SELECT CONCAT('✅ engineers: ', COUNT(*), ' records') FROM `engineers`
UNION ALL
SELECT CONCAT('✅ wizard_progress: ', COUNT(*), ' records') FROM `wizard_progress`
UNION ALL
SELECT CONCAT('✅ fleet_vehicles: ', COUNT(*), ' records') FROM `fleet_vehicles`
UNION ALL
SELECT CONCAT('✅ user_preferences: ', COUNT(*), ' records') FROM `user_preferences`
UNION ALL
SELECT CONCAT('✅ notification_preferences: ', COUNT(*), ' records') FROM `notification_preferences`
UNION ALL
SELECT CONCAT('✅ activities: ', COUNT(*), ' records') FROM `activities`;

-- Display sample supervisors
SELECT '' AS '';
SELECT 'Sample Supervisors:' AS '';
SELECT CONCAT('  ', `badge_number`, ' - ', `name`, ' (', UPPER(`role`), ')') AS supervisor_info
FROM `supervisors`
WHERE `badge_number` IN ('AG003', 'BP009', 'LM001')
ORDER BY `badge_number`;

-- Display sample engineers
SELECT '' AS '';
SELECT 'Sample Engineers:' AS '';
SELECT CONCAT('  ', `badge_number`, ' - ', `name`, ' (', `depot`, ')') AS engineer_info
FROM `engineers`
ORDER BY `badge_number`
LIMIT 5;

-- List all tables created
SELECT '' AS '';
SELECT 'Tables Created:' AS '';
SELECT
    `TABLE_NAME` AS table_name,
    `TABLE_ROWS` AS estimated_rows,
    ROUND(`DATA_LENGTH` / 1024 / 1024, 2) AS size_mb
FROM `information_schema`.`TABLES`
WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_TYPE` = 'BASE TABLE'
    AND `TABLE_NAME` IN (
        'supervisors', 'breakdowns', 'engineers', 'wizard_progress',
        'fleet_vehicles', 'user_preferences', 'notification_preferences', 'activities'
    )
ORDER BY `TABLE_NAME`;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This script has created a complete MySQL database schema for the
-- Go BARRY Breakdown Guide application, converted from PostgreSQL/Supabase.
--
-- KEY CHANGES FROM POSTGRESQL:
-- 1. UUID type -> CHAR(36) with UUID() function
-- 2. TIMESTAMPTZ -> TIMESTAMP (ensure UTC in application)
-- 3. JSONB -> JSON (no binary JSON in MySQL)
-- 4. TEXT[] arrays -> JSON arrays
-- 5. CHECK constraints -> ENUM types where possible
-- 6. Triggers -> ON UPDATE CURRENT_TIMESTAMP for updated_at
-- 7. Functions -> Stored procedures with DELIMITER $$
-- 8. RLS policies -> REMOVED (implement in application layer)
-- 9. Full-text search -> FULLTEXT index instead of GIN
-- 10. Array functions -> JSON functions
--
-- PHPMYADMIN COMPATIBILITY FIXES:
-- - Each stored procedure wrapped in separate DELIMITER blocks
-- - DELIMITER $$ before CREATE PROCEDURE
-- - DELIMITER ; after END$$
-- - Ensures phpMyAdmin correctly parses multi-statement procedures
--
-- IMPORTANT SECURITY NOTES:
-- - RLS (Row Level Security) has been removed
-- - Implement all access control in your application layer
-- - Use parameterized queries to prevent SQL injection
-- - Restrict database user permissions appropriately
-- - Consider using separate read-only user for reporting
--
-- NEXT STEPS:
-- 1. Verify all tables exist and have data (see queries above)
-- 2. Test authentication with sample supervisors
-- 3. Update backend connection strings to point to MySQL database
-- 4. Test breakdown creation workflow
-- 5. Verify application-layer access control is working
-- 6. Set up regular backups of MySQL database
-- 7. Monitor query performance and add indexes as needed
-- 8. Set up timezone handling (SET time_zone = '+00:00' for UTC)
--
-- TIMEZONE CONFIGURATION:
-- Add this to your MySQL configuration file (my.cnf or my.ini):
-- [mysqld]
-- default-time-zone = '+00:00'
--
-- Or set in application connection:
-- SET time_zone = '+00:00';
-- =====================================================
