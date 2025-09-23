-- Migration: Add issue_category column to breakdowns table
-- Date: September 19, 2025
-- Purpose: Fix wizard-to-breakdown integration by adding missing issue_category column

-- Add the issue_category column if it doesn't exist
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_category VARCHAR(100);

-- Verify the column was added by selecting from the table
-- This will return an empty result set but confirms the column exists
SELECT issue_category FROM breakdowns LIMIT 0;

-- Add a comment to document the column purpose
COMMENT ON COLUMN breakdowns.issue_category IS 'Category of the breakdown issue from SDC wizard assessment (e.g., Steering System, Braking System, Electrical System, Engine Issues, General Assessment)';