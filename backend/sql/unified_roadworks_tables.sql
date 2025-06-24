-- SQL for unified roadworks management system
-- These tables support dismiss, acknowledge, and save operations for all roadworks sources

-- Table for roadwork dismissals
CREATE TABLE IF NOT EXISTS roadwork_dismissals (
    id BIGSERIAL PRIMARY KEY,
    roadwork_id VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    dismissed_by VARCHAR(255) NOT NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for roadwork acknowledgments  
CREATE TABLE IF NOT EXISTS roadwork_acknowledgments (
    id BIGSERIAL PRIMARY KEY,
    roadwork_id VARCHAR(255) NOT NULL,
    note TEXT,
    acknowledged_by VARCHAR(255) NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for saved/bookmarked roadworks
CREATE TABLE IF NOT EXISTS saved_roadworks (
    id BIGSERIAL PRIMARY KEY,
    roadwork_id VARCHAR(255) NOT NULL,
    saved_by VARCHAR(255) NOT NULL,
    notes TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roadwork_id, saved_by)
);

-- Table for manual roadworks/incidents (if not exists)
CREATE TABLE IF NOT EXISTS manual_incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL DEFAULT 'roadwork',
    location VARCHAR(500),
    street_name VARCHAR(255),
    area VARCHAR(255),
    coordinates JSONB,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    severity VARCHAR(50) DEFAULT 'Medium',
    promoter VARCHAR(255),
    authority VARCHAR(255),
    category VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadwork_dismissals_roadwork_id ON roadwork_dismissals(roadwork_id);
CREATE INDEX IF NOT EXISTS idx_roadwork_dismissals_dismissed_by ON roadwork_dismissals(dismissed_by);
CREATE INDEX IF NOT EXISTS idx_roadwork_dismissals_dismissed_at ON roadwork_dismissals(dismissed_at);

CREATE INDEX IF NOT EXISTS idx_roadwork_acknowledgments_roadwork_id ON roadwork_acknowledgments(roadwork_id);
CREATE INDEX IF NOT EXISTS idx_roadwork_acknowledgments_acknowledged_by ON roadwork_acknowledgments(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_roadwork_acknowledgments_acknowledged_at ON roadwork_acknowledgments(acknowledged_at);

CREATE INDEX IF NOT EXISTS idx_saved_roadworks_roadwork_id ON saved_roadworks(roadwork_id);
CREATE INDEX IF NOT EXISTS idx_saved_roadworks_saved_by ON saved_roadworks(saved_by);
CREATE INDEX IF NOT EXISTS idx_saved_roadworks_saved_at ON saved_roadworks(saved_at);

CREATE INDEX IF NOT EXISTS idx_manual_incidents_type ON manual_incidents(type);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents USING GIN(to_tsvector('english', location));

-- Comments for documentation
COMMENT ON TABLE roadwork_dismissals IS 'Records of dismissed roadworks with reasons';
COMMENT ON TABLE roadwork_acknowledgments IS 'Records of acknowledged roadworks with notes';
COMMENT ON TABLE saved_roadworks IS 'Saved/bookmarked roadworks by supervisors';
COMMENT ON TABLE manual_incidents IS 'Manually created roadworks and incidents';

-- Example data structure comments
COMMENT ON COLUMN roadwork_dismissals.roadwork_id IS 'ID from source system (sm_*, durham_*, manual_*)';
COMMENT ON COLUMN saved_roadworks.roadwork_id IS 'Composite ID format: source_originalId';
COMMENT ON COLUMN manual_incidents.coordinates IS 'GeoJSON format: {"lat": 54.9783, "lng": -1.6178}';