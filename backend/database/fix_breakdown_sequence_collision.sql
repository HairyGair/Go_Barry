-- Fix Breakdown Sequence Collision Issue
-- This script resolves the sequence collision where breakdown_yearly_seq
-- is trying to create IDs that already exist (e.g., BD-2025-00008)

-- Step 1: Analyze current sequence state
DO $$
DECLARE
    current_seq_value INTEGER;
    highest_existing_id INTEGER;
    breakdown_count INTEGER;
BEGIN
    -- Get current sequence value
    SELECT last_value INTO current_seq_value FROM breakdown_yearly_seq;
    RAISE NOTICE 'Current sequence value: %', current_seq_value;
    
    -- Count total breakdown records
    SELECT COUNT(*) INTO breakdown_count FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%';
    RAISE NOTICE 'Total breakdown records for 2025: %', breakdown_count;
    
    -- Find highest existing breakdown ID number for 2025
    SELECT COALESCE(MAX(CAST(RIGHT(breakdown_id, 5) AS INTEGER)), 0) 
    INTO highest_existing_id
    FROM breakdowns 
    WHERE breakdown_id LIKE 'BD-2025-%';
    
    RAISE NOTICE 'Highest existing breakdown ID number: %', highest_existing_id;
    RAISE NOTICE 'Next sequence should start at: %', highest_existing_id + 1;
END $$;

-- Step 2: Get detailed breakdown of existing IDs
SELECT 
    breakdown_id,
    CAST(RIGHT(breakdown_id, 5) AS INTEGER) as id_number,
    fleet_no,
    supervisor_badge,
    created_at
FROM breakdowns 
WHERE breakdown_id LIKE 'BD-2025-%'
ORDER BY CAST(RIGHT(breakdown_id, 5) AS INTEGER) DESC
LIMIT 10;

-- Step 3: Reset the sequence to the correct value
DO $$
DECLARE
    highest_existing_id INTEGER;
    next_sequence_value INTEGER;
BEGIN
    -- Find the highest existing breakdown ID number for 2025
    SELECT COALESCE(MAX(CAST(RIGHT(breakdown_id, 5) AS INTEGER)), 0) 
    INTO highest_existing_id
    FROM breakdowns 
    WHERE breakdown_id LIKE 'BD-2025-%';
    
    -- Calculate next sequence value (highest + 1)
    next_sequence_value := highest_existing_id + 1;
    
    -- Reset the sequence
    PERFORM setval('breakdown_yearly_seq', next_sequence_value, false);
    
    RAISE NOTICE 'Sequence reset to start at: %', next_sequence_value;
    RAISE NOTICE 'Next breakdown ID will be: BD-2025-%', LPAD(next_sequence_value::TEXT, 5, '0');
END $$;

-- Step 4: Test the fix by calling the function
SELECT get_next_breakdown_id() as next_breakdown_id;

-- Step 5: Verify the sequence is working correctly
DO $$
DECLARE
    test_id1 VARCHAR(20);
    test_id2 VARCHAR(20);
    test_id3 VARCHAR(20);
BEGIN
    -- Generate three test IDs to verify sequence
    test_id1 := get_next_breakdown_id();
    test_id2 := get_next_breakdown_id();
    test_id3 := get_next_breakdown_id();
    
    RAISE NOTICE 'Test ID 1: %', test_id1;
    RAISE NOTICE 'Test ID 2: %', test_id2;
    RAISE NOTICE 'Test ID 3: %', test_id3;
    
    -- Check if any of these IDs already exist (should be 0)
    IF EXISTS(SELECT 1 FROM breakdowns WHERE breakdown_id IN (test_id1, test_id2, test_id3)) THEN
        RAISE WARNING 'COLLISION DETECTED: One or more test IDs already exist in database!';
    ELSE
        RAISE NOTICE 'SUCCESS: All test IDs are unique and safe to use';
    END IF;
END $$;

-- Step 6: Enhanced year-change handling function
CREATE OR REPLACE FUNCTION get_next_breakdown_id_with_year_reset()
RETURNS VARCHAR(20) AS $$
DECLARE
    current_year INTEGER;
    next_seq INTEGER;
    highest_existing_id INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Check if we need to reset sequence for new year
    IF current_year > 2025 THEN
        -- For future years, always reset sequence to 1
        next_seq := 1;
        
        -- Reset the sequence for the new year
        PERFORM setval('breakdown_yearly_seq', 1, false);
        
    ELSE
        -- For current year (2025), ensure sequence doesn't conflict with existing data
        SELECT COALESCE(MAX(CAST(RIGHT(breakdown_id, 5) AS INTEGER)), 0) + 1
        INTO highest_existing_id
        FROM breakdowns 
        WHERE breakdown_id LIKE ('BD-' || current_year || '-%');
        
        -- Get next sequence value
        next_seq := nextval('breakdown_yearly_seq');
        
        -- If sequence is behind existing data, reset it
        IF next_seq <= COALESCE(highest_existing_id - 1, 0) THEN
            PERFORM setval('breakdown_yearly_seq', highest_existing_id, false);
            next_seq := nextval('breakdown_yearly_seq');
        END IF;
    END IF;
    
    RETURN 'BD-' || current_year || '-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update the original function to use enhanced logic
CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN get_next_breakdown_id_with_year_reset();
END;
$$ LANGUAGE plpgsql;

-- Step 8: Final verification - create a test breakdown record
INSERT INTO breakdowns (
    id,
    breakdown_id,
    fleet_no,
    supervisor_badge,
    supervisor_id,
    status,
    severity,
    depot_id,
    created_at
) VALUES (
    gen_random_uuid(),
    get_next_breakdown_id(),
    'TEST-VEHICLE',
    'AG003',
    'Sequence Test',
    'resolved',
    'AMBER',
    'Washington',
    NOW()
) RETURNING breakdown_id, created_at;

-- Show summary of the fix
SELECT 
    'SEQUENCE FIX SUMMARY' as status,
    (SELECT last_value FROM breakdown_yearly_seq) as current_sequence_value,
    (SELECT COUNT(*) FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%') as total_2025_breakdowns,
    (SELECT MAX(breakdown_id) FROM breakdowns WHERE breakdown_id LIKE 'BD-2025-%') as highest_breakdown_id,
    get_next_breakdown_id() as next_available_id;