#!/bin/bash
# Script to verify and fix activity logs table structure

echo "🔍 Checking Activity Logs Table Structure..."

# SQL to check the current structure
cat > check-activity-logs.sql << 'EOF'
-- Check if activity_logs table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'activity_logs'
ORDER BY 
    ordinal_position;

-- Check if there are any activity logs
SELECT COUNT(*) as total_logs FROM activity_logs;

-- Show recent activities
SELECT 
    id,
    action,
    supervisor_name,
    screen_type,
    created_at,
    details
FROM 
    activity_logs
ORDER BY 
    created_at DESC
LIMIT 5;
EOF

echo "SQL script created. Run this in Supabase SQL editor to check the table structure."
echo ""
echo "If the 'details' column is TEXT instead of JSONB, run this fix:"
echo ""
cat > fix-activity-logs.sql << 'EOF'
-- Convert details column to JSONB if it's not already
ALTER TABLE activity_logs 
ALTER COLUMN details TYPE jsonb 
USING details::jsonb;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_supervisor_name ON activity_logs(supervisor_name);
EOF

echo "Fix SQL also created in fix-activity-logs.sql"
