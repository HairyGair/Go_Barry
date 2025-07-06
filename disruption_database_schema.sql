-- Disruption Database Schema for Go BARRY
-- Communication tracking for roadworks and incidents

-- Table for main disruption records
CREATE TABLE IF NOT EXISTS disruptions (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'roadwork', -- 'roadwork', 'incident', 'manual'
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    coordinates JSONB,
    affected_routes TEXT[],
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'monitoring'
    created_by TEXT NOT NULL,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    notes TEXT
);

-- Table for communication records linked to disruptions
CREATE TABLE IF NOT EXISTS roadwork_communications (
    id TEXT PRIMARY KEY,
    disruption_id TEXT NOT NULL REFERENCES disruptions(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'roadwork',
    message_type TEXT NOT NULL, -- 'driver', 'customer', 'internal'
    subject TEXT,
    content TEXT,
    platform TEXT, -- 'ticketer', 'passenger-cloud', 'website', 'manual'
    supervisor_badge TEXT NOT NULL,
    supervisor_name TEXT,
    recipient_count INTEGER DEFAULT 0,
    routes TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disruptions_source ON disruptions(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_disruptions_status ON disruptions(status);
CREATE INDEX IF NOT EXISTS idx_disruptions_created_by ON disruptions(created_by);
CREATE INDEX IF NOT EXISTS idx_disruptions_created_at ON disruptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communications_disruption ON roadwork_communications(disruption_id);
CREATE INDEX IF NOT EXISTS idx_communications_source ON roadwork_communications(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_communications_supervisor ON roadwork_communications(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON roadwork_communications(sent_at DESC);

-- Enable Row Level Security (RLS) for additional security
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadwork_communications ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for authenticated users)
CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON disruptions
    FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON roadwork_communications
    FOR ALL USING (true);

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last_updated on disruptions table
DROP TRIGGER IF EXISTS update_disruptions_last_updated ON disruptions;
CREATE TRIGGER update_disruptions_last_updated
    BEFORE UPDATE ON disruptions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- View for enhanced disruption data with communication counts
CREATE OR REPLACE VIEW disruptions_with_stats AS
SELECT 
    d.*,
    COUNT(rc.id) as message_count,
    MAX(rc.sent_at) as last_message_at,
    ARRAY_AGG(DISTINCT rc.message_type) FILTER (WHERE rc.message_type IS NOT NULL) as message_types,
    ARRAY_AGG(DISTINCT rc.platform) FILTER (WHERE rc.platform IS NOT NULL) as platforms_used
FROM disruptions d
LEFT JOIN roadwork_communications rc ON d.id = rc.disruption_id
GROUP BY d.id, d.source_id, d.source_type, d.title, d.description, d.location, 
         d.coordinates, d.affected_routes, d.severity, d.status, d.created_by, 
         d.created_by_name, d.created_at, d.last_updated, d.updated_by, d.notes;

-- Function to get communication history for a disruption
CREATE OR REPLACE FUNCTION get_disruption_communications(disruption_uuid TEXT)
RETURNS TABLE (
    id TEXT,
    message_type TEXT,
    subject TEXT,
    content TEXT,
    platform TEXT,
    supervisor_name TEXT,
    recipient_count INTEGER,
    routes TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id,
        rc.message_type,
        rc.subject,
        rc.content,
        rc.platform,
        rc.supervisor_name,
        rc.recipient_count,
        rc.routes,
        rc.sent_at
    FROM roadwork_communications rc
    WHERE rc.disruption_id = disruption_uuid
    ORDER BY rc.sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create disruption with initial communication
CREATE OR REPLACE FUNCTION create_disruption_with_communication(
    p_source_id TEXT,
    p_source_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_location TEXT,
    p_coordinates JSONB,
    p_affected_routes TEXT[],
    p_severity TEXT,
    p_supervisor_badge TEXT,
    p_supervisor_name TEXT,
    p_message_type TEXT,
    p_subject TEXT,
    p_content TEXT,
    p_platform TEXT,
    p_recipient_count INTEGER DEFAULT 0,
    p_routes TEXT[] DEFAULT '{}'
)
RETURNS TEXT AS $$
DECLARE
    disruption_id TEXT;
    communication_id TEXT;
BEGIN
    -- Generate IDs
    disruption_id := 'disruption_' || extract(epoch from now())::bigint;
    communication_id := 'comm_' || extract(epoch from now())::bigint;
    
    -- Insert disruption
    INSERT INTO disruptions (
        id, source_id, source_type, title, description, location, 
        coordinates, affected_routes, severity, created_by, created_by_name
    ) VALUES (
        disruption_id, p_source_id, p_source_type, p_title, p_description, 
        p_location, p_coordinates, p_affected_routes, p_severity, 
        p_supervisor_badge, p_supervisor_name
    );
    
    -- Insert initial communication if provided
    IF p_message_type IS NOT NULL AND p_content IS NOT NULL THEN
        INSERT INTO roadwork_communications (
            id, disruption_id, source_id, source_type, message_type, 
            subject, content, platform, supervisor_badge, supervisor_name,
            recipient_count, routes
        ) VALUES (
            communication_id, disruption_id, p_source_id, p_source_type, 
            p_message_type, p_subject, p_content, p_platform, 
            p_supervisor_badge, p_supervisor_name, p_recipient_count, p_routes
        );
    END IF;
    
    RETURN disruption_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional - remove in production)
/*
INSERT INTO disruptions (
    id, source_id, source_type, title, description, location,
    coordinates, affected_routes, severity, created_by, created_by_name
) VALUES (
    'disruption_test_1',
    'RW001',
    'roadwork',
    'High Level Bridge Emergency Closure',
    'Police incident causing full closure of High Level Bridge',
    'High Level Bridge, Newcastle',
    '{"lat": 54.9693, "lng": -1.6102}',
    ARRAY['1', '10', '11', '12', '21', 'Q3'],
    'high',
    'AG003',
    'Anthony Gair'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO roadwork_communications (
    id, disruption_id, source_id, source_type, message_type,
    subject, content, platform, supervisor_badge, supervisor_name,
    recipient_count, routes
) VALUES (
    'comm_test_1',
    'disruption_test_1',
    'RW001',
    'roadwork',
    'driver',
    'High Level Bridge Closure - All Services',
    'High Level Bridge is closed due to police incident. Use alternative routes via Tyne Bridge or King Edward VII Bridge.',
    'ticketer',
    'AG003',
    'Anthony Gair',
    25,
    ARRAY['1', '10', '11', '12', '21', 'Q3']
) ON CONFLICT (id) DO NOTHING;
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON disruptions TO authenticated;
-- GRANT ALL ON roadwork_communications TO authenticated;
-- GRANT USAGE ON disruptions_with_stats TO authenticated;