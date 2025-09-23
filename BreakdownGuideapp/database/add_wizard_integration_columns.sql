-- Migration: Add missing columns for wizard integration
-- Date: September 19, 2025
-- Purpose: Add missing columns needed for wizard-to-breakdown integration

-- Add missing columns that are required by the from-wizard endpoint
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS fleet_no VARCHAR(20);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS supervisor_badge VARCHAR(10);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_decision VARCHAR(10);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_type VARCHAR(50);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add NOT NULL constraint to fleet_no since it's required
-- First update any existing NULL values
UPDATE breakdowns SET fleet_no = 'UNKNOWN' WHERE fleet_no IS NULL;
-- Then add the constraint
ALTER TABLE breakdowns ALTER COLUMN fleet_no SET NOT NULL;

-- Add NOT NULL constraint to supervisor_badge since it's required
-- First update any existing NULL values
UPDATE breakdowns SET supervisor_badge = 'UNKNOWN' WHERE supervisor_badge IS NULL;
-- Then add the constraint
ALTER TABLE breakdowns ALTER COLUMN supervisor_badge SET NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN breakdowns.fleet_no IS 'Fleet number of the vehicle (e.g., 70123) - Required field';
COMMENT ON COLUMN breakdowns.supervisor_badge IS 'Badge number of the supervisor handling the breakdown - Required field';
COMMENT ON COLUMN breakdowns.wizard_decision IS 'Decision made by the SDC wizard (STOP, AMBER, CONTINUE)';
COMMENT ON COLUMN breakdowns.wizard_type IS 'Type of wizard that generated this breakdown (e.g., SDC_Guide, Engine_Assessment)';
COMMENT ON COLUMN breakdowns.generation_metadata IS 'Metadata about how this breakdown record was generated';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'breakdowns'
AND column_name IN ('fleet_no', 'supervisor_badge', 'wizard_decision', 'wizard_type', 'generation_metadata')
ORDER BY column_name;