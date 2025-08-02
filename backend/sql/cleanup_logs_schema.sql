-- Cleanup logs table schema for tracking dismissed alerts cleanup operations
-- Memory optimized for Render.com 2GB RAM constraint

-- Create cleanup_logs table for monitoring cleanup operations
CREATE TABLE IF NOT EXISTS cleanup_logs (
    id VARCHAR(100) PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL DEFAULT 'dismissed_alerts_cleanup',
    initiated_by VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    processed_tables JSONB DEFAULT '[]'::jsonb,
    errors JSONB DEFAULT '[]'::jsonb,
    dry_run BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_config JSONB DEFAULT '{}'::jsonb,
    
    -- Performance indexes
    CONSTRAINT cleanup_logs_id_check CHECK (LENGTH(id) > 0),
    CONSTRAINT cleanup_logs_operation_type_check CHECK (LENGTH(operation_type) > 0),
    CONSTRAINT cleanup_logs_initiated_by_check CHECK (LENGTH(initiated_by) > 0),
    CONSTRAINT cleanup_logs_execution_time_check CHECK (execution_time_ms >= 0),
    CONSTRAINT cleanup_logs_deleted_count_check CHECK (deleted_count >= 0)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_timestamp ON cleanup_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_operation_type ON cleanup_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_initiated_by ON cleanup_logs(initiated_by);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_dry_run ON cleanup_logs(dry_run);

-- Add table comments for documentation
COMMENT ON TABLE cleanup_logs IS 'Tracks dismissed alerts cleanup operations for monitoring and audit purposes';
COMMENT ON COLUMN cleanup_logs.id IS 'Unique identifier for the cleanup operation';
COMMENT ON COLUMN cleanup_logs.operation_type IS 'Type of cleanup operation (dismissed_alerts_cleanup, etc.)';
COMMENT ON COLUMN cleanup_logs.initiated_by IS 'Who or what initiated the cleanup (supervisor name, scheduler, etc.)';
COMMENT ON COLUMN cleanup_logs.execution_time_ms IS 'Time taken to complete the cleanup operation in milliseconds';
COMMENT ON COLUMN cleanup_logs.deleted_count IS 'Number of records actually deleted during the operation';
COMMENT ON COLUMN cleanup_logs.processed_tables IS 'JSON array of tables processed and their statistics';
COMMENT ON COLUMN cleanup_logs.errors IS 'JSON array of any errors encountered during cleanup';
COMMENT ON COLUMN cleanup_logs.dry_run IS 'Whether this was a dry run (no actual deletions)';
COMMENT ON COLUMN cleanup_logs.timestamp IS 'When the cleanup operation was performed';
COMMENT ON COLUMN cleanup_logs.retention_config IS 'Snapshot of retention configuration used for this cleanup';

-- Create a function to automatically clean old cleanup logs (keep last 1000 entries)
CREATE OR REPLACE FUNCTION cleanup_old_cleanup_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Keep only the latest 1000 cleanup log entries to prevent table bloat
    WITH old_logs AS (
        SELECT id 
        FROM cleanup_logs 
        ORDER BY timestamp DESC 
        OFFSET 1000
    )
    DELETE FROM cleanup_logs 
    WHERE id IN (SELECT id FROM old_logs);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the cleanup function
COMMENT ON FUNCTION cleanup_old_cleanup_logs() IS 'Automatically removes old cleanup log entries to prevent table bloat, keeping only the latest 1000 entries';

-- Example of how to run the cleanup logs maintenance (can be called periodically)
-- SELECT cleanup_old_cleanup_logs();

-- Create a view for recent cleanup statistics
CREATE OR REPLACE VIEW recent_cleanup_stats AS
SELECT 
    DATE_TRUNC('day', timestamp) as cleanup_date,
    operation_type,
    COUNT(*) as operation_count,
    SUM(deleted_count) as total_deleted,
    AVG(execution_time_ms) as avg_execution_time_ms,
    COUNT(*) FILTER (WHERE dry_run = true) as dry_run_count,
    COUNT(*) FILTER (WHERE dry_run = false) as actual_cleanup_count,
    COUNT(*) FILTER (WHERE JSONB_ARRAY_LENGTH(errors) > 0) as operations_with_errors
FROM cleanup_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), operation_type
ORDER BY cleanup_date DESC, operation_type;

COMMENT ON VIEW recent_cleanup_stats IS 'Provides aggregated statistics for cleanup operations over the last 30 days';

-- Example queries for monitoring:
-- 
-- Get recent cleanup operations:
-- SELECT * FROM cleanup_logs ORDER BY timestamp DESC LIMIT 10;
--
-- Get cleanup statistics for the last 7 days:
-- SELECT * FROM recent_cleanup_stats WHERE cleanup_date >= CURRENT_DATE - INTERVAL '7 days';
--
-- Check for cleanup operations with errors:
-- SELECT id, initiated_by, timestamp, errors FROM cleanup_logs WHERE JSONB_ARRAY_LENGTH(errors) > 0 ORDER BY timestamp DESC;
--
-- Get total records cleaned up this month:
-- SELECT SUM(deleted_count) as total_cleaned FROM cleanup_logs WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE);