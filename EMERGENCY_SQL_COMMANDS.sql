-- EMERGENCY SQL COMMANDS FOR SUPABASE DASHBOARD
-- Copy and paste these commands in Supabase SQL Editor to fix the 489MB database bloat

-- ========================================
-- STEP 1: DROP THE BLOATED TABLE (URGENT)
-- ========================================
-- This will immediately reclaim 489MB (93% of database space)
-- Database size will drop from 510MB to ~21MB

DROP TABLE IF EXISTS streetmanager_notifications CASCADE;

-- ========================================
-- STEP 2: CREATE NEW HYBRID STORAGE TABLES
-- ========================================

-- Create lightweight summaries table (replaces 489MB table)
CREATE TABLE streetmanager_summaries (
  id SERIAL PRIMARY KEY,
  notification_id VARCHAR(255) UNIQUE,
  location TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  severity VARCHAR(50),
  contractor TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  cleanup_date TIMESTAMP, -- end_date + 7 days for auto-cleanup
  file_reference VARCHAR(255) -- Points to JSON file with full payload
);

-- Create efficient indexes
CREATE INDEX idx_summaries_cleanup_date ON streetmanager_summaries(cleanup_date);
CREATE INDEX idx_summaries_status ON streetmanager_summaries(status);
CREATE INDEX idx_summaries_location ON streetmanager_summaries(location);
CREATE INDEX idx_summaries_notification_id ON streetmanager_summaries(notification_id);

-- Create driver message templates table
CREATE TABLE driver_message_templates (
  id SERIAL PRIMARY KEY,
  location_key TEXT UNIQUE NOT NULL, -- Normalized location identifier
  message_template TEXT NOT NULL,
  last_used TIMESTAMP DEFAULT NOW(),
  times_used INTEGER DEFAULT 1,
  created_by VARCHAR(10) -- Supervisor badge
);

-- Create indexes for templates
CREATE INDEX idx_templates_location_key ON driver_message_templates(location_key);
CREATE INDEX idx_templates_last_used ON driver_message_templates(last_used);

-- Create cleanup tracking table
CREATE TABLE cleanup_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  run_date TIMESTAMP DEFAULT NOW(),
  records_cleaned INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed'
);

-- Add helpful comments
COMMENT ON TABLE streetmanager_summaries IS 'Lightweight summaries of Street Manager notifications. Full payloads stored in /backend/data/streetmanager/ as JSON files. Prevents database bloat by storing only essential fields (1KB vs 500KB+ full payloads).';

COMMENT ON TABLE driver_message_templates IS 'Reusable message templates for driver communications, organized by location. Allows supervisors to quickly send consistent messages for common roadwork scenarios.';

COMMENT ON TABLE cleanup_jobs IS 'Tracks automatic cleanup operations for data retention management. Ensures old notifications are removed 7 days after roadwork completion.';

-- ========================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(location_key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE driver_message_templates 
  SET times_used = times_used + 1, last_used = NOW()
  WHERE driver_message_templates.location_key = increment_template_usage.location_key;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if old table is gone (should return no results)
SELECT to_regclass('streetmanager_notifications') as old_table_exists;

-- Check new tables exist (should return table names)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('streetmanager_summaries', 'driver_message_templates', 'cleanup_jobs');

-- Check database size after cleanup
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- old_table_exists: NULL (table dropped)
-- New tables: All 3 should be listed
-- Database size: Should be ~21MB (down from 510MB)
-- Space reclaimed: 489MB immediately available