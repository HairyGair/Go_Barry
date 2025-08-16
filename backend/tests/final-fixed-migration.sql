-- Breakdown Tracking System V2 Complete Setup
-- FINAL FIXED VERSION - Handles all edge cases

-- 1. Drop existing functions if they exist (to handle return type changes)
DROP FUNCTION IF EXISTS get_next_breakdown_id();
DROP FUNCTION IF EXISTS create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);

-- 2. Create breakdowns table with all required columns
CREATE TABLE IF NOT EXISTS breakdowns (
    id SERIAL PRIMARY KEY,
    breakdown_id VARCHAR(20) UNIQUE NOT NULL,
    daily_id INTEGER NOT NULL DEFAULT 1,
    fleet_no VARCHAR(10),
    fleet_number VARCHAR(10),  -- Alias for fleet_no
    depot_id VARCHAR(10),
    route_id VARCHAR(20),
    location TEXT,
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving', 'cleared')),
    severity VARCHAR(20),
    supervisor_badge VARCHAR(10) NOT NULL,
    supervisor_name VARCHAR(100),
    wizard_type VARCHAR(50),
    wizard_path TEXT,
    wizard_steps JSONB,
    diagnosis TEXT,
    diagnosed_at TIMESTAMP,
    diagnosed_by VARCHAR(10),
    decision_time TIMESTAMP,  -- When STOP/AMBER/CONTINUE decision made
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    resolving_supervisor VARCHAR(10),
    returned_to_service_at TIMESTAMP,
    minutes_to_resolve INTEGER,
    is_repeat BOOLEAN DEFAULT FALSE,
    repeat_breakdown BOOLEAN DEFAULT FALSE,  -- Alias for is_repeat
    previous_breakdown_id VARCHAR(20),
    repeat_count INTEGER DEFAULT 0,
    is_priority BOOLEAN DEFAULT FALSE,
    escalated BOOLEAN DEFAULT FALSE,
    auto_escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,
    passenger_cloud_used BOOLEAN DEFAULT FALSE,
    returned_to_service BOOLEAN DEFAULT TRUE,
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add any missing columns to existing table (safe to run multiple times)
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='wizard_steps') THEN
        ALTER TABLE breakdowns ADD COLUMN wizard_steps JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='fleet_number') THEN
        ALTER TABLE breakdowns ADD COLUMN fleet_number VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='decision_time') THEN
        ALTER TABLE breakdowns ADD COLUMN decision_time TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='returned_to_service_at') THEN
        ALTER TABLE breakdowns ADD COLUMN returned_to_service_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='repeat_breakdown') THEN
        ALTER TABLE breakdowns ADD COLUMN repeat_breakdown BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='previous_breakdown_id') THEN
        ALTER TABLE breakdowns ADD COLUMN previous_breakdown_id VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='auto_escalated') THEN
        ALTER TABLE breakdowns ADD COLUMN auto_escalated BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Ensure id column exists and has a sequence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='id') THEN
        ALTER TABLE breakdowns ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- 4. Create priority services table
CREATE TABLE IF NOT EXISTS priority_services (
    id SERIAL PRIMARY KEY,
    route_number VARCHAR(20) NOT NULL UNIQUE,
    priority_level VARCHAR(50) DEFAULT 'high',
    color_code VARCHAR(7) DEFAULT '#FF0000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert priority routes
INSERT INTO priority_services (route_number, priority_level, color_code) 
VALUES 
    ('X10', 'critical', '#FF0000'),
    ('X21', 'critical', '#FF0000'),
    ('307', 'secured', '#FFA500'),
    ('1', 'important', '#FFFF00')
ON CONFLICT (route_number) DO NOTHING;

-- 6. Create NEW breakdown ID generation function
CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    last_id TEXT;
    last_number INTEGER;
    new_number INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the last breakdown ID for the current year
    SELECT breakdown_id INTO last_id
    FROM breakdowns
    WHERE breakdown_id LIKE 'BD-' || current_year || '-%'
    ORDER BY breakdown_id DESC
    LIMIT 1;
    
    IF last_id IS NULL THEN
        -- First breakdown of the year
        new_number := 1;
    ELSE
        -- Extract the number and increment
        last_number := CAST(SUBSTRING(last_id FROM 9) AS INTEGER);
        new_number := last_number + 1;
    END IF;
    
    -- Return formatted ID
    RETURN 'BD-' || current_year || '-' || LPAD(new_number::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 7. Create breakdown creation function with proper handling
CREATE OR REPLACE FUNCTION create_breakdown(
    p_fleet_number VARCHAR(10),
    p_supervisor_badge VARCHAR(10),
    p_supervisor_name VARCHAR(100),
    p_location TEXT,
    p_depot_id VARCHAR(10),
    p_wizard_type VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
    v_breakdown_id VARCHAR(20);
    v_daily_id INTEGER;
    v_result JSON;
BEGIN
    -- Generate breakdown ID
    v_breakdown_id := get_next_breakdown_id();
    
    -- Get daily ID (count of today's breakdowns + 1)
    SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_daily_id
    FROM breakdowns
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Insert the breakdown
    INSERT INTO breakdowns (
        breakdown_id,
        daily_id,
        fleet_no,
        fleet_number,
        supervisor_badge,
        supervisor_name,
        location,
        depot_id,
        wizard_type,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_breakdown_id,
        v_daily_id,
        p_fleet_number,
        p_fleet_number,
        p_supervisor_badge,
        p_supervisor_name,
        p_location,
        p_depot_id,
        p_wizard_type,
        'received',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Return result
    v_result := json_build_object(
        'success', true,
        'breakdown_id', v_breakdown_id,
        'daily_id', v_daily_id
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at ON breakdowns(created_at);
CREATE INDEX IF NOT EXISTS idx_breakdowns_depot_id ON breakdowns(depot_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_daily_id ON breakdowns(daily_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);

-- 9. Create or replace view for active breakdowns
CREATE OR REPLACE VIEW active_breakdowns AS
SELECT 
    b.*,
    CASE 
        WHEN b.diagnosed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - b.diagnosed_at)) / 60
        ELSE NULL
    END as minutes_since_diagnosis,
    ps.priority_level IS NOT NULL as is_priority_route
FROM breakdowns b
LEFT JOIN priority_services ps ON b.route_id = ps.route_number
WHERE b.status NOT IN ('cleared', 'resolved')
  AND (b.archived IS FALSE OR b.archived IS NULL)
ORDER BY b.created_at DESC;

-- 10. Grant permissions (handle if sequences exist)
DO $$
BEGIN
    -- Grant table permissions
    GRANT ALL ON breakdowns TO authenticated;
    GRANT ALL ON priority_services TO authenticated;
    GRANT ALL ON active_breakdowns TO authenticated;
    
    -- Grant sequence permissions if they exist
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'breakdowns_id_seq') THEN
        GRANT USAGE ON SEQUENCE breakdowns_id_seq TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'priority_services_id_seq') THEN
        GRANT USAGE ON SEQUENCE priority_services_id_seq TO authenticated;
    END IF;
END $$;

-- 11. Create a test breakdown to verify everything works
INSERT INTO breakdowns (
    breakdown_id,
    daily_id,
    fleet_no,
    fleet_number,
    supervisor_badge,
    supervisor_name,
    location,
    depot_id,
    wizard_type,
    status,
    severity,
    created_at
) VALUES (
    'BD-2025-TEST1',
    999,
    '6301',
    '6301',
    'AG003',
    'Anthony Gair',
    'Test Location - Newcastle',
    'Washington',
    'test_wizard',
    'received',
    'AMBER',
    CURRENT_TIMESTAMP
) ON CONFLICT (breakdown_id) DO NOTHING;

-- Final verification
SELECT 
    'Tables Check' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Tables created successfully!'
        ELSE '❌ Missing tables'
    END as result
FROM information_schema.tables 
WHERE table_name IN ('breakdowns', 'priority_services')
UNION ALL
SELECT 
    'Test Breakdown' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Test breakdown created!'
        ELSE '⚠️ Test breakdown not created (may already exist)'
    END as result
FROM breakdowns
WHERE breakdown_id = 'BD-2025-TEST1'
UNION ALL
SELECT 
    'Priority Routes' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Priority routes loaded!'
        ELSE '❌ Priority routes missing'
    END as result
FROM priority_services
WHERE route_number IN ('X10', 'X21');