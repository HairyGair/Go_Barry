-- =====================================================
-- User Preferences Migration for Settings Page
-- =====================================================
-- This migration creates the infrastructure for storing
-- user preferences and settings in the database.
--
-- Features:
-- - User preferences table with JSONB for flexible settings
-- - Row Level Security (RLS) policies
-- - Auto-updating timestamps
-- - Indexes for performance
-- - Default values matching frontend localStorage
--
-- Usage:
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Create user_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,

  -- Appearance Settings
  theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  view_density VARCHAR(10) DEFAULT 'comfortable' CHECK (view_density IN ('compact', 'comfortable', 'spacious')),
  animations_enabled BOOLEAN DEFAULT true,

  -- Dashboard Settings
  default_dashboard VARCHAR(50) DEFAULT 'breakdown-guide',
  auto_refresh_interval INTEGER DEFAULT 60,
  show_activity_feed BOOLEAN DEFAULT true,

  -- Map Settings
  map_view VARCHAR(20) DEFAULT 'roadmap' CHECK (map_view IN ('roadmap', 'satellite', 'hybrid', 'terrain')),
  show_traffic_layer BOOLEAN DEFAULT true,

  -- Filter Preferences
  filter_my_depot BOOLEAN DEFAULT false,
  hide_resolved BOOLEAN DEFAULT true,
  highlight_priority BOOLEAN DEFAULT true,

  -- Notification Settings
  notifications_enabled BOOLEAN DEFAULT true,
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT false,
  sound_alerts BOOLEAN DEFAULT false,
  desktop_notifications BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Advanced Settings
  offline_mode BOOLEAN DEFAULT false,

  -- Flexible JSONB storage for additional preferences
  custom_settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one preference record per supervisor
  UNIQUE(supervisor_id)
);

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_preferences_supervisor_id
  ON user_preferences(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at
  ON user_preferences(updated_at DESC);

-- JSONB index for custom_settings queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_custom_settings
  ON user_preferences USING GIN (custom_settings);

-- =====================================================
-- 3. Create function to auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Create trigger for auto-updating timestamps
-- =====================================================
DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON user_preferences;

CREATE TRIGGER user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 5. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Create RLS Policies
-- =====================================================

-- Policy: Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (
    supervisor_id IN (
      SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy: Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (
    supervisor_id IN (
      SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (
    supervisor_id IN (
      SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    supervisor_id IN (
      SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Policy: Users can delete their own preferences (for reset functionality)
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (
    supervisor_id IN (
      SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
    )
  );

-- =====================================================
-- 7. Create helper function to get or create preferences
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_preferences(p_supervisor_id UUID)
RETURNS user_preferences AS $$
DECLARE
  v_preferences user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM user_preferences
  WHERE supervisor_id = p_supervisor_id;

  -- If not found, create with defaults
  IF NOT FOUND THEN
    INSERT INTO user_preferences (supervisor_id)
    VALUES (p_supervisor_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Create notification_preferences table (for Phase 2)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,

  -- Notification Channels
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,

  -- Notification Types
  breakdown_created BOOLEAN DEFAULT true,
  breakdown_updated BOOLEAN DEFAULT true,
  breakdown_resolved BOOLEAN DEFAULT false,
  assessment_assigned BOOLEAN DEFAULT true,
  priority_alert BOOLEAN DEFAULT true,

  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'Europe/London',

  -- Delivery Preferences
  email_address VARCHAR(255),
  push_device_tokens JSONB DEFAULT '[]'::jsonb,
  sms_phone_number VARCHAR(20),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one notification preference record per supervisor
  UNIQUE(supervisor_id)
);

-- Index for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_supervisor_id
  ON notification_preferences(supervisor_id);

-- Enable RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences (same pattern as user_preferences)
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (supervisor_id IN (SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (supervisor_id IN (SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (supervisor_id IN (SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (supervisor_id IN (SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'));

-- =====================================================
-- 9. Migrate existing localStorage settings (optional)
-- =====================================================
-- This section provides a template for migrating existing
-- localStorage-based settings to the database.
--
-- You would run this from your backend API after the migration
-- by calling the backend endpoint that reads localStorage
-- and inserts into the database.
--
-- Example backend endpoint:
-- POST /api/preferences/migrate
-- Body: { theme, fontSize, defaultDashboard, etc. }
--
-- The endpoint would then INSERT INTO user_preferences
-- =====================================================

-- =====================================================
-- 10. Grant necessary permissions
-- =====================================================
-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- =====================================================
-- 11. Create view for easy preference access
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
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables created: user_preferences, notification_preferences
-- 3. Check RLS policies are enabled
-- 4. Test with a supervisor account
-- 5. Implement backend API endpoints for CRUD operations
-- 6. Update frontend to use API instead of localStorage
-- =====================================================

-- Verification Queries (run these to check migration success):
-- SELECT * FROM user_preferences;
-- SELECT * FROM notification_preferences;
-- SELECT * FROM supervisor_preferences_view;
-- \d+ user_preferences  -- Show table structure and RLS policies
