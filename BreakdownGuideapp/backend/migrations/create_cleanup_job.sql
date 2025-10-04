-- Breakdown Cleanup Job for 30-day Retention
-- Migration Date: 2025-10-04
-- Purpose: Delete resolved breakdowns older than 30 days

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_breakdowns()
RETURNS TABLE (
  deleted_count INTEGER,
  cleanup_date TIMESTAMPTZ
) AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  -- Delete breakdowns that are resolved/cleared and older than 30 days
  DELETE FROM breakdowns
  WHERE status IN ('resolved', 'cleared')
    AND resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  -- Log the cleanup operation
  RAISE NOTICE '🗑️  Cleaned up % old breakdowns', rows_deleted;

  RETURN QUERY SELECT rows_deleted, NOW();
END;
$$ LANGUAGE plpgsql;

-- OPTION 1: Using pg_cron (if available on Supabase)
-- Uncomment the following lines if pg_cron extension is enabled:

/*
-- Enable pg_cron extension (run as superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-old-breakdowns',
  '0 3 * * *',
  $$SELECT cleanup_old_breakdowns();$$
);
*/

-- OPTION 2: Manual execution
-- Run this periodically (daily recommended):
-- SELECT * FROM cleanup_old_breakdowns();

-- OPTION 3: Supabase Edge Function
-- Create a Supabase Edge Function that calls this function and trigger it via cron-job.org or similar

-- Grant execution permission
GRANT EXECUTE ON FUNCTION cleanup_old_breakdowns() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_breakdowns() TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cleanup function created successfully';
  RAISE NOTICE '📅 Function: cleanup_old_breakdowns()';
  RAISE NOTICE '🔄 Retention period: 30 days';
  RAISE NOTICE '📝 Run manually with: SELECT * FROM cleanup_old_breakdowns();';
END $$;
