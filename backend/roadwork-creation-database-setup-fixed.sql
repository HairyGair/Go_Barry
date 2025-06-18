-- Roadwork Creation System Database Setup
-- Run this in Supabase SQL Editor to create required tables

-- Add missing columns to existing roadworks table
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS created_by_supervisor_id VARCHAR(10);
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100);
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS routes_affected JSONB;
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS severity VARCHAR(10) DEFAULT 'medium';
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE roadworks ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;

-- Update existing data to match constraints
UPDATE roadworks SET status = 'active' WHERE status IS NULL OR status NOT IN ('pending', 'active', 'finished');
UPDATE roadworks SET severity = 'medium' WHERE severity IS NULL OR severity NOT IN ('low', 'medium', 'high');

-- Email groups for distribution lists
CREATE TABLE IF NOT EXISTS email_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    emails JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email log for tracking what was sent
CREATE TABLE IF NOT EXISTS roadwork_email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roadwork_id TEXT REFERENCES roadworks(id) ON DELETE CASCADE,
    email_group_id UUID REFERENCES email_groups(id),
    recipient_emails JSONB NOT NULL,
    email_subject VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadworks_status ON roadworks(status);
CREATE INDEX IF NOT EXISTS idx_roadworks_supervisor ON roadworks(created_by_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_roadworks_dates ON roadworks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_email_groups_active ON email_groups(is_active);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (will replace if they exist)
DROP TRIGGER IF EXISTS update_roadworks_updated_at ON roadworks;
CREATE TRIGGER update_roadworks_updated_at BEFORE UPDATE ON roadworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_groups_updated_at ON email_groups;
CREATE TRIGGER update_email_groups_updated_at BEFORE UPDATE ON email_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email groups
INSERT INTO email_groups (name, description, emails, created_by) VALUES
('Traffic Control', 'Main traffic control team', '["traffic@gonortheast.co.uk", "control@gonortheast.co.uk"]', 'system'),
('Operations Team', 'Bus operations supervisors', '["ops@gonortheast.co.uk", "supervisors@gonortheast.co.uk"]', 'system'),
('Management', 'Senior management team', '["management@gonortheast.co.uk"]', 'system'),
('Customer Services', 'Customer communication team', '["customerservices@gonortheast.co.uk"]', 'system')
ON CONFLICT (name) DO NOTHING;