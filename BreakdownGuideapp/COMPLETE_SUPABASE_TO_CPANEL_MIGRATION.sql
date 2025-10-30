-- =====================================================
-- COMPLETE SUPABASE TO CPANEL MIGRATION SCHEMA
-- =====================================================
-- Consolidated migration script for Go BARRY Breakdown Guide
-- Combines all incremental migrations into one complete schema
--
-- This script is IDEMPOTENT - safe to run multiple times
--
-- Created: 2025-10-14
-- Purpose: Migrate from Supabase to cPanel MySQL/PostgreSQL
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

-- =====================================================
-- HELPER FUNCTIONS FOR IDEMPOTENCY
-- =====================================================

-- Function to check if UUID extension exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END $$;

-- Alternative UUID generation function (works without extensions)
CREATE OR REPLACE FUNCTION gen_random_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
EXCEPTION WHEN undefined_function THEN
    -- Fallback for systems without uuid-ossp
    RETURN (SELECT md5(random()::text || clock_timestamp()::text)::uuid);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLE 1: SUPERVISORS
-- =====================================================
-- Purpose: User authentication and supervisor management
-- Includes: Signup workflow, role-based access, depot management
-- =====================================================

CREATE TABLE IF NOT EXISTS supervisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication
    email TEXT UNIQUE NOT NULL,
    auth_user_id UUID,

    -- Profile Information
    name TEXT NOT NULL,
    badge_number TEXT,
    depot TEXT DEFAULT 'Washington',
    role TEXT CHECK (role IN ('admin', 'supervisor', 'manager', 'engineering')) DEFAULT 'supervisor',

    -- Account Status
    is_active BOOLEAN DEFAULT true,
    pending_approval BOOLEAN DEFAULT false,

    -- Timestamps
    signup_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for supervisors table
COMMENT ON TABLE supervisors IS 'User accounts for supervisors, managers, admins, and engineers';
COMMENT ON COLUMN supervisors.role IS 'User role: admin (full access), manager (most dashboards), supervisor (breakdown guide), engineering (engineering dashboard)';
COMMENT ON COLUMN supervisors.pending_approval IS 'True if user signed up but awaiting admin approval';
COMMENT ON COLUMN supervisors.badge_number IS 'Employee badge number (e.g., AG003, BP009)';
COMMENT ON COLUMN supervisors.depot IS 'Primary depot: Washington, Riverside, Consett, Deptford, etc.';

-- =====================================================
-- TABLE 2: BREAKDOWNS
-- =====================================================
-- Purpose: Core breakdown tracking with complete engineering workflow
-- Includes: All engineering phases, resolution tracking, secured mileage
-- =====================================================

CREATE TABLE IF NOT EXISTS breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Breakdown Info
    fleet_no TEXT NOT NULL,
    wizard_type TEXT,
    status TEXT DEFAULT 'active',

    -- Supervisor Information
    supervisor_id TEXT,
    supervisor_email TEXT,
    supervisor_name TEXT,

    -- Location Data
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,

    -- Assessment Data
    assessment_data JSONB,

    -- Engineering Workflow Timestamps
    engineer_accepted_at TIMESTAMPTZ,
    engineer_on_site_at TIMESTAMPTZ,
    engineer_fixing_at TIMESTAMPTZ,
    engineer_completed_at TIMESTAMPTZ,

    -- Engineering Data Fields
    engineer_notes JSONB DEFAULT '[]'::jsonb,
    parts_used JSONB,
    labor_hours DECIMAL(5,2),
    repair_category VARCHAR(100),
    root_cause TEXT,

    -- Engineer Assignment Tracking
    engineer_id VARCHAR(50),
    engineer_name VARCHAR(100),
    engineer_badge VARCHAR(20),
    engineer_eta_minutes INTEGER,

    -- Resolution Tracking
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    resolution_type VARCHAR(50) CHECK (resolution_type IN ('fixed', 'changeover', 'cancelled', 'duplicate', 'other')),
    resolution_notes TEXT,
    returned_to_service BOOLEAN DEFAULT false,

    -- Business Critical Fields
    secured_mileage BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Data Consistency Constraint
    CONSTRAINT resolution_data_consistency CHECK (
        (status = 'resolved' AND resolved_at IS NOT NULL) OR
        (status != 'resolved' AND resolved_at IS NULL) OR
        (status IS NULL)
    )
);

-- Comments for breakdowns table
COMMENT ON TABLE breakdowns IS 'Breakdown records with full engineering workflow and resolution tracking';
COMMENT ON COLUMN breakdowns.wizard_type IS 'Type of diagnostic wizard used (e.g., steering, brakes, non-starter)';
COMMENT ON COLUMN breakdowns.status IS 'Breakdown status: active, in_progress, resolved';
COMMENT ON COLUMN breakdowns.assessment_data IS 'JSON data from diagnostic wizard assessment';
COMMENT ON COLUMN breakdowns.engineer_notes IS 'Array of timestamped engineer notes';
COMMENT ON COLUMN breakdowns.secured_mileage IS 'Indicates if breakdown occurred on secured/contracted mileage work (contractual compliance)';
COMMENT ON COLUMN breakdowns.resolution_type IS 'Type of resolution: fixed, changeover, cancelled, duplicate, other';
COMMENT ON COLUMN breakdowns.resolved_at IS 'Timestamp when breakdown was manually resolved';
COMMENT ON COLUMN breakdowns.resolved_by IS 'Name or badge of supervisor who resolved the breakdown';
COMMENT ON COLUMN breakdowns.resolution_notes IS 'Optional notes about the resolution';
COMMENT ON COLUMN breakdowns.returned_to_service IS 'Whether the vehicle was returned to service after resolution';

-- =====================================================
-- TABLE 3: ENGINEERS
-- =====================================================
-- Purpose: Engineer management, skills tracking, and assignment
-- =====================================================

CREATE TABLE IF NOT EXISTS engineers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Engineer Identity
    badge_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Assignment and Location
    depot VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'on_job', 'off_duty', 'unavailable')),
    current_breakdown_id VARCHAR(50),

    -- Skills and Certifications
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,

    -- Shift Information
    shift_start TIME,
    shift_end TIME,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for engineers table
COMMENT ON TABLE engineers IS 'Engineer database with skills, availability, and assignment tracking';
COMMENT ON COLUMN engineers.status IS 'Current engineer status: available, on_job, off_duty, unavailable';
COMMENT ON COLUMN engineers.skills IS 'Array of engineer skills (e.g., ["electrical", "mechanical", "hvac"])';
COMMENT ON COLUMN engineers.certifications IS 'Array of certifications and training completed';

-- =====================================================
-- TABLE 4: WIZARD_PROGRESS
-- =====================================================
-- Purpose: Track multi-step assessment wizard progress
-- =====================================================

CREATE TABLE IF NOT EXISTS wizard_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Supervisor Information
    supervisor_id TEXT,
    supervisor_email TEXT,

    -- Wizard State
    wizard_type TEXT NOT NULL,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    progress_data JSONB,
    status TEXT DEFAULT 'in_progress',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for wizard_progress table
COMMENT ON TABLE wizard_progress IS 'Tracks progress through multi-step diagnostic wizard assessments';
COMMENT ON COLUMN wizard_progress.wizard_type IS 'Type of diagnostic wizard (matches breakdown wizard_type)';
COMMENT ON COLUMN wizard_progress.progress_data IS 'JSON data containing answers and progress state';

-- =====================================================
-- TABLE 5: FLEET_VEHICLES
-- =====================================================
-- Purpose: Fleet database for vehicle lookup and validation
-- =====================================================

CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vehicle Identity
    fleet_no TEXT UNIQUE NOT NULL,
    registration TEXT,

    -- Vehicle Details
    vehicle_type TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,

    -- Assignment
    depot TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for fleet_vehicles table
COMMENT ON TABLE fleet_vehicles IS 'Fleet vehicle database for validation and lookup';
COMMENT ON COLUMN fleet_vehicles.fleet_no IS 'Unique fleet number (e.g., 5410, 6123)';
COMMENT ON COLUMN fleet_vehicles.vehicle_type IS 'Vehicle type (e.g., Double Decker, Single Decker, Minibus)';

-- =====================================================
-- TABLE 6: USER_PREFERENCES
-- =====================================================
-- Purpose: User settings and preferences (replaces localStorage)
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
    default_dashboard VARCHAR(100) DEFAULT 'breakdown-guide',
    auto_refresh_interval INTEGER DEFAULT 60,
    show_activity_feed BOOLEAN DEFAULT true,

    -- Map Settings
    map_view VARCHAR(50) DEFAULT 'roadmap' CHECK (map_view IN ('roadmap', 'satellite', 'hybrid', 'terrain')),
    show_traffic_layer BOOLEAN DEFAULT true,

    -- Filter Preferences
    filter_my_depot BOOLEAN DEFAULT false,
    hide_resolved BOOLEAN DEFAULT true,
    highlight_priority BOOLEAN DEFAULT true,

    -- Notification Settings (quick toggles)
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

-- Comments for user_preferences table
COMMENT ON TABLE user_preferences IS 'User preferences and settings (replaces localStorage)';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme: light or dark';
COMMENT ON COLUMN user_preferences.default_dashboard IS 'Dashboard to show on login (e.g., breakdown-guide, control-room)';
COMMENT ON COLUMN user_preferences.custom_settings IS 'Flexible JSONB storage for additional preferences';

-- =====================================================
-- TABLE 7: NOTIFICATION_PREFERENCES
-- =====================================================
-- Purpose: Detailed notification preferences and delivery settings
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

-- Comments for notification_preferences table
COMMENT ON TABLE notification_preferences IS 'Detailed notification preferences per supervisor';
COMMENT ON COLUMN notification_preferences.push_device_tokens IS 'Array of push notification device tokens';
COMMENT ON COLUMN notification_preferences.quiet_hours_timezone IS 'Timezone for quiet hours (default: Europe/London)';

-- =====================================================
-- TABLE 8: ACTIVITIES
-- =====================================================
-- Purpose: Unified activity feed for all system events
-- =====================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Activity Type and Action
    activity_type TEXT NOT NULL,
    action TEXT NOT NULL,

    -- Actor Information
    actor_type TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT,

    -- Entity Information
    entity_type TEXT,
    entity_id TEXT,
    entity_details JSONB DEFAULT '{}',

    -- Context
    depot TEXT,
    severity TEXT DEFAULT 'info',
    priority INTEGER DEFAULT 5,
    source TEXT,
    source_url TEXT,

    -- Display
    icon TEXT,
    message TEXT,

    -- Additional Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for activities table
COMMENT ON TABLE activities IS 'Unified activity feed for all system events and user actions';
COMMENT ON COLUMN activities.activity_type IS 'Type of activity (breakdown_reported, engineer_assigned, etc.)';
COMMENT ON COLUMN activities.action IS 'Human-readable action description';
COMMENT ON COLUMN activities.actor_type IS 'Type of actor (supervisor, engineer, admin, system)';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity affected (breakdown, vehicle, engineer, etc.)';
COMMENT ON COLUMN activities.entity_details IS 'Additional structured data about the entity';
COMMENT ON COLUMN activities.severity IS 'Activity severity (critical, warning, normal, success, info)';
COMMENT ON COLUMN activities.metadata IS 'Additional unstructured metadata';
COMMENT ON COLUMN activities.message IS 'Human-readable activity message for display';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Supervisors Indexes
CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);
CREATE INDEX IF NOT EXISTS idx_supervisors_badge_number ON supervisors(badge_number);
CREATE INDEX IF NOT EXISTS idx_supervisors_pending_approval ON supervisors(pending_approval);
CREATE INDEX IF NOT EXISTS idx_supervisors_role ON supervisors(role);
CREATE INDEX IF NOT EXISTS idx_supervisors_depot ON supervisors(depot);

-- Breakdowns Indexes
CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor_email ON breakdowns(supervisor_email);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at ON breakdowns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_id ON breakdowns(engineer_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_accepted_at ON breakdowns(engineer_accepted_at);
CREATE INDEX IF NOT EXISTS idx_breakdowns_repair_category ON breakdowns(repair_category);
CREATE INDEX IF NOT EXISTS idx_breakdowns_resolved_at ON breakdowns(resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_breakdowns_resolution_type ON breakdowns(resolution_type) WHERE resolution_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_breakdowns_secured_mileage ON breakdowns(secured_mileage) WHERE secured_mileage = true;

-- Engineers Indexes
CREATE INDEX IF NOT EXISTS idx_engineers_depot ON engineers(depot);
CREATE INDEX IF NOT EXISTS idx_engineers_status ON engineers(status);
CREATE INDEX IF NOT EXISTS idx_engineers_badge_number ON engineers(badge_number);
CREATE INDEX IF NOT EXISTS idx_engineers_is_active ON engineers(is_active);

-- Wizard Progress Indexes
CREATE INDEX IF NOT EXISTS idx_wizard_progress_supervisor ON wizard_progress(supervisor_email);
CREATE INDEX IF NOT EXISTS idx_wizard_progress_status ON wizard_progress(status);
CREATE INDEX IF NOT EXISTS idx_wizard_progress_created ON wizard_progress(created_at DESC);

-- Fleet Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_depot ON fleet_vehicles(depot);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_is_active ON fleet_vehicles(is_active);

-- User Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_supervisor_id ON user_preferences(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_custom_settings ON user_preferences USING GIN (custom_settings);

-- Notification Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_supervisor_id ON notification_preferences(supervisor_id);

-- Activities Indexes
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_depot ON activities(depot);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_severity ON activities(severity);
CREATE INDEX IF NOT EXISTS idx_activities_message_search ON activities USING gin(to_tsvector('english', COALESCE(message, '')));

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_supervisors_updated_at ON supervisors;
CREATE TRIGGER update_supervisors_updated_at
    BEFORE UPDATE ON supervisors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_breakdowns_updated_at ON breakdowns;
CREATE TRIGGER update_breakdowns_updated_at
    BEFORE UPDATE ON breakdowns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engineers_updated_at ON engineers;
CREATE TRIGGER update_engineers_updated_at
    BEFORE UPDATE ON engineers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wizard_progress_updated_at ON wizard_progress;
CREATE TRIGGER update_wizard_progress_updated_at
    BEFORE UPDATE ON wizard_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_vehicles_updated_at ON fleet_vehicles;
CREATE TRIGGER update_fleet_vehicles_updated_at
    BEFORE UPDATE ON fleet_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER user_preferences_updated_at_trigger
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at_trigger ON activities;
CREATE TRIGGER update_activities_updated_at_trigger
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get or create user preferences
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

-- Cleanup function for old resolved breakdowns (30-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_breakdowns()
RETURNS TABLE (
    deleted_count INTEGER,
    cleanup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM breakdowns
    WHERE status = 'resolved'
        AND resolved_at IS NOT NULL
        AND resolved_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;

    RETURN QUERY SELECT rows_deleted, NOW();
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Note: RLS is Supabase-specific. For cPanel hosting, implement
-- access control at the application layer.
-- The policies below are included for reference.
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: SUPERVISORS
-- =====================================================

DROP POLICY IF EXISTS "Supervisors can view all active supervisors" ON supervisors;
CREATE POLICY "Supervisors can view all active supervisors" ON supervisors
    FOR SELECT USING (is_active = true OR pending_approval = true);

DROP POLICY IF EXISTS "Allow signup for new supervisors" ON supervisors;
CREATE POLICY "Allow signup for new supervisors" ON supervisors
    FOR INSERT WITH CHECK (
        pending_approval = true AND is_active = false
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can approve/update supervisors" ON supervisors;
CREATE POLICY "Only admins can approve/update supervisors" ON supervisors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- =====================================================
-- RLS POLICIES: BREAKDOWNS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own breakdowns" ON breakdowns;
CREATE POLICY "Users can view their own breakdowns" ON breakdowns
    FOR SELECT USING (
        supervisor_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role IN ('admin', 'manager', 'engineering')
        )
    );

DROP POLICY IF EXISTS "Users can create breakdowns" ON breakdowns;
CREATE POLICY "Users can create breakdowns" ON breakdowns
    FOR INSERT WITH CHECK (
        supervisor_email = auth.jwt() ->> 'email'
    );

DROP POLICY IF EXISTS "Users can update their own breakdowns" ON breakdowns;
CREATE POLICY "Users can update their own breakdowns" ON breakdowns
    FOR UPDATE USING (
        supervisor_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role IN ('admin', 'engineering')
        )
    );

-- =====================================================
-- RLS POLICIES: ENGINEERS
-- =====================================================

DROP POLICY IF EXISTS "All authenticated users can view engineers" ON engineers;
CREATE POLICY "All authenticated users can view engineers" ON engineers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify engineers" ON engineers;
CREATE POLICY "Only admins can modify engineers" ON engineers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role IN ('admin', 'engineering')
        )
    );

-- =====================================================
-- RLS POLICIES: USER_PREFERENCES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    )
    WITH CHECK (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- RLS POLICIES: NOTIFICATION_PREFERENCES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    )
    WITH CHECK (
        supervisor_id IN (
            SELECT id FROM supervisors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- =====================================================
-- RLS POLICIES: ACTIVITIES
-- =====================================================

DROP POLICY IF EXISTS "activities_select_policy" ON activities;
CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activities_service_policy" ON activities;
CREATE POLICY "activities_service_policy" ON activities
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: FLEET_VEHICLES & WIZARD_PROGRESS
-- =====================================================

-- Fleet vehicles: read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view fleet" ON fleet_vehicles;
CREATE POLICY "Authenticated users can view fleet" ON fleet_vehicles
    FOR SELECT TO authenticated USING (true);

-- Wizard progress: users can manage their own
DROP POLICY IF EXISTS "Users can manage own wizard progress" ON wizard_progress;
CREATE POLICY "Users can manage own wizard progress" ON wizard_progress
    FOR ALL USING (
        supervisor_email = auth.jwt() ->> 'email'
    );

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON supervisors TO authenticated;
GRANT ALL ON breakdowns TO authenticated;
GRANT ALL ON engineers TO authenticated;
GRANT ALL ON wizard_progress TO authenticated;
GRANT SELECT ON fleet_vehicles TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT SELECT, INSERT ON activities TO authenticated;

-- Service role permissions (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- SAMPLE DATA: DEFAULT SUPERVISORS
-- =====================================================

INSERT INTO supervisors (email, name, depot, role, badge_number, is_active, pending_approval)
VALUES
    ('anthony.gair@gonortheast.co.uk', 'Anthony Gair', 'Washington', 'admin', 'AG003', true, false),
    ('barry.perryman@gonortheast.co.uk', 'Barry Perryman', 'Washington', 'manager', 'BP009', true, false),
    ('lee.mutch@gonortheast.co.uk', 'Lee Mutch', 'Washington', 'admin', 'LM001', true, false),
    ('joshua.devlin@gonortheast.co.uk', 'Joshua Devlin', 'Washington', 'supervisor', 'JD002', true, false),
    ('test@test.com', 'Test Supervisor', 'Washington', 'supervisor', 'TEST01', true, false)
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    depot = EXCLUDED.depot,
    role = EXCLUDED.role,
    badge_number = EXCLUDED.badge_number,
    updated_at = NOW();

-- =====================================================
-- SAMPLE DATA: DEFAULT ENGINEERS
-- =====================================================

INSERT INTO engineers (badge_number, name, email, depot, skills, status)
VALUES
    ('ENG001', 'John Smith', 'john.smith@gonortheast.co.uk', 'Washington', '["electrical", "mechanical"]'::jsonb, 'available'),
    ('ENG002', 'Sarah Johnson', 'sarah.johnson@gonortheast.co.uk', 'Riverside', '["hvac", "mechanical"]'::jsonb, 'available'),
    ('ENG003', 'Mike Williams', 'mike.williams@gonortheast.co.uk', 'Consett', '["electrical", "diagnostics"]'::jsonb, 'available'),
    ('ENG004', 'Emma Brown', 'emma.brown@gonortheast.co.uk', 'Washington', '["mechanical", "hydraulics"]'::jsonb, 'available'),
    ('ENG005', 'David Wilson', 'david.wilson@gonortheast.co.uk', 'Deptford', '["electrical", "mechanical", "hvac"]'::jsonb, 'available')
ON CONFLICT (badge_number) DO NOTHING;

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- Supervisor preferences view (combines supervisor + preferences)
CREATE OR REPLACE VIEW supervisor_preferences_view AS
SELECT
    s.id as supervisor_id,
    s.email,
    s.name,
    s.depot,
    s.role,
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

-- Active breakdowns view (excludes resolved)
CREATE OR REPLACE VIEW active_breakdowns_view AS
SELECT
    b.*,
    s.name as supervisor_full_name,
    s.depot as supervisor_depot,
    e.name as engineer_full_name,
    e.status as engineer_status
FROM breakdowns b
LEFT JOIN supervisors s ON b.supervisor_email = s.email
LEFT JOIN engineers e ON b.engineer_badge = e.badge_number
WHERE b.status != 'resolved' OR b.status IS NULL;

-- Engineer availability view
CREATE OR REPLACE VIEW engineer_availability_view AS
SELECT
    e.id,
    e.badge_number,
    e.name,
    e.depot,
    e.status,
    e.skills,
    e.shift_start,
    e.shift_end,
    b.fleet_no as current_breakdown_fleet,
    b.location_address as current_breakdown_location
FROM engineers e
LEFT JOIN breakdowns b ON e.current_breakdown_id = b.id::text
WHERE e.is_active = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration was successful
-- =====================================================

-- Verification: Table counts
DO $$
DECLARE
    v_supervisors INTEGER;
    v_breakdowns INTEGER;
    v_engineers INTEGER;
    v_wizard_progress INTEGER;
    v_fleet_vehicles INTEGER;
    v_user_preferences INTEGER;
    v_notification_preferences INTEGER;
    v_activities INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_supervisors FROM supervisors;
    SELECT COUNT(*) INTO v_breakdowns FROM breakdowns;
    SELECT COUNT(*) INTO v_engineers FROM engineers;
    SELECT COUNT(*) INTO v_wizard_progress FROM wizard_progress;
    SELECT COUNT(*) INTO v_fleet_vehicles FROM fleet_vehicles;
    SELECT COUNT(*) INTO v_user_preferences FROM user_preferences;
    SELECT COUNT(*) INTO v_notification_preferences FROM notification_preferences;
    SELECT COUNT(*) INTO v_activities FROM activities;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ supervisors: % records', v_supervisors;
    RAISE NOTICE '✅ breakdowns: % records', v_breakdowns;
    RAISE NOTICE '✅ engineers: % records', v_engineers;
    RAISE NOTICE '✅ wizard_progress: % records', v_wizard_progress;
    RAISE NOTICE '✅ fleet_vehicles: % records', v_fleet_vehicles;
    RAISE NOTICE '✅ user_preferences: % records', v_user_preferences;
    RAISE NOTICE '✅ notification_preferences: % records', v_notification_preferences;
    RAISE NOTICE '✅ activities: % records', v_activities;
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Supervisors:';
    RAISE NOTICE '  AG003 - Anthony Gair (Admin)';
    RAISE NOTICE '  BP009 - Barry Perryman (Manager)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Engineers:';
    RAISE NOTICE '  ENG001 - John Smith (Washington)';
    RAISE NOTICE '  ENG002 - Sarah Johnson (Riverside)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Verify all tables exist and have data';
    RAISE NOTICE '2. Test authentication with sample supervisors';
    RAISE NOTICE '3. Update backend connection strings';
    RAISE NOTICE '4. Test breakdown creation workflow';
    RAISE NOTICE '5. Verify RLS policies if using Supabase';
    RAISE NOTICE '========================================';
END $$;

-- List all tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'supervisors', 'breakdowns', 'engineers', 'wizard_progress',
        'fleet_vehicles', 'user_preferences', 'notification_preferences', 'activities'
    )
ORDER BY table_name;

-- List all indexes created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'supervisors', 'breakdowns', 'engineers', 'wizard_progress',
        'fleet_vehicles', 'user_preferences', 'notification_preferences', 'activities'
    )
ORDER BY tablename, indexname;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This script has created a complete database schema for the
-- Go BARRY Breakdown Guide application, consolidating all
-- incremental migrations into one comprehensive schema.
--
-- All tables, indexes, triggers, functions, RLS policies,
-- and sample data have been created.
--
-- For cPanel hosting: Disable RLS and implement access
-- control in the application layer.
-- =====================================================
