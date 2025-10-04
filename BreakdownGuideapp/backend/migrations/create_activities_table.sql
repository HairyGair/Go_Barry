-- Create activities table for unified activity feed
-- Migration Date: 2025-10-04
-- Purpose: Fix activity feed sync issues - activities currently written to JSON file but read from non-existent database table

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_details JSONB DEFAULT '{}',
  depot TEXT,
  severity TEXT DEFAULT 'info',
  priority INTEGER DEFAULT 5,
  source TEXT,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  icon TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_depot ON activities(depot);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_severity ON activities(severity);

-- Full-text search index for message search
CREATE INDEX IF NOT EXISTS idx_activities_message_search
  ON activities USING gin(to_tsvector('english', COALESCE(message, '')));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at_trigger
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activities_updated_at();

-- Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all activities
CREATE POLICY activities_select_policy ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert activities
CREATE POLICY activities_insert_policy ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow service role full access
CREATE POLICY activities_service_policy ON activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE activities IS 'Unified activity feed for all system events and user actions';
COMMENT ON COLUMN activities.activity_type IS 'Type of activity (breakdown_reported, engineer_assigned, etc.)';
COMMENT ON COLUMN activities.action IS 'Human-readable action description';
COMMENT ON COLUMN activities.actor_type IS 'Type of actor (supervisor, engineer, admin, system)';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity affected (breakdown, vehicle, engineer, etc.)';
COMMENT ON COLUMN activities.entity_details IS 'Additional structured data about the entity';
COMMENT ON COLUMN activities.severity IS 'Activity severity (critical, warning, normal, success, info)';
COMMENT ON COLUMN activities.metadata IS 'Additional unstructured metadata';
COMMENT ON COLUMN activities.message IS 'Human-readable activity message for display';

-- Grant permissions
GRANT SELECT, INSERT ON activities TO authenticated;
GRANT ALL ON activities TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Activities table created successfully';
  RAISE NOTICE '📊 Indexes created for performance';
  RAISE NOTICE '🔒 Row Level Security policies applied';
  RAISE NOTICE '📝 Ready to log activities to database';
END $$;
