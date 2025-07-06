-- Emergency Hybrid Storage System Migration
-- This replaces the bloated streetmanager_notifications table
-- with lightweight summaries + JSON file storage

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
  file_reference VARCHAR(255), -- Points to JSON file with full payload
  
  -- Indexes for performance
  INDEX idx_cleanup_date (cleanup_date),
  INDEX idx_status (status),
  INDEX idx_location (location),
  INDEX idx_notification_id (notification_id)
);

-- Create driver message templates table
CREATE TABLE driver_message_templates (
  id SERIAL PRIMARY KEY,
  location_key TEXT UNIQUE NOT NULL, -- Normalized location identifier
  message_template TEXT NOT NULL,
  last_used TIMESTAMP DEFAULT NOW(),
  times_used INTEGER DEFAULT 1,
  created_by VARCHAR(10), -- Supervisor badge
  
  INDEX idx_location_key (location_key),
  INDEX idx_last_used (last_used)
);

-- Create cleanup tracking table
CREATE TABLE cleanup_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  run_date TIMESTAMP DEFAULT NOW(),
  records_cleaned INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed'
);

-- Comment explaining the new system
COMMENT ON TABLE streetmanager_summaries IS 'Lightweight summaries of Street Manager notifications. Full payloads stored in /backend/data/streetmanager/ as JSON files.';
COMMENT ON TABLE driver_message_templates IS 'Reusable message templates for driver communications, organized by location.';
COMMENT ON TABLE cleanup_jobs IS 'Tracks automatic cleanup operations for data retention management.';