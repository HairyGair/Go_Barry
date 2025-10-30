-- Migration: Add password_hash column to supervisors table
-- Purpose: Store hashed passwords for MySQL-based authentication
-- Author: System Migration
-- Date: 2025-10-16

-- Add password_hash column (NULL allowed for existing supervisors)
ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL
COMMENT 'Bcrypt hashed password for authentication';

-- Add index for performance on authentication lookups
CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);

-- Add audit columns if they don't exist
ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS signup_date TIMESTAMP DEFAULT NULL
COMMENT 'Date when supervisor account was created';

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP DEFAULT NULL
COMMENT 'Date when supervisor account was approved';

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE
COMMENT 'Whether supervisor is pending admin approval';

ALTER TABLE supervisors
ADD COLUMN IF NOT EXISTS auth_user_id VARCHAR(255) DEFAULT NULL
COMMENT 'Legacy Supabase auth user ID (deprecated, will be removed)';

-- Add updated_at trigger if not exists (MySQL 5.7+)
-- This ensures updated_at is automatically updated on row changes
ALTER TABLE supervisors
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verification query
SELECT
    'password_hash' as column_name,
    CASE WHEN column_name = 'password_hash' THEN '✓ Added' ELSE '✗ Missing' END as status
FROM information_schema.columns
WHERE table_name = 'supervisors'
AND column_name = 'password_hash'
UNION ALL
SELECT
    'email_index' as column_name,
    CASE WHEN COUNT(*) > 0 THEN '✓ Created' ELSE '✗ Missing' END as status
FROM information_schema.statistics
WHERE table_name = 'supervisors'
AND index_name = 'idx_supervisors_email';
