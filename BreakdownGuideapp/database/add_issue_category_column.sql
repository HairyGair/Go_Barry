-- Add missing issue_category column to breakdowns table
-- This column is required for the wizard-to-dashboard integration

ALTER TABLE breakdowns
ADD COLUMN IF NOT EXISTS issue_category VARCHAR(100);

-- Add a comment to describe the column
COMMENT ON COLUMN breakdowns.issue_category IS 'Category of the breakdown issue (e.g., Steering System, Braking System, Electrical System)';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'breakdowns'
AND column_name = 'issue_category';