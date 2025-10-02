-- Migration: Add Resolution Columns to Breakdowns Table
-- Description: Adds columns to support manual breakdown resolution/completion
-- Date: 2025-10-02

-- Add resolution columns to breakdowns table
ALTER TABLE breakdowns
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50) CHECK (resolution_type IN ('fixed', 'changeover', 'cancelled', 'duplicate', 'other')),
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS returned_to_service BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN breakdowns.resolved_at IS 'Timestamp when breakdown was manually resolved';
COMMENT ON COLUMN breakdowns.resolved_by IS 'Name or badge of supervisor who resolved the breakdown';
COMMENT ON COLUMN breakdowns.resolution_type IS 'Type of resolution: fixed, changeover, cancelled, duplicate, or other';
COMMENT ON COLUMN breakdowns.resolution_notes IS 'Optional notes about the resolution (max 1000 chars)';
COMMENT ON COLUMN breakdowns.returned_to_service IS 'Whether the vehicle was returned to service after resolution';

-- Create index for querying resolved breakdowns
CREATE INDEX IF NOT EXISTS idx_breakdowns_resolved_at ON breakdowns(resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_breakdowns_resolution_type ON breakdowns(resolution_type) WHERE resolution_type IS NOT NULL;

-- Add check constraint for resolution data consistency
ALTER TABLE breakdowns
  ADD CONSTRAINT resolution_data_consistency
  CHECK (
    (status = 'cleared' AND resolved_at IS NOT NULL) OR
    (status != 'cleared' AND resolved_at IS NULL) OR
    (status IS NULL)
  );

COMMENT ON CONSTRAINT resolution_data_consistency ON breakdowns IS 'Ensures resolved_at is set when status is cleared';
