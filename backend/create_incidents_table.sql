-- Create manual_incidents table for incident storage
CREATE TABLE IF NOT EXISTS manual_incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT,
  location TEXT NOT NULL,
  coordinates JSONB,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  severity TEXT NOT NULL,
  notes TEXT,
  affected_routes TEXT[],
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Supervisor tracking
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  
  -- Enhancement data
  enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
  tomtom_features JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',
  
  -- Cleanup tracking
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_retention_date ON manual_incidents(retention_date);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents(location);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_by ON manual_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_affected_routes ON manual_incidents USING GIN(affected_routes);
EOF < /dev/null