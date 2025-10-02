-- Migration: Add updated_at column to breakdowns table
-- Description: Adds updated_at timestamp column required by Supabase triggers
-- Date: 2025-10-02

-- Add updated_at column if it doesn't exist
ALTER TABLE breakdowns
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_breakdowns_updated_at ON breakdowns;

CREATE TRIGGER update_breakdowns_updated_at
    BEFORE UPDATE ON breakdowns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at = created_at if null
UPDATE breakdowns
SET updated_at = created_at
WHERE updated_at IS NULL AND created_at IS NOT NULL;

COMMENT ON COLUMN breakdowns.updated_at IS 'Timestamp of last update to this breakdown record';
