-- Enhanced Roadworks Workflow Schema (Phase 1)
-- Adds enhanced status tracking, escalation, and review workflow capabilities

-- Add enhanced workflow fields to streetworks table
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS sub_status VARCHAR(50);
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS review_assigned_to VARCHAR(100);
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS review_assigned_at TIMESTAMP;
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS auto_transition_enabled BOOLEAN DEFAULT true;
ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'initial';

-- Add enhanced workflow fields to manual_roadworks table
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS sub_status VARCHAR(50);
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS review_assigned_to VARCHAR(100);
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS review_assigned_at TIMESTAMP;
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS auto_transition_enabled BOOLEAN DEFAULT true;
ALTER TABLE manual_roadworks ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'initial';

-- Create enhanced status workflow tracking table
CREATE TABLE IF NOT EXISTS roadwork_status_transitions (
  id SERIAL PRIMARY KEY,
  roadwork_id VARCHAR(100) NOT NULL,
  roadwork_type VARCHAR(20) NOT NULL, -- 'streetworks' or 'manual_roadworks'
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  from_sub_status VARCHAR(50),
  to_sub_status VARCHAR(50),
  transition_type VARCHAR(30) NOT NULL, -- 'manual', 'automatic', 'scheduled'
  triggered_by VARCHAR(100), -- supervisor name or 'system'
  transition_reason TEXT,
  escalation_level_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  transition_data JSONB, -- Additional transition metadata
  
  -- Indexes for performance
  INDEX idx_roadwork_transitions_id (roadwork_id),
  INDEX idx_roadwork_transitions_date (created_at),
  INDEX idx_roadwork_transitions_type (transition_type)
);

-- Create escalation tracking table
CREATE TABLE IF NOT EXISTS roadwork_escalations (
  id SERIAL PRIMARY KEY,
  roadwork_id VARCHAR(100) NOT NULL,
  roadwork_type VARCHAR(20) NOT NULL,
  escalation_level INTEGER NOT NULL,
  escalated_by VARCHAR(100), -- supervisor name or 'system'
  escalation_reason TEXT NOT NULL,
  assigned_to VARCHAR(100), -- supervisor assigned to handle
  expected_resolution_date DATE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_escalations_roadwork (roadwork_id),
  INDEX idx_escalations_level (escalation_level),
  INDEX idx_escalations_assigned (assigned_to),
  INDEX idx_escalations_unresolved (resolved_at) -- NULL values for unresolved
);

-- Create review assignments table
CREATE TABLE IF NOT EXISTS roadwork_review_assignments (
  id SERIAL PRIMARY KEY,
  roadwork_id VARCHAR(100) NOT NULL,
  roadwork_type VARCHAR(20) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL, -- supervisor badge/name
  assigned_by VARCHAR(100) NOT NULL,
  assignment_reason VARCHAR(100),
  due_date DATE,
  priority INTEGER DEFAULT 3, -- 1=urgent, 2=high, 3=normal, 4=low
  completed_at TIMESTAMP,
  completion_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(roadwork_id, assigned_to), -- Prevent duplicate assignments
  
  -- Indexes
  INDEX idx_review_assignments_assigned (assigned_to),
  INDEX idx_review_assignments_due (due_date),
  INDEX idx_review_assignments_pending (completed_at) -- NULL for pending
);

-- Enhanced status definitions with sub-statuses
COMMENT ON COLUMN streetworks.sub_status IS 'Sub-status for detailed workflow tracking:
  pending_review: under_review, review_assigned, review_overdue
  approved: awaiting_start, ready_to_activate, activation_pending
  monitoring: daily_check, weekly_check, escalated, intervention_required
  rejected: archived, pending_resubmission';

COMMENT ON COLUMN streetworks.escalation_level IS 'Escalation level: 
  0=Normal, 1=Attention_Required, 2=Urgent, 3=Critical, 4=Emergency';

COMMENT ON COLUMN streetworks.workflow_stage IS 'Current workflow stage:
  initial, review, planning, execution, monitoring, completion, archived';

-- Triggers for automatic status transition tracking
CREATE OR REPLACE FUNCTION log_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.sub_status IS DISTINCT FROM NEW.sub_status THEN
    INSERT INTO roadwork_status_transitions 
    (roadwork_id, roadwork_type, from_status, to_status, from_sub_status, to_sub_status, 
     transition_type, triggered_by, transition_reason)
    VALUES 
    (NEW.id, TG_TABLE_NAME, OLD.status, NEW.status, OLD.sub_status, NEW.sub_status,
     'manual', COALESCE(NEW.updated_by, 'system'), 'Status update');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to both tables
CREATE TRIGGER streetworks_status_transition_trigger
  AFTER UPDATE ON streetworks
  FOR EACH ROW
  EXECUTE FUNCTION log_status_transition();

CREATE TRIGGER manual_roadworks_status_transition_trigger
  AFTER UPDATE ON manual_roadworks
  FOR EACH ROW
  EXECUTE FUNCTION log_status_transition();

-- Views for enhanced workflow management
CREATE OR REPLACE VIEW enhanced_roadworks_workflow AS
SELECT 
  r.*,
  -- Workflow metadata
  CASE 
    WHEN r.status = 'pending_review' AND r.created_at < NOW() - INTERVAL '24 hours' THEN true
    WHEN r.status = 'monitoring' AND r.next_review_date < NOW() THEN true
    ELSE false
  END as is_overdue,
  
  CASE 
    WHEN r.escalation_level >= 2 THEN 'urgent'
    WHEN r.escalation_level = 1 THEN 'attention'
    ELSE 'normal'
  END as priority_level,
  
  -- Calculate days in current status
  EXTRACT(days FROM NOW() - r.updated_at)::INTEGER as days_in_status,
  
  -- Active escalations
  (SELECT COUNT(*) FROM roadwork_escalations e 
   WHERE e.roadwork_id = r.id AND e.resolved_at IS NULL) as active_escalations,
   
  -- Pending reviews
  (SELECT COUNT(*) FROM roadwork_review_assignments ra 
   WHERE ra.roadwork_id = r.id AND ra.completed_at IS NULL) as pending_reviews

FROM streetworks r
WHERE r.status != 'archived';

-- Indexes for enhanced queries
CREATE INDEX IF NOT EXISTS idx_streetworks_workflow ON streetworks(status, sub_status, escalation_level);
CREATE INDEX IF NOT EXISTS idx_streetworks_review_date ON streetworks(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_workflow ON manual_roadworks(status, sub_status, escalation_level);

-- Grant permissions
GRANT ALL PRIVILEGES ON roadwork_status_transitions TO authenticated;
GRANT ALL PRIVILEGES ON roadwork_escalations TO authenticated;
GRANT ALL PRIVILEGES ON roadwork_review_assignments TO authenticated;
GRANT SELECT ON enhanced_roadworks_workflow TO authenticated;