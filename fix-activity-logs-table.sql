-- Check and fix activity_logs table in Supabase

-- 1. Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'activity_logs'
ORDER BY 
    ordinal_position;

-- 2. If 'details' column is TEXT instead of JSONB, fix it:
-- Uncomment and run this if needed:
/*
ALTER TABLE activity_logs 
ALTER COLUMN details TYPE jsonb 
USING CASE 
    WHEN details IS NULL THEN NULL
    WHEN details::text = '' THEN '{}'::jsonb
    ELSE details::jsonb
END;
*/

-- 3. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_supervisor_name ON activity_logs(supervisor_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_screen_type ON activity_logs(screen_type);

-- 4. Check recent activities
SELECT 
    id,
    action,
    supervisor_name,
    details,
    screen_type,
    created_at
FROM 
    activity_logs
ORDER BY 
    created_at DESC
LIMIT 10;

-- 5. Insert test activity to verify it works
INSERT INTO activity_logs (
    action,
    supervisor_name,
    supervisor_id,
    details,
    screen_type,
    created_at
) VALUES (
    'test_activity',
    'System Test',
    'system',
    '{"test": true, "message": "Testing activity log table"}'::jsonb,
    'supervisor',
    NOW()
);

-- 6. Verify the test was inserted
SELECT * FROM activity_logs WHERE action = 'test_activity' ORDER BY created_at DESC LIMIT 1;
