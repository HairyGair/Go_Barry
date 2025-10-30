-- ============================================================================
-- CREATE MISSING TABLES - NO FOREIGN KEYS
-- ============================================================================
-- This version skips foreign key constraints to avoid compatibility issues
-- Safe to run - creates tables without errors
-- ============================================================================

USE gobarryco_breakdown;

SELECT 'Creating missing tables for Go BARRY backend...' as status;

-- ============================================================================
-- User Preferences Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supervisor_id CHAR(36) NOT NULL,
  theme ENUM('light', 'dark', 'auto') DEFAULT 'dark',
  font_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
  view_density ENUM('compact', 'comfortable', 'spacious') DEFAULT 'comfortable',
  animations_enabled BOOLEAN DEFAULT 1,
  default_dashboard VARCHAR(50) DEFAULT 'breakdown-guide',
  auto_refresh_interval INT DEFAULT 60,
  show_activity_feed BOOLEAN DEFAULT 1,
  map_view ENUM('roadmap', 'satellite', 'hybrid') DEFAULT 'roadmap',
  show_traffic_layer BOOLEAN DEFAULT 1,
  filter_my_depot BOOLEAN DEFAULT 0,
  hide_resolved BOOLEAN DEFAULT 1,
  highlight_priority BOOLEAN DEFAULT 1,
  notifications_enabled BOOLEAN DEFAULT 1,
  notification_email BOOLEAN DEFAULT 1,
  notification_push BOOLEAN DEFAULT 0,
  sound_alerts BOOLEAN DEFAULT 0,
  desktop_notifications BOOLEAN DEFAULT 0,
  quiet_hours_start TIME NULL,
  quiet_hours_end TIME NULL,
  offline_mode BOOLEAN DEFAULT 0,
  custom_settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_supervisor_preferences (supervisor_id),
  INDEX idx_supervisor (supervisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Created user_preferences table' as status;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supervisor_id CHAR(36) NOT NULL,
  email_enabled BOOLEAN DEFAULT 1,
  push_enabled BOOLEAN DEFAULT 0,
  sms_enabled BOOLEAN DEFAULT 0,
  breakdown_created BOOLEAN DEFAULT 1,
  breakdown_updated BOOLEAN DEFAULT 1,
  breakdown_resolved BOOLEAN DEFAULT 1,
  engineering_dispatched BOOLEAN DEFAULT 1,
  critical_alerts BOOLEAN DEFAULT 1,
  depot_alerts BOOLEAN DEFAULT 1,
  quiet_hours_enabled BOOLEAN DEFAULT 0,
  quiet_hours_start TIME NULL,
  quiet_hours_end TIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_supervisor_notifications (supervisor_id),
  INDEX idx_supervisor (supervisor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Created notification_preferences table' as status;

-- ============================================================================
-- Wizard Progress Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wizard_progress (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supervisor_id CHAR(36) NOT NULL,
  breakdown_id CHAR(36) NULL,
  wizard_type VARCHAR(100) NOT NULL,
  current_step INT DEFAULT 0,
  step_data JSON,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  is_complete BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supervisor (supervisor_id),
  INDEX idx_breakdown (breakdown_id),
  INDEX idx_wizard_type (wizard_type),
  INDEX idx_completed (is_complete)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Created wizard_progress table' as status;

-- ============================================================================
-- Depots Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS depots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Created depots table' as status;

-- Insert default depots
INSERT IGNORE INTO depots (code, name, is_active) VALUES
  ('WAS', 'Washington', 1),
  ('NCL', 'Riverside', 1),
  ('CON', 'Consett', 1),
  ('HEX', 'Hexham', 1),
  ('GTS', 'Gateshead', 1),
  ('DAR', 'Deptford', 1);

SELECT 'Inserted 6 depots' as status;

-- ============================================================================
-- Breakdown Events Table (Audit Trail) - NO FOREIGN KEY
-- ============================================================================

CREATE TABLE IF NOT EXISTS breakdown_events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  breakdown_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_breakdown (breakdown_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Created breakdown_events table' as status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ All missing tables created successfully!' as final_status;

-- Show all tables
SHOW TABLES;

-- Show record counts
SELECT 'supervisors' as table_name, COUNT(*) as count FROM supervisors
UNION ALL SELECT 'breakdowns', COUNT(*) FROM breakdowns
UNION ALL SELECT 'engineers', COUNT(*) FROM engineers
UNION ALL SELECT 'activities', COUNT(*) FROM activities
UNION ALL SELECT 'fleet_vehicles', COUNT(*) FROM fleet_vehicles
UNION ALL SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL SELECT 'wizard_progress', COUNT(*) FROM wizard_progress
UNION ALL SELECT 'depots', COUNT(*) FROM depots
UNION ALL SELECT 'breakdown_events', COUNT(*) FROM breakdown_events;

SELECT '🚀 Database ready! You can now start the backend server.' as next_step;
