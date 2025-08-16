-- Fix for create_breakdown RPC function
-- Run this in Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);

-- Create the function properly
CREATE OR REPLACE FUNCTION create_breakdown(
    p_fleet_number VARCHAR(10),
    p_supervisor_badge VARCHAR(10),
    p_supervisor_name VARCHAR(100),
    p_location TEXT,
    p_depot_id VARCHAR(10),
    p_wizard_type VARCHAR(50)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION create_breakdown(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) TO service_role;

-- Test the function
SELECT create_breakdown(
    'TEST-FUNC',
    'AG003',
    'Test Function',
    'Test Location',
    'Washington',
    'test'
) as result;