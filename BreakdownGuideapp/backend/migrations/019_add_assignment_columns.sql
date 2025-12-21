-- Migration: Add Assignment Columns to Breakdowns Table
-- Phase 7.1: Auto-assign breakdowns to on-duty supervisors
-- Created: 2025-12-20
-- MySQL Compatible Version

-- Step 1: Add assignment columns to breakdowns table
-- Run each ALTER separately (ignore errors if columns already exist)

ALTER TABLE breakdowns
  ADD COLUMN assigned_supervisor_id CHAR(36) DEFAULT NULL
    COMMENT 'Supervisor assigned to handle this breakdown';

ALTER TABLE breakdowns
  ADD COLUMN assigned_supervisor_name VARCHAR(255) DEFAULT NULL
    COMMENT 'Cached name of assigned supervisor';

ALTER TABLE breakdowns
  ADD COLUMN assigned_supervisor_badge VARCHAR(50) DEFAULT NULL
    COMMENT 'Cached badge number of assigned supervisor';

ALTER TABLE breakdowns
  ADD COLUMN assigned_at TIMESTAMP NULL DEFAULT NULL
    COMMENT 'When the breakdown was assigned';

-- Step 2: Add indexes for assignment queries
-- (Run separately, ignore if already exists)
CREATE INDEX idx_assigned_supervisor ON breakdowns (assigned_supervisor_id);
CREATE INDEX idx_assigned_at ON breakdowns (assigned_at);

-- Step 3: Create view for unassigned breakdowns
CREATE OR REPLACE VIEW v_unassigned_breakdowns AS
SELECT
  b.id,
  b.breakdown_id,
  b.fleet_no,
  b.depot,
  b.location_description,
  b.issue_category,
  b.severity,
  b.status,
  b.created_at,
  TIMESTAMPDIFF(MINUTE, b.created_at, NOW()) as minutes_unassigned
FROM breakdowns b
WHERE b.assigned_supervisor_id IS NULL
  AND b.status NOT IN ('resolved', 'cleared', 'completed')
ORDER BY
  CASE b.severity
    WHEN 'STOP' THEN 1
    WHEN 'AMBER' THEN 2
    ELSE 3
  END,
  b.created_at ASC;

-- Step 4: Create view for supervisor assignment workload
CREATE OR REPLACE VIEW v_supervisor_workload AS
SELECT
  s.id as supervisor_id,
  s.name,
  s.badge_number,
  s.depot,
  s.current_duty,
  COUNT(b.id) as active_breakdowns,
  MAX(b.created_at) as last_assignment_time
FROM supervisors s
LEFT JOIN breakdowns b ON s.id = b.assigned_supervisor_id
  AND b.status NOT IN ('resolved', 'cleared', 'completed')
WHERE s.is_active = 1
GROUP BY s.id, s.name, s.badge_number, s.depot, s.current_duty
ORDER BY active_breakdowns ASC;

-- Verification queries (run manually)
-- DESCRIBE breakdowns;
-- SELECT * FROM v_unassigned_breakdowns LIMIT 10;
-- SELECT * FROM v_supervisor_workload;
