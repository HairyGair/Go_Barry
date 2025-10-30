-- =====================================================
-- Wizard Progress Migration for MySQL
-- =====================================================
-- MySQL version of wizard_progress table
-- Tracks assessment wizard progress and completions
--
-- Features:
-- - Tracks wizard progress steps
-- - Stores wizard completion data
-- - JSON storage for flexible step data
-- - Auto-updating timestamps
-- - Indexes for performance
--
-- Usage:
-- Run this SQL in your MySQL database
-- =====================================================

-- =====================================================
-- 1. Create wizard_progress table
-- =====================================================
CREATE TABLE IF NOT EXISTS wizard_progress (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

  -- Breakdown reference
  breakdown_id INT NOT NULL,

  -- Wizard information
  wizard_type VARCHAR(100) NOT NULL,
  step_type VARCHAR(50) NOT NULL,

  -- Step data stored as JSON
  step_data JSON DEFAULT ('{}'),

  -- Supervisor information
  supervisor_id VARCHAR(255),
  supervisor_badge VARCHAR(50),
  supervisor_name VARCHAR(255),

  -- Vehicle and location
  vehicle_fleet_number VARCHAR(50),
  location VARCHAR(255),
  depot VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key to breakdowns table
  CONSTRAINT fk_wizard_progress_breakdown
    FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id)
    ON DELETE CASCADE,

  -- Index on breakdown_id for fast lookups
  INDEX idx_wizard_progress_breakdown_id (breakdown_id),
  INDEX idx_wizard_progress_supervisor_id (supervisor_id),
  INDEX idx_wizard_progress_wizard_type (wizard_type),
  INDEX idx_wizard_progress_step_type (step_type),
  INDEX idx_wizard_progress_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Create composite indexes for common queries
-- =====================================================

-- Index for getting wizard progress by breakdown and wizard type
CREATE INDEX idx_wizard_breakdown_type
  ON wizard_progress(breakdown_id, wizard_type, created_at);

-- Index for getting completions only
CREATE INDEX idx_wizard_completions
  ON wizard_progress(step_type, created_at DESC)
  WHERE step_type = 'completion';

-- Index for supervisor's wizard history
CREATE INDEX idx_wizard_supervisor_history
  ON wizard_progress(supervisor_id, created_at DESC);

-- =====================================================
-- 3. Create view for wizard completions
-- =====================================================
CREATE OR REPLACE VIEW wizard_completions_view AS
SELECT
  wp.id,
  wp.breakdown_id,
  wp.wizard_type,
  wp.step_data->>'$.decision' as decision,
  wp.step_data->>'$.notes' as notes,
  wp.step_data->>'$.completed_at' as completed_at,
  wp.supervisor_id,
  wp.supervisor_badge,
  wp.supervisor_name,
  wp.vehicle_fleet_number,
  wp.location,
  wp.depot,
  wp.created_at,
  b.fleet_no,
  b.status as breakdown_status,
  b.assessment_decision
FROM wizard_progress wp
LEFT JOIN breakdowns b ON wp.breakdown_id = b.id
WHERE wp.step_type = 'completion'
ORDER BY wp.created_at DESC;

-- =====================================================
-- 4. Create view for recent wizard assessments
-- =====================================================
CREATE OR REPLACE VIEW wizard_recent_assessments AS
SELECT
  wp.id,
  wp.breakdown_id,
  wp.wizard_type,
  wp.step_data->>'$.decision' as decision,
  wp.step_data->>'$.notes' as assessment_notes,
  wp.supervisor_name,
  wp.supervisor_badge,
  wp.vehicle_fleet_number,
  wp.location,
  wp.depot,
  wp.created_at as assessment_completed_at,
  b.fleet_no,
  b.status as breakdown_status,
  b.breakdown_type,
  b.location as breakdown_location
FROM wizard_progress wp
INNER JOIN breakdowns b ON wp.breakdown_id = b.id
WHERE wp.step_type = 'completion'
ORDER BY wp.created_at DESC
LIMIT 50;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run this SQL in your MySQL database
-- 2. Verify table created: wizard_progress
-- 3. Test wizard progress tracking
-- 4. Update backend API endpoints to use MySQL instead of Supabase
-- =====================================================

-- Verification Queries (run these to check migration success):
-- SELECT * FROM wizard_progress LIMIT 10;
-- SELECT * FROM wizard_completions_view LIMIT 10;
-- SELECT * FROM wizard_recent_assessments LIMIT 10;
-- DESCRIBE wizard_progress;
