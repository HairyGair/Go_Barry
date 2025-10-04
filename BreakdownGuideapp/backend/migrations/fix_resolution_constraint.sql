-- Fix Resolution Data Consistency Constraint
-- The original constraint expected status='cleared' but database uses status='resolved'
-- Date: 2025-10-04

-- Drop the old constraint that expects 'cleared' status
ALTER TABLE breakdowns
  DROP CONSTRAINT IF EXISTS resolution_data_consistency;

-- Add corrected constraint that works with 'resolved' status
ALTER TABLE breakdowns
  ADD CONSTRAINT resolution_data_consistency
  CHECK (
    (status = 'resolved' AND resolved_at IS NOT NULL) OR
    (status != 'resolved' AND resolved_at IS NULL) OR
    (status IS NULL)
  );

COMMENT ON CONSTRAINT resolution_data_consistency ON breakdowns IS 'Ensures resolved_at is set when status is resolved';
