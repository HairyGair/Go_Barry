-- Fix duplicate create_breakdown functions
-- This will remove ALL versions and create just ONE

-- Step 1: Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_breakdown(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_breakdown(VARCHAR(10), VARCHAR(10), VARCHAR(100), TEXT, VARCHAR(10), VARCHAR(50));

-- Drop any other variants that might exist
DO $$
BEGIN
    -- Drop all functions named create_breakdown regardless of parameters
    EXECUTE (
        SELECT string_agg('DROP FUNCTION ' || oid::regprocedure || ';', ' ')
        FROM pg_proc
        WHERE proname = 'create_breakdown'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if no functions exist
        NULL;
END $$;

-- Step 2: Create ONE clean version with TEXT parameters (most flexible)
CREATE OR REPLACE FUNCTION create_breakdown(
    p_fleet_number TEXT,
    p_supervisor_badge TEXT,
    p_supervisor_name TEXT,
    p_location TEXT,
    p_depot_id TEXT,
    p_wizard_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_breakdown_id VARCHAR(20);
    v_daily_id INTEGER;
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
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'breakdown_id', v_breakdown_id,
        'daily_id', v_daily_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION create_breakdown(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_breakdown(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_breakdown(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Step 4: Verify only ONE function exists
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters
FROM pg_proc
WHERE proname = 'create_breakdown';

-- Step 5: Test the function
SELECT create_breakdown(
    'TEST-FIXED',
    'AG003',
    'Fixed Function Test',
    'Test Location',
    'Washington',
    'test'
) as result;