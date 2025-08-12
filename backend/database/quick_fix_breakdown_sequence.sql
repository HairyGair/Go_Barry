-- QUICK FIX: Breakdown Sequence Collision Issue
-- Run this in your Supabase SQL Editor to immediately fix the sequence collision

-- 1. Check current state
SELECT 
    'CURRENT STATE ANALYSIS' as analysis_type,
    (SELECT last_value FROM breakdown_yearly_seq) as sequence_current_value,
    (SELECT COUNT(*) FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%') as existing_breakdown_count,
    (SELECT MAX(CAST(RIGHT(breakdown_id, 5) AS INTEGER)) FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%') as highest_id_number;

-- 2. Reset sequence to correct value
SELECT setval('breakdown_yearly_seq', 
    (SELECT COALESCE(MAX(CAST(RIGHT(breakdown_id, 5) AS INTEGER)), 0) + 1 
     FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%'), 
    false) as sequence_reset_to;

-- 3. Test the fix
SELECT get_next_breakdown_id() as next_safe_id;

-- 4. Verify no collision exists
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM breakdowns WHERE breakdown_id = get_next_breakdown_id()) 
        THEN 'COLLISION STILL EXISTS - MANUAL INTERVENTION NEEDED'
        ELSE 'SUCCESS - SEQUENCE FIXED'
    END as fix_status;