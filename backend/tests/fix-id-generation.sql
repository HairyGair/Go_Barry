-- Fix get_next_breakdown_id to handle non-numeric IDs
-- This handles the BD-2025-TEST1 issue

-- Drop and recreate the function
DROP FUNCTION IF EXISTS get_next_breakdown_id();

CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    last_id TEXT;
    last_number INTEGER;
    new_number INTEGER;
    extracted_text TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the last breakdown ID for the current year (excluding TEST entries)
    SELECT breakdown_id INTO last_id
    FROM breakdowns
    WHERE breakdown_id LIKE 'BD-' || current_year || '-%'
      AND breakdown_id NOT LIKE '%TEST%'  -- Exclude test entries
      AND breakdown_id ~ 'BD-\d{4}-\d{5}$'  -- Only match proper format (BD-YYYY-NNNNN)
    ORDER BY breakdown_id DESC
    LIMIT 1;
    
    IF last_id IS NULL THEN
        -- No valid breakdowns found, check for any numeric ones
        SELECT breakdown_id INTO last_id
        FROM breakdowns
        WHERE breakdown_id LIKE 'BD-' || current_year || '-%'
          AND LENGTH(breakdown_id) = 13  -- BD-2025-00001 format
        ORDER BY 
            CASE 
                WHEN breakdown_id ~ 'BD-\d{4}-\d{5}$' THEN 
                    CAST(SUBSTRING(breakdown_id FROM 9) AS INTEGER)
                ELSE 0
            END DESC
        LIMIT 1;
    END IF;
    
    IF last_id IS NULL THEN
        -- First breakdown of the year
        new_number := 1;
    ELSE
        -- Extract the number part safely
        BEGIN
            extracted_text := SUBSTRING(last_id FROM 9);
            -- Only try to convert if it's actually numeric
            IF extracted_text ~ '^\d+$' THEN
                last_number := CAST(extracted_text AS INTEGER);
                new_number := last_number + 1;
            ELSE
                -- If not numeric, find the highest numeric one
                SELECT COALESCE(MAX(
                    CAST(SUBSTRING(breakdown_id FROM 9) AS INTEGER)
                ), 0) + 1 INTO new_number
                FROM breakdowns
                WHERE breakdown_id LIKE 'BD-' || current_year || '-%'
                  AND breakdown_id ~ 'BD-\d{4}-\d{5}$';
                
                -- If still null, start at 1
                IF new_number IS NULL THEN
                    new_number := 1;
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- If any error, find the max numeric ID
                SELECT COALESCE(MAX(
                    CAST(SUBSTRING(breakdown_id FROM 9) AS INTEGER)
                ), 0) + 1 INTO new_number
                FROM breakdowns
                WHERE breakdown_id LIKE 'BD-' || current_year || '-%'
                  AND breakdown_id ~ 'BD-\d{4}-\d{5}$';
                
                -- If still null, start at 1
                IF new_number IS NULL THEN
                    new_number := 1;
                END IF;
        END;
    END IF;
    
    -- Return formatted ID
    RETURN 'BD-' || current_year || '-' || LPAD(new_number::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT get_next_breakdown_id() as next_id;

-- Verify it works by checking what IDs exist
SELECT 
    breakdown_id,
    CASE 
        WHEN breakdown_id ~ 'BD-\d{4}-\d{5}$' THEN 'Valid Format'
        WHEN breakdown_id LIKE '%TEST%' THEN 'Test Entry'
        ELSE 'Invalid Format'
    END as id_type
FROM breakdowns
ORDER BY 
    CASE 
        WHEN breakdown_id ~ 'BD-\d{4}-\d{5}$' THEN 1
        WHEN breakdown_id LIKE '%TEST%' THEN 2
        ELSE 3
    END,
    breakdown_id DESC
LIMIT 10;

-- Now test creating a breakdown
SELECT create_breakdown(
    'TEST-6305',
    'AG003',
    'Test After Fix',
    'Test Location',
    'Washington',
    'test'
) as result;