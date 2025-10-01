-- =====================================================
-- LOCATION CAPTURE DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add location columns to breakdowns table
DO $$ 
BEGIN
    -- Add location_type column (w3w, depot, bus_station, road, manual, search)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_type') THEN
        ALTER TABLE breakdowns ADD COLUMN location_type VARCHAR(50);
        RAISE NOTICE 'Added location_type column';
    ELSE
        RAISE NOTICE 'location_type column already exists';
    END IF;
    
    -- Add location_coords column for GPS coordinates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_coords') THEN
        ALTER TABLE breakdowns ADD COLUMN location_coords JSONB;
        RAISE NOTICE 'Added location_coords column';
    ELSE
        RAISE NOTICE 'location_coords column already exists';
    END IF;
    
    -- Add location_w3w column for What3Words
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_w3w') THEN
        ALTER TABLE breakdowns ADD COLUMN location_w3w VARCHAR(255);
        RAISE NOTICE 'Added location_w3w column';
    ELSE
        RAISE NOTICE 'location_w3w column already exists';
    END IF;
    
    -- Add location_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_verified') THEN
        ALTER TABLE breakdowns ADD COLUMN location_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added location_verified column';
    ELSE
        RAISE NOTICE 'location_verified column already exists';
    END IF;
    
    -- Add location_updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_updated_at') THEN
        ALTER TABLE breakdowns ADD COLUMN location_updated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added location_updated_at column';
    ELSE
        RAISE NOTICE 'location_updated_at column already exists';
    END IF;
    
    -- Add route_number column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='route_number') THEN
        ALTER TABLE breakdowns ADD COLUMN route_number VARCHAR(20);
        RAISE NOTICE 'Added route_number column';
    ELSE
        RAISE NOTICE 'route_number column already exists';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_location_type ON breakdowns(location_type);
CREATE INDEX IF NOT EXISTS idx_breakdowns_w3w ON breakdowns(location_w3w);
CREATE INDEX IF NOT EXISTS idx_breakdowns_coords ON breakdowns USING GIN (location_coords);
CREATE INDEX IF NOT EXISTS idx_breakdowns_route ON breakdowns(route_number);

-- Add helpful comments
COMMENT ON COLUMN breakdowns.location_type IS 'Type of location capture: w3w, depot, bus_station, road, manual, search';
COMMENT ON COLUMN breakdowns.location_coords IS 'GPS coordinates as JSON: {lat: number, lng: number}';
COMMENT ON COLUMN breakdowns.location_w3w IS 'What3Words address without slashes (e.g., filled.count.soap)';
COMMENT ON COLUMN breakdowns.location_verified IS 'Whether location is from a known/verified source';
COMMENT ON COLUMN breakdowns.location_updated_at IS 'Last time location was updated if vehicle moved';
COMMENT ON COLUMN breakdowns.route_number IS 'Route number the vehicle was operating on';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON breakdowns TO authenticated;
GRANT SELECT ON breakdowns TO anon;

-- Create a view for location statistics (optional but useful)
CREATE OR REPLACE VIEW breakdown_location_stats AS
SELECT 
    location_type,
    COUNT(*) as total_breakdowns,
    COUNT(CASE WHEN location_verified THEN 1 END) as verified_locations,
    ROUND(COUNT(CASE WHEN location_verified THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as verification_rate,
    COUNT(DISTINCT location_w3w) as unique_w3w_locations,
    COUNT(DISTINCT depot_id) as depots_affected,
    COUNT(DISTINCT route_number) as routes_affected
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY location_type
ORDER BY total_breakdowns DESC;

-- Grant permissions on the view
GRANT SELECT ON breakdown_location_stats TO authenticated;
GRANT SELECT ON breakdown_location_stats TO anon;

-- Create a function to find nearby breakdowns (within 1km)
CREATE OR REPLACE FUNCTION find_nearby_breakdowns(
    lat NUMERIC,
    lng NUMERIC,
    radius_km NUMERIC DEFAULT 1.0
)
RETURNS TABLE (
    breakdown_id VARCHAR,
    fleet_no VARCHAR,
    location TEXT,
    distance_km NUMERIC,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.breakdown_id,
        b.fleet_no,
        b.location,
        ROUND((
            6371 * acos(
                cos(radians(lat)) * 
                cos(radians((b.location_coords->>'lat')::numeric)) * 
                cos(radians((b.location_coords->>'lng')::numeric) - radians(lng)) + 
                sin(radians(lat)) * 
                sin(radians((b.location_coords->>'lat')::numeric))
            )
        )::numeric, 2) AS distance_km,
        b.created_at
    FROM breakdowns b
    WHERE 
        b.location_coords IS NOT NULL
        AND b.location_coords->>'lat' IS NOT NULL
        AND b.location_coords->>'lng' IS NOT NULL
        AND (
            6371 * acos(
                cos(radians(lat)) * 
                cos(radians((b.location_coords->>'lat')::numeric)) * 
                cos(radians((b.location_coords->>'lng')::numeric) - radians(lng)) + 
                sin(radians(lat)) * 
                sin(radians((b.location_coords->>'lat')::numeric))
            )
        ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_nearby_breakdowns TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ LOCATION CAPTURE MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Added columns:';
    RAISE NOTICE '  • location_type';
    RAISE NOTICE '  • location_coords';
    RAISE NOTICE '  • location_w3w';
    RAISE NOTICE '  • location_verified';
    RAISE NOTICE '  • location_updated_at';
    RAISE NOTICE '  • route_number';
    RAISE NOTICE '';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Created breakdown_location_stats view';
    RAISE NOTICE 'Created find_nearby_breakdowns function';
    RAISE NOTICE '';
    RAISE NOTICE 'Database ready for location capture!';
END $$;