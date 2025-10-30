-- ============================================================================
-- Audit Logs Table for Security Event Tracking
-- Created: 2025-10-26
-- Database: Supabase (PostgreSQL)
-- ============================================================================
-- Purpose: Track all security-related events for compliance and forensics
-- Supports: Login attempts, password changes, permission changes, data access
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Event classification
  event_type VARCHAR(50) NOT NULL,
  -- Event types: 'login_success', 'login_failed', 'logout', 'password_change',
  --              'password_reset', 'account_locked', 'account_unlocked',
  --              'permission_granted', 'permission_revoked', 'data_access',
  --              'data_modified', 'data_deleted', 'api_access', 'token_refresh'

  -- User identification
  supervisor_id BIGINT NULL,
  badge_number VARCHAR(10) NULL,
  -- NULL allowed for failed login attempts where user doesn't exist

  -- Request metadata
  ip_address VARCHAR(45) NULL,
  -- Supports both IPv4 (15 chars) and IPv6 (45 chars max)

  user_agent TEXT NULL,
  -- Full user agent string for device/browser fingerprinting

  -- Event outcome
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT NULL,
  -- Store error details for failed events

  -- Additional context (JSON format for flexibility)
  metadata JSONB NULL,
  -- Examples:
  -- {"route": "/api/breakdowns", "method": "POST"}
  -- {"previous_role": "supervisor", "new_role": "admin"}
  -- {"failed_attempts": 3, "lockout_duration": "15min"}
  -- {"token_type": "access", "expires_in": 3600}

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraint (soft delete safe)
  CONSTRAINT fk_audit_supervisor
    FOREIGN KEY (supervisor_id)
    REFERENCES supervisors(id)
    ON DELETE SET NULL
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Index on event_type for filtering by event category
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
ON audit_logs(event_type);

-- Index on supervisor_id for user-specific audit trails
CREATE INDEX IF NOT EXISTS idx_audit_logs_supervisor
ON audit_logs(supervisor_id)
WHERE supervisor_id IS NOT NULL;

-- Index on badge_number for quick lookup (includes failed attempts)
CREATE INDEX IF NOT EXISTS idx_audit_logs_badge
ON audit_logs(badge_number)
WHERE badge_number IS NOT NULL;

-- Index on created_at for time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Index on success status for filtering failed events
CREATE INDEX IF NOT EXISTS idx_audit_logs_success
ON audit_logs(success);

-- Composite index for failed login tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_logins
ON audit_logs(badge_number, created_at DESC)
WHERE event_type = 'login_failed' AND success = false;

-- Composite index for security monitoring (failed events by type)
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_monitor
ON audit_logs(event_type, success, created_at DESC)
WHERE success = false;

-- GIN index on metadata JSONB for flexible querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
ON audit_logs USING GIN (metadata);

-- Index on IP address for threat detection
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address
ON audit_logs(ip_address)
WHERE ip_address IS NOT NULL;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(50),
  p_supervisor_id BIGINT DEFAULT NULL,
  p_badge_number VARCHAR(10) DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO audit_logs (
    event_type,
    supervisor_id,
    badge_number,
    ip_address,
    user_agent,
    success,
    error_message,
    metadata
  ) VALUES (
    p_event_type,
    p_supervisor_id,
    p_badge_number,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Automatic Cleanup (Data Retention)
-- ============================================================================

-- Function to clean up old audit logs (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than retention period
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup
  INSERT INTO audit_logs (
    event_type,
    success,
    metadata
  ) VALUES (
    'audit_cleanup',
    true,
    jsonb_build_object(
      'retention_days', retention_days,
      'deleted_count', v_deleted_count
    )
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all audit logs
CREATE POLICY audit_logs_admin_all
ON audit_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM supervisors
    WHERE supervisors.id = auth.uid()::TEXT::BIGINT
    AND supervisors.role = 'admin'
    AND supervisors.is_active = true
  )
);

-- Policy: Supervisors can view their own audit logs
CREATE POLICY audit_logs_supervisor_own
ON audit_logs
FOR SELECT
TO authenticated
USING (
  supervisor_id = auth.uid()::TEXT::BIGINT
);

-- Policy: Service role has full access (for backend operations)
CREATE POLICY audit_logs_service_all
ON audit_logs
FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users (RLS handles authorization)
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Grant full access to service role (for backend operations)
GRANT ALL ON audit_logs TO service_role;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO service_role;

-- ============================================================================
-- Analyze table for query optimization
-- ============================================================================

ANALYZE audit_logs;

-- ============================================================================
-- Verification Queries:
-- ============================================================================
-- View all indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'audit_logs';
--
-- View RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
--
-- Test logging function:
-- SELECT log_security_event(
--   'login_success',
--   1,
--   'AG003',
--   '192.168.1.1',
--   'Mozilla/5.0...',
--   true,
--   NULL,
--   '{"location": "Newcastle"}'::jsonb
-- );
--
-- View recent failed logins:
-- SELECT * FROM audit_logs
-- WHERE event_type = 'login_failed'
-- ORDER BY created_at DESC
-- LIMIT 10;
-- ============================================================================
