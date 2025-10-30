-- ============================================================================
-- Verify and Update Supervisors Table Structure
-- Created: 2025-10-26
-- Database: Supabase (PostgreSQL)
-- ============================================================================
-- Purpose: Ensure supervisors table has all required columns for security
-- This migration is idempotent - safe to run multiple times
-- ============================================================================

-- Create supervisors table if it doesn't exist
CREATE TABLE IF NOT EXISTS supervisors (
  id BIGSERIAL PRIMARY KEY,
  badge_number VARCHAR(10) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'supervisor',
  depot VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist (PostgreSQL 11+)
DO $$
BEGIN
  -- Add badge_number if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'badge_number'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN badge_number VARCHAR(10) NOT NULL UNIQUE;
  END IF;

  -- Add password_hash if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN password_hash VARCHAR(255) NOT NULL;
  END IF;

  -- Add name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'name'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN name VARCHAR(100) NOT NULL;
  END IF;

  -- Add email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'email'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN email VARCHAR(100) NOT NULL UNIQUE;
  END IF;

  -- Add role if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'role'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'supervisor';
  END IF;

  -- Add depot if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'depot'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN depot VARCHAR(50) NOT NULL;
  END IF;

  -- Add is_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

END $$;

-- ============================================================================
-- Additional Security Columns (Optional but Recommended)
-- ============================================================================

-- Add last_login timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN last_login_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Add failed login attempts counter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add account lockout timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN locked_until TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Add password change timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supervisors' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE supervisors ADD COLUMN password_changed_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- ============================================================================
-- Constraints and Validation
-- ============================================================================

-- Ensure badge_number is uppercase
DO $$
BEGIN
  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'supervisors_badge_uppercase'
  ) THEN
    ALTER TABLE supervisors
    ADD CONSTRAINT supervisors_badge_uppercase
    CHECK (badge_number = UPPER(badge_number));
  END IF;
END $$;

-- Ensure email is valid format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'supervisors_email_format'
  ) THEN
    ALTER TABLE supervisors
    ADD CONSTRAINT supervisors_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Ensure role is valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'supervisors_role_check'
  ) THEN
    ALTER TABLE supervisors
    ADD CONSTRAINT supervisors_role_check
    CHECK (role IN ('supervisor', 'admin', 'manager'));
  END IF;
END $$;

-- ============================================================================
-- Triggers for Automatic Timestamp Updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_supervisors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_supervisors_updated_at ON supervisors;

CREATE TRIGGER trigger_supervisors_updated_at
BEFORE UPDATE ON supervisors
FOR EACH ROW
EXECUTE FUNCTION update_supervisors_updated_at();

-- Function to track password changes
CREATE OR REPLACE FUNCTION track_supervisor_password_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
    NEW.password_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_track_password_change ON supervisors;

CREATE TRIGGER trigger_track_password_change
BEFORE UPDATE ON supervisors
FOR EACH ROW
EXECUTE FUNCTION track_supervisor_password_change();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on supervisors table
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow supervisors to view their own data
CREATE POLICY supervisors_view_own
ON supervisors
FOR SELECT
TO authenticated
USING (
  id = auth.uid()::TEXT::BIGINT
  OR
  EXISTS (
    SELECT 1 FROM supervisors s
    WHERE s.id = auth.uid()::TEXT::BIGINT
    AND s.role = 'admin'
    AND s.is_active = true
  )
);

-- Policy: Allow supervisors to update their own data (except sensitive fields)
CREATE POLICY supervisors_update_own
ON supervisors
FOR UPDATE
TO authenticated
USING (id = auth.uid()::TEXT::BIGINT)
WITH CHECK (
  -- Prevent changing sensitive fields
  id = auth.uid()::TEXT::BIGINT
  AND badge_number = OLD.badge_number
  AND role = OLD.role
  AND is_active = OLD.is_active
);

-- Policy: Allow admins full access
CREATE POLICY supervisors_admin_all
ON supervisors
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

-- Policy: Service role has full access (for backend operations)
CREATE POLICY supervisors_service_all
ON supervisors
FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users (RLS handles authorization)
GRANT SELECT, UPDATE ON supervisors TO authenticated;

-- Grant full access to service role (for backend operations)
GRANT ALL ON supervisors TO service_role;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE supervisors_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE supervisors_id_seq TO service_role;

-- ============================================================================
-- Analyze table for query optimization
-- ============================================================================

ANALYZE supervisors;

-- ============================================================================
-- Verification Queries:
-- ============================================================================
-- View table structure:
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'supervisors'
-- ORDER BY ordinal_position;
--
-- View constraints:
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'supervisors'::regclass;
--
-- View triggers:
-- SELECT tgname, tgtype, tgfoid::regproc
-- FROM pg_trigger
-- WHERE tgrelid = 'supervisors'::regclass
-- AND tgisinternal = false;
--
-- View RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'supervisors';
-- ============================================================================
