-- Migration: 017_add_duty_context_to_breakdowns.sql
-- Purpose: Add duty context columns to breakdowns table for shift-based reporting
-- Date: December 20, 2025
-- Note: Run each statement separately in DBeaver if needed

-- Step 1: Add duty_code column (ignore error if already exists)
ALTER TABLE breakdowns
ADD COLUMN duty_code VARCHAR(10) DEFAULT NULL
COMMENT 'Duty code when breakdown was created (100, 200, 400, 500)';

-- Step 2: Add duty_name column (ignore error if already exists)
ALTER TABLE breakdowns
ADD COLUMN duty_name VARCHAR(50) DEFAULT NULL
COMMENT 'Duty name (Early Shift, Day Shift, Late Shift, Night Shift)';

-- Step 3: Add index for querying breakdowns by duty
CREATE INDEX idx_breakdowns_duty_code ON breakdowns(duty_code);

-- Step 4: Create view for duty-based breakdown statistics
CREATE OR REPLACE VIEW v_breakdowns_by_duty AS
SELECT
    duty_code,
    duty_name,
    COUNT(*) as total_breakdowns,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
    SUM(CASE WHEN status IN ('pending', 'in-progress') THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN severity = 'STOP' THEN 1 ELSE 0 END) as critical_count,
    AVG(TIMESTAMPDIFF(MINUTE, created_at, COALESCE(resolved_at, NOW()))) as avg_resolution_minutes,
    DATE(created_at) as breakdown_date
FROM breakdowns
WHERE duty_code IS NOT NULL
GROUP BY duty_code, duty_name, DATE(created_at)
ORDER BY breakdown_date DESC, duty_code;

-- Step 5: Create view for supervisor duty performance
CREATE OR REPLACE VIEW v_supervisor_duty_performance AS
SELECT
    supervisor_badge,
    supervisor_name,
    duty_code,
    duty_name,
    COUNT(*) as breakdowns_handled,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
    AVG(TIMESTAMPDIFF(MINUTE, created_at, COALESCE(resolved_at, NOW()))) as avg_response_minutes,
    MIN(created_at) as first_breakdown,
    MAX(created_at) as last_breakdown
FROM breakdowns
WHERE duty_code IS NOT NULL
GROUP BY supervisor_badge, supervisor_name, duty_code, duty_name
ORDER BY supervisor_badge, duty_code;

-- Verification query (run after all steps complete)
SELECT
    'duty_code column' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'breakdowns' AND column_name = 'duty_code'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT
    'duty_name column',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'breakdowns' AND column_name = 'duty_name'
    ) THEN 'EXISTS' ELSE 'MISSING' END;
