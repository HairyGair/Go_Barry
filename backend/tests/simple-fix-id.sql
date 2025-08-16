-- Simplest fix - just make get_next_breakdown_id start from a known good number

DROP FUNCTION IF EXISTS get_next_breakdown_id();

CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    max_number INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Find the maximum numeric suffix, defaulting to 1 if none found
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN SUBSTRING(breakdown_id FROM 9) ~ '^\d+$' THEN
                    CAST(SUBSTRING(breakdown_id FROM 9) AS INTEGER)
                ELSE 0
            END
        ), 
        1  -- Start from 1 if no valid IDs found
    ) INTO max_number
    FROM breakdowns
    WHERE breakdown_id LIKE 'BD-' || current_year || '-%';
    
    -- Return next ID
    RETURN 'BD-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT get_next_breakdown_id() as next_id;

-- Now test creating a breakdown
SELECT create_breakdown(
    '6305',
    'AG003', 
    'Test After Fix',
    'Test Location',
    'Washington',
    'test'
) as result;