-- Breakdown Cleanup Job for 30-day Retention
-- Migration Date: 2025-10-04
-- Purpose: Delete resolved breakdowns older than 30 days

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_breakdowns()
RETURNS TABLE (
  deleted_count INTEGER,
  cleanup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
AS
$$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM breakdowns
  WHERE status = 'resolved'
    AND resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN QUERY SELECT rows_deleted, NOW();
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION cleanup_old_breakdowns() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_breakdowns() TO service_role;
