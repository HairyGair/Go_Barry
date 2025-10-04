-- Migration: Add Engineering Tracking Columns to Breakdowns Table (Safe Version)
-- Purpose: Track engineer job lifecycle from assignment to completion
-- Created: October 4, 2025
-- This version checks if columns exist before adding them

-- Function to add column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name TEXT,
    column_name TEXT,
    column_type TEXT
)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND column_name = column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add engineering workflow timestamps
SELECT add_column_if_not_exists('breakdowns', 'engineer_accepted_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('breakdowns', 'engineer_on_site_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('breakdowns', 'engineer_fixing_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('breakdowns', 'engineer_completed_at', 'TIMESTAMPTZ');

-- Add engineering data fields
SELECT add_column_if_not_exists('breakdowns', 'engineer_notes', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('breakdowns', 'parts_used', 'JSONB');
SELECT add_column_if_not_exists('breakdowns', 'labor_hours', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('breakdowns', 'repair_category', 'VARCHAR(100)');
SELECT add_column_if_not_exists('breakdowns', 'root_cause', 'TEXT');

-- Add engineer assignment tracking
SELECT add_column_if_not_exists('breakdowns', 'engineer_id', 'VARCHAR(50)');
SELECT add_column_if_not_exists('breakdowns', 'engineer_name', 'VARCHAR(100)');
SELECT add_column_if_not_exists('breakdowns', 'engineer_badge', 'VARCHAR(20)');
SELECT add_column_if_not_exists('breakdowns', 'engineer_eta_minutes', 'INTEGER');

-- Drop the helper function
DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT);

-- Add comments (these are safe to run multiple times)
COMMENT ON COLUMN breakdowns.engineer_accepted_at IS 'Timestamp when engineer accepted the job';
COMMENT ON COLUMN breakdowns.engineer_on_site_at IS 'Timestamp when engineer arrived on site';
COMMENT ON COLUMN breakdowns.engineer_fixing_at IS 'Timestamp when repair work started';
COMMENT ON COLUMN breakdowns.engineer_completed_at IS 'Timestamp when repair completed';
COMMENT ON COLUMN breakdowns.engineer_notes IS 'Array of engineer diagnostic and repair notes';
COMMENT ON COLUMN breakdowns.parts_used IS 'JSON array of parts used in repair with part numbers';
COMMENT ON COLUMN breakdowns.labor_hours IS 'Total labor hours spent on repair';
COMMENT ON COLUMN breakdowns.repair_category IS 'Category of repair performed';
COMMENT ON COLUMN breakdowns.root_cause IS 'Root cause analysis of the breakdown';
COMMENT ON COLUMN breakdowns.engineer_eta_minutes IS 'Estimated time of arrival in minutes when job accepted';

-- Drop engineers table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS engineers CASCADE;

-- Create engineers table
CREATE TABLE engineers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  depot VARCHAR(50) NOT NULL,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'on_job', 'off_duty', 'unavailable')),
  current_location GEOGRAPHY(POINT, 4326),
  current_breakdown_id VARCHAR(50),
  shift_start TIME,
  shift_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_id ON breakdowns(engineer_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_accepted_at ON breakdowns(engineer_accepted_at);
CREATE INDEX IF NOT EXISTS idx_breakdowns_repair_category ON breakdowns(repair_category);
CREATE INDEX IF NOT EXISTS idx_engineers_depot ON engineers(depot);
CREATE INDEX IF NOT EXISTS idx_engineers_status ON engineers(status);
CREATE INDEX IF NOT EXISTS idx_engineers_badge_number ON engineers(badge_number);

-- Create trigger for engineers updated_at
CREATE OR REPLACE FUNCTION update_engineers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_engineers_updated_at ON engineers;
CREATE TRIGGER update_engineers_updated_at
    BEFORE UPDATE ON engineers
    FOR EACH ROW
    EXECUTE FUNCTION update_engineers_updated_at_column();

-- Insert sample engineers for testing
INSERT INTO engineers (badge_number, name, email, depot, skills, status) VALUES
  ('ENG001', 'John Smith', 'john.smith@gonortheast.co.uk', 'Washington', '["electrical", "mechanical"]'::jsonb, 'available'),
  ('ENG002', 'Sarah Johnson', 'sarah.johnson@gonortheast.co.uk', 'Riverside', '["hvac", "mechanical"]'::jsonb, 'available'),
  ('ENG003', 'Mike Williams', 'mike.williams@gonortheast.co.uk', 'Consett', '["electrical", "diagnostics"]'::jsonb, 'available'),
  ('ENG004', 'Emma Brown', 'emma.brown@gonortheast.co.uk', 'Washington', '["mechanical", "hydraulics"]'::jsonb, 'available'),
  ('ENG005', 'David Wilson', 'david.wilson@gonortheast.co.uk', 'Deptford', '["electrical", "mechanical", "hvac"]'::jsonb, 'available')
ON CONFLICT (badge_number) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON engineers TO authenticated;
-- GRANT SELECT ON breakdowns TO authenticated;

COMMENT ON TABLE engineers IS 'Engineering staff with skills and availability tracking';
COMMENT ON COLUMN engineers.skills IS 'JSON array of engineering skills (e.g., electrical, mechanical)';
COMMENT ON COLUMN engineers.status IS 'Current availability status: available, on_job, off_duty, unavailable';
COMMENT ON COLUMN engineers.current_breakdown_id IS 'ID of breakdown currently assigned to this engineer';
