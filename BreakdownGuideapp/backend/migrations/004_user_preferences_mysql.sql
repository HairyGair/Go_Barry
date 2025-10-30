-- =====================================================
-- User Preferences Migration for MySQL
-- =====================================================
-- MySQL version of user_preferences and notification_preferences tables
-- Converted from Supabase (PostgreSQL) to MySQL
--
-- Features:
-- - User preferences table with JSON for flexible settings
-- - Notification preferences table
-- - Auto-updating timestamps via triggers
-- - Indexes for performance
-- - Default values matching frontend localStorage
--
-- Usage:
-- Run this SQL in your MySQL database
-- =====================================================

-- =====================================================
-- 1. Create user_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supervisor_id VARCHAR(255) NOT NULL,

  -- Appearance Settings
  theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  view_density VARCHAR(10) DEFAULT 'comfortable' CHECK (view_density IN ('compact', 'comfortable', 'spacious')),
  animations_enabled BOOLEAN DEFAULT TRUE,

  -- Dashboard Settings
  default_dashboard VARCHAR(50) DEFAULT 'breakdown-guide',
  auto_refresh_interval INT DEFAULT 60,
  show_activity_feed BOOLEAN DEFAULT TRUE,

  -- Map Settings
  map_view VARCHAR(20) DEFAULT 'roadmap' CHECK (map_view IN ('roadmap', 'satellite', 'hybrid', 'terrain')),
  show_traffic_layer BOOLEAN DEFAULT TRUE,

  -- Filter Preferences
  filter_my_depot BOOLEAN DEFAULT FALSE,
  hide_resolved BOOLEAN DEFAULT TRUE,
  highlight_priority BOOLEAN DEFAULT TRUE,

  -- Notification Settings
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT FALSE,
  sound_alerts BOOLEAN DEFAULT FALSE,
  desktop_notifications BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Advanced Settings
  offline_mode BOOLEAN DEFAULT FALSE,

  -- Flexible JSON storage for additional preferences
  custom_settings JSON DEFAULT ('{}'),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Ensure one preference record per supervisor
  UNIQUE KEY unique_supervisor_preferences (supervisor_id),

  -- Foreign key to supervisors table
  CONSTRAINT fk_user_preferences_supervisor
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================
CREATE INDEX idx_user_preferences_supervisor_id
  ON user_preferences(supervisor_id);

CREATE INDEX idx_user_preferences_updated_at
  ON user_preferences(updated_at DESC);

-- =====================================================
-- 3. Create notification_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  supervisor_id VARCHAR(255) NOT NULL,

  -- Notification Channels
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,

  -- Notification Types
  breakdown_created BOOLEAN DEFAULT TRUE,
  breakdown_updated BOOLEAN DEFAULT TRUE,
  breakdown_resolved BOOLEAN DEFAULT FALSE,
  assessment_assigned BOOLEAN DEFAULT TRUE,
  priority_alert BOOLEAN DEFAULT TRUE,

  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'Europe/London',

  -- Delivery Preferences
  email_address VARCHAR(255),
  push_device_tokens JSON DEFAULT ('[]'),
  sms_phone_number VARCHAR(20),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Ensure one notification preference record per supervisor
  UNIQUE KEY unique_supervisor_notifications (supervisor_id),

  -- Foreign key to supervisors table
  CONSTRAINT fk_notification_preferences_supervisor
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Create indexes for notification_preferences
-- =====================================================
CREATE INDEX idx_notification_preferences_supervisor_id
  ON notification_preferences(supervisor_id);

-- =====================================================
-- 5. Create view for easy preference access
-- =====================================================
CREATE OR REPLACE VIEW supervisor_preferences_view AS
SELECT
  s.id as supervisor_id,
  s.email,
  s.name,
  s.depot,
  up.theme,
  up.font_size,
  up.view_density,
  up.animations_enabled,
  up.default_dashboard,
  up.auto_refresh_interval,
  up.show_activity_feed,
  up.map_view,
  up.show_traffic_layer,
  up.filter_my_depot,
  up.hide_resolved,
  up.highlight_priority,
  up.notifications_enabled,
  up.sound_alerts,
  up.desktop_notifications,
  up.custom_settings,
  up.updated_at as preferences_updated_at
FROM supervisors s
LEFT JOIN user_preferences up ON s.id = up.supervisor_id;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run this SQL in your MySQL database
-- 2. Verify tables created: user_preferences, notification_preferences
-- 3. Test with a supervisor account
-- 4. Update backend API endpoints to use MySQL instead of Supabase
-- =====================================================

-- Verification Queries (run these to check migration success):
-- SELECT * FROM user_preferences;
-- SELECT * FROM notification_preferences;
-- SELECT * FROM supervisor_preferences_view;
-- DESCRIBE user_preferences;
