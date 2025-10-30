-- ============================================================================
-- Security Performance Indexes for Supervisor Authentication
-- Created: 2025-10-26
-- Database: Supabase (PostgreSQL)
-- ============================================================================
-- Purpose: Optimize authentication queries and improve security performance
-- These indexes support the enhanced security middleware and authentication flows
-- ============================================================================

-- Index on badge_number for fast login lookups
-- This is the primary authentication field used in all login attempts
CREATE INDEX IF NOT EXISTS idx_supervisors_badge_number
ON supervisors(badge_number);

-- Index on is_active for filtering active supervisors
-- Prevents authentication attempts against inactive/disabled accounts
CREATE INDEX IF NOT EXISTS idx_supervisors_is_active
ON supervisors(is_active);

-- Composite index on badge_number and is_active
-- Optimizes the most common authentication query pattern
-- Used in: SELECT ... WHERE badge_number = ? AND is_active = 1
CREATE INDEX IF NOT EXISTS idx_supervisors_badge_active
ON supervisors(badge_number, is_active);

-- Index on email for password reset and notifications
-- Supports email-based recovery and communication flows
CREATE INDEX IF NOT EXISTS idx_supervisors_email
ON supervisors(email);

-- Index on role for authorization checks
-- Enables fast permission validation (admin vs supervisor roles)
CREATE INDEX IF NOT EXISTS idx_supervisors_role
ON supervisors(role);

-- Composite index on depot and role for depot-specific queries
-- Supports depot-based supervisor management and reporting
CREATE INDEX IF NOT EXISTS idx_supervisors_depot_role
ON supervisors(depot, role);

-- Index on created_at for account management and auditing
-- Supports temporal queries and account lifecycle management
CREATE INDEX IF NOT EXISTS idx_supervisors_created_at
ON supervisors(created_at);

-- Index on updated_at for change tracking
-- Enables efficient "recently updated" queries
CREATE INDEX IF NOT EXISTS idx_supervisors_updated_at
ON supervisors(updated_at);

-- ============================================================================
-- Performance Notes:
-- ============================================================================
-- - idx_supervisors_badge_active is the most critical for auth performance
-- - Login queries should use: WHERE badge_number = ? AND is_active = 1
-- - All indexes support both equality and range queries
-- - PostgreSQL will automatically choose the most efficient index
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE supervisors;

-- ============================================================================
-- Verification Query:
-- ============================================================================
-- To verify indexes were created, run:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'supervisors'
-- ORDER BY indexname;
-- ============================================================================
