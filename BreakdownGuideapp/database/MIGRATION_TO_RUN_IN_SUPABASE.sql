-- =================================================
-- CRITICAL: Run this SQL in your Supabase SQL Editor
-- =================================================
-- This migration adds the missing columns needed for wizard integration
-- and fixes the NOT NULL constraints that are blocking breakdown creation.

-- Step 1: Add missing columns that the API expects
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS fleet_no VARCHAR(20);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS supervisor_badge VARCHAR(10);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_description TEXT;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_decision VARCHAR(10);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_type VARCHAR(50);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Step 2: Update any existing records with NULL values in required fields
UPDATE breakdowns SET fleet_no = 'UNKNOWN' WHERE fleet_no IS NULL;
UPDATE breakdowns SET supervisor_badge = 'UNKNOWN' WHERE supervisor_badge IS NULL;

-- Step 3: Make required fields NOT NULL (but allow them to be nullable for new records during testing)
-- We'll make them NOT NULL after we fix the API mapping
-- ALTER TABLE breakdowns ALTER COLUMN fleet_no SET NOT NULL;
-- ALTER TABLE breakdowns ALTER COLUMN supervisor_badge SET NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN breakdowns.fleet_no IS 'Fleet number of the vehicle (e.g., 70123)';
COMMENT ON COLUMN breakdowns.supervisor_badge IS 'Badge number of the supervisor handling the breakdown';
COMMENT ON COLUMN breakdowns.issue_description IS 'Detailed description of the breakdown issue';
COMMENT ON COLUMN breakdowns.wizard_decision IS 'Decision made by the SDC wizard (STOP, AMBER, CONTINUE)';
COMMENT ON COLUMN breakdowns.wizard_type IS 'Type of wizard that generated this breakdown (e.g., SDC_Guide)';
COMMENT ON COLUMN breakdowns.generation_metadata IS 'Metadata about how this breakdown record was generated';

-- Step 5: Verify the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'breakdowns'
AND column_name IN ('fleet_no', 'supervisor_badge', 'issue_description', 'wizard_decision', 'wizard_type', 'generation_metadata')
ORDER BY column_name;