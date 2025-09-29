-- Supabase Database Setup for Breakdown Guide
-- Run these commands in the Supabase SQL Editor

-- 1. Create supervisors table if not exists
CREATE TABLE IF NOT EXISTS supervisors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    depot TEXT DEFAULT 'Washington',
    role TEXT CHECK (role IN ('admin', 'supervisor', 'manager')) DEFAULT 'supervisor',
    badge_number TEXT,
    is_active BOOLEAN DEFAULT true,
    pending_approval BOOLEAN DEFAULT false,
    signup_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    auth_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create breakdowns table if not exists
CREATE TABLE IF NOT EXISTS breakdowns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fleet_no TEXT NOT NULL,
    supervisor_id TEXT,
    supervisor_email TEXT,
    supervisor_name TEXT,
    wizard_type TEXT,
    status TEXT DEFAULT 'active',
    location_lat DECIMAL,
    location_lng DECIMAL,
    location_address TEXT,
    assessment_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Create wizard_progress table for tracking assessment steps
CREATE TABLE IF NOT EXISTS wizard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supervisor_id TEXT,
    supervisor_email TEXT,
    wizard_type TEXT NOT NULL,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    progress_data JSONB,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create fleet_vehicles table
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fleet_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    depot TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    registration TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert default supervisors (update passwords as needed)
INSERT INTO supervisors (email, name, depot, role, badge_number, is_active)
VALUES
    ('test@test.com', 'Test Supervisor', 'Washington', 'supervisor', 'TEST01', true),
    ('anthony.gair@gonortheast.co.uk', 'Anthony Gair', 'Washington', 'admin', 'AG003', true),
    ('lee.mutch@gonortheast.co.uk', 'Lee Mutch', 'Washington', 'admin', 'LM001', true),
    ('joshua.devlin@gonortheast.co.uk', 'Joshua Devlin', 'Washington', 'supervisor', 'JD002', true)
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    depot = EXCLUDED.depot,
    role = EXCLUDED.role,
    badge_number = EXCLUDED.badge_number,
    updated_at = NOW();

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);
CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor_email ON breakdowns(supervisor_email);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at ON breakdowns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wizard_progress_supervisor ON wizard_progress(supervisor_email);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no);

-- 7. Enable Row Level Security (RLS) - IMPORTANT FOR PRODUCTION
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for supervisors table
CREATE POLICY "Supervisors can view all active supervisors" ON supervisors
    FOR SELECT USING (is_active = true OR pending_approval = true);

CREATE POLICY "Allow signup for new supervisors" ON supervisors
    FOR INSERT WITH CHECK (
        pending_approval = true AND is_active = false
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can approve/update supervisors" ON supervisors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- 9. Create RLS policies for breakdowns table
CREATE POLICY "Users can view their own breakdowns" ON breakdowns
    FOR SELECT USING (
        supervisor_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can create breakdowns" ON breakdowns
    FOR INSERT WITH CHECK (
        supervisor_email = auth.jwt() ->> 'email'
    );

CREATE POLICY "Users can update their own breakdowns" ON breakdowns
    FOR UPDATE USING (
        supervisor_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- 10. Grant permissions
GRANT ALL ON supervisors TO authenticated;
GRANT ALL ON breakdowns TO authenticated;
GRANT ALL ON wizard_progress TO authenticated;
GRANT SELECT ON fleet_vehicles TO authenticated;

-- Note: After running these commands, create users in Supabase Authentication:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Invite User" or "Create User"
-- 3. Add users with emails from the supervisors table
-- 4. Set secure passwords for each user