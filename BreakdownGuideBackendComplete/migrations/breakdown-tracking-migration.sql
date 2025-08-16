-- Breakdown Tracking System - Database Migration Script
-- Run this in Supabase SQL Editor
-- Created: January 2025

-- Add new columns to existing breakdowns table
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS breakdown_id VARCHAR(20) UNIQUE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS daily_id INTEGER;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS diagnosed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS returned_to_service_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS resolving_supervisor VARCHAR(10);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_steps JSONB DEFAULT '[]';
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS passenger_cloud_used BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS is_secured_service BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS auto_escalated BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS repeat_breakdown BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS previous_breakdown_id VARCHAR(20);
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakdown_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdown_fleet ON breakdowns(fleet_no);
CREATE INDEX IF NOT EXISTS idx_breakdown_daily ON breakdowns(daily_id, created_at);
CREATE INDEX IF NOT EXISTS idx_breakdown_id ON breakdowns(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_archived ON breakdowns(archived);

-- Create priority services table
CREATE TABLE IF NOT EXISTS priority_services (
  id SERIAL PRIMARY KEY,
  route_number VARCHAR(10) UNIQUE NOT NULL,
  priority_level VARCHAR(20), -- 'critical', 'secured', 'important'
  color_code VARCHAR(7),      -- Hex color for display
  created_by VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default priority routes
INSERT INTO priority_services (route_number, priority_level, color_code) VALUES
  ('X10', 'critical', '#FF0000'),
  ('X21', 'critical', '#FF0000')
ON CONFLICT (route_number) DO NOTHING;

-- Create sequence for daily ID counter
CREATE SEQUENCE IF NOT EXISTS breakdown_daily_seq START 1;

-- Create function to reset daily counter at 1am
CREATE OR REPLACE FUNCTION reset_breakdown_daily_counter()
RETURNS void AS $$
BEGIN
  ALTER SEQUENCE breakdown_daily_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for yearly breakdown ID
CREATE SEQUENCE IF NOT EXISTS breakdown_yearly_seq START 1;

-- Create function to get next breakdown ID
CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  current_year INTEGER;
  next_seq INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  next_seq := nextval('breakdown_yearly_seq');
  RETURN 'BD-' || current_year || '-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Update existing records with breakdown_id if missing
DO $$
DECLARE
  counter INTEGER := 1;
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id 
    FROM breakdowns 
    WHERE breakdown_id IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE breakdowns 
    SET breakdown_id = 'BD-2025-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;
