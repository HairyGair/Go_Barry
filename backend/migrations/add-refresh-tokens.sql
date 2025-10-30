-- ============================================================================
-- Refresh Tokens Table for JWT Token Management
-- Created: 2025-10-26
-- Database: Supabase (PostgreSQL)
-- ============================================================================
-- Purpose: Manage long-lived refresh tokens for secure session management
-- Supports: Token rotation, revocation, and device tracking
-- Security: Stores hashed tokens, not plaintext
-- ============================================================================

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,

  -- Token identification (stored as SHA-256 hash, not plaintext)
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  -- SHA-256 hash of the actual refresh token (always 64 hex characters)

  -- User association
  supervisor_id BIGINT NOT NULL,
  -- Foreign key to supervisors table

  -- Token lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  -- Expiration timestamp (typically 7-30 days from creation)

  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  -- Manual revocation flag (logout, security incident, etc.)

  revoked_at TIMESTAMPTZ NULL,
  -- When the token was revoked (NULL if still active)

  revoked_reason VARCHAR(100) NULL,
  -- Why the token was revoked: 'user_logout', 'admin_action', 'security_incident', 'token_rotation'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- When the refresh token was first issued

  last_used_at TIMESTAMPTZ NULL,
  -- Last time this token was used to refresh access token

  -- Device/session tracking
  ip_address VARCHAR(45) NULL,
  -- IP address when token was created (IPv4/IPv6)

  user_agent TEXT NULL,
  -- User agent string for device identification

  device_fingerprint VARCHAR(64) NULL,
  -- Optional device fingerprint hash for additional security

  -- Metadata
  metadata JSONB NULL,
  -- Additional context:
  -- {"device_type": "mobile", "os": "iOS 17", "app_version": "1.2.3"}
  -- {"location": "Newcastle", "depot": "WASHINGTON"}

  -- Foreign key constraint
  CONSTRAINT fk_refresh_token_supervisor
    FOREIGN KEY (supervisor_id)
    REFERENCES supervisors(id)
    ON DELETE CASCADE
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Index on token_hash for fast token lookup (most critical)
-- This is used in every token refresh request
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
ON refresh_tokens(token_hash);

-- Index on supervisor_id for user session management
-- Used to list/revoke all tokens for a user
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_supervisor
ON refresh_tokens(supervisor_id);

-- Index on expires_at for cleanup and validation
-- Used to efficiently delete expired tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
ON refresh_tokens(expires_at);

-- Index on revoked status for filtering active tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked
ON refresh_tokens(revoked);

-- Composite index for active token validation
-- Optimizes: WHERE token_hash = ? AND revoked = false AND expires_at > NOW()
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
ON refresh_tokens(token_hash, revoked, expires_at)
WHERE revoked = false AND expires_at > NOW();

-- Index on created_at for session history
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at
ON refresh_tokens(created_at DESC);

-- Index on last_used_at for inactive session detection
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_last_used
ON refresh_tokens(last_used_at DESC NULLS LAST)
WHERE last_used_at IS NOT NULL;

-- Index on IP address for security monitoring
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_ip_address
ON refresh_tokens(ip_address)
WHERE ip_address IS NOT NULL;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to create a new refresh token
CREATE OR REPLACE FUNCTION create_refresh_token(
  p_token_hash VARCHAR(64),
  p_supervisor_id BIGINT,
  p_expires_at TIMESTAMPTZ,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint VARCHAR(64) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_token_id BIGINT;
BEGIN
  -- Insert new refresh token
  INSERT INTO refresh_tokens (
    token_hash,
    supervisor_id,
    expires_at,
    ip_address,
    user_agent,
    device_fingerprint,
    metadata
  ) VALUES (
    p_token_hash,
    p_supervisor_id,
    p_expires_at,
    p_ip_address,
    p_user_agent,
    p_device_fingerprint,
    p_metadata
  )
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use a refresh token
CREATE OR REPLACE FUNCTION use_refresh_token(p_token_hash VARCHAR(64))
RETURNS TABLE (
  token_id BIGINT,
  supervisor_id BIGINT,
  is_valid BOOLEAN,
  error_reason VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id,
    rt.supervisor_id,
    CASE
      WHEN rt.id IS NULL THEN FALSE
      WHEN rt.revoked THEN FALSE
      WHEN rt.expires_at < NOW() THEN FALSE
      ELSE TRUE
    END as is_valid,
    CASE
      WHEN rt.id IS NULL THEN 'token_not_found'
      WHEN rt.revoked THEN 'token_revoked'
      WHEN rt.expires_at < NOW() THEN 'token_expired'
      ELSE NULL
    END as error_reason
  FROM refresh_tokens rt
  WHERE rt.token_hash = p_token_hash
  FOR UPDATE; -- Lock row for update

  -- Update last_used_at if token is valid
  UPDATE refresh_tokens
  SET last_used_at = NOW()
  WHERE token_hash = p_token_hash
    AND revoked = false
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to revoke a refresh token
CREATE OR REPLACE FUNCTION revoke_refresh_token(
  p_token_hash VARCHAR(64),
  p_reason VARCHAR(100) DEFAULT 'user_logout'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE refresh_tokens
  SET
    revoked = true,
    revoked_at = NOW(),
    revoked_reason = p_reason
  WHERE token_hash = p_token_hash
    AND revoked = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all tokens for a supervisor
CREATE OR REPLACE FUNCTION revoke_all_supervisor_tokens(
  p_supervisor_id BIGINT,
  p_reason VARCHAR(100) DEFAULT 'admin_action'
)
RETURNS INTEGER AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE refresh_tokens
  SET
    revoked = true,
    revoked_at = NOW(),
    revoked_reason = p_reason
  WHERE supervisor_id = p_supervisor_id
    AND revoked = false;

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  RETURN v_affected;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Automatic Cleanup Functions
-- ============================================================================

-- Function to clean up expired tokens (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired tokens older than 30 days
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up revoked tokens (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_revoked_tokens(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete revoked tokens older than specified days
  DELETE FROM refresh_tokens
  WHERE revoked = true
    AND revoked_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger to automatically set revoked_at when revoked flag changes
CREATE OR REPLACE FUNCTION set_revoked_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.revoked = true AND OLD.revoked = false THEN
    NEW.revoked_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_revoked_timestamp
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION set_revoked_timestamp();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on refresh_tokens table
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all refresh tokens
CREATE POLICY refresh_tokens_admin_all
ON refresh_tokens
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

-- Policy: Supervisors can view their own refresh tokens
CREATE POLICY refresh_tokens_supervisor_own
ON refresh_tokens
FOR SELECT
TO authenticated
USING (
  supervisor_id = auth.uid()::TEXT::BIGINT
);

-- Policy: Service role has full access (for backend token operations)
CREATE POLICY refresh_tokens_service_all
ON refresh_tokens
FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users (RLS handles authorization)
GRANT SELECT ON refresh_tokens TO authenticated;

-- Grant full access to service role (for backend operations)
GRANT ALL ON refresh_tokens TO service_role;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO service_role;

-- ============================================================================
-- Analyze table for query optimization
-- ============================================================================

ANALYZE refresh_tokens;

-- ============================================================================
-- Verification Queries:
-- ============================================================================
-- View all indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'refresh_tokens';
--
-- View active tokens for a user:
-- SELECT * FROM refresh_tokens
-- WHERE supervisor_id = 1
--   AND revoked = false
--   AND expires_at > NOW()
-- ORDER BY created_at DESC;
--
-- Test token creation:
-- SELECT create_refresh_token(
--   'abc123def456...',  -- SHA-256 hash
--   1,                   -- supervisor_id
--   NOW() + INTERVAL '7 days',
--   '192.168.1.1',
--   'Mozilla/5.0...'
-- );
--
-- Test token validation:
-- SELECT * FROM use_refresh_token('abc123def456...');
--
-- Revoke a token:
-- SELECT revoke_refresh_token('abc123def456...', 'user_logout');
--
-- Revoke all tokens for a supervisor:
-- SELECT revoke_all_supervisor_tokens(1, 'security_incident');
--
-- Clean up expired tokens:
-- SELECT cleanup_expired_tokens();
-- ============================================================================
