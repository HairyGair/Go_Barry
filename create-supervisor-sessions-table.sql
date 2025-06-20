-- Supabase SQL to create supervisor_sessions table
-- Run this in your Supabase SQL editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS supervisor_sessions;

-- Create supervisor_sessions table
CREATE TABLE supervisor_sessions (
    id TEXT PRIMARY KEY,
    supervisor_id TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    supervisor_badge TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    active BOOLEAN DEFAULT true,
    role TEXT,
    shift TEXT,
    timeout_reason TEXT,
    signout_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_supervisor_sessions_active ON supervisor_sessions(active);
CREATE INDEX idx_supervisor_sessions_supervisor_id ON supervisor_sessions(supervisor_id);
CREATE INDEX idx_supervisor_sessions_last_activity ON supervisor_sessions(last_activity);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE supervisor_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Enable all for authenticated users" ON supervisor_sessions
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function
CREATE TRIGGER update_supervisor_sessions_updated_at BEFORE UPDATE
    ON supervisor_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your needs)
GRANT ALL ON supervisor_sessions TO authenticated;
GRANT ALL ON supervisor_sessions TO anon;