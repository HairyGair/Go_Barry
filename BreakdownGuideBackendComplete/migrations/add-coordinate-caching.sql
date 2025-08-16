-- Supabase Migration: Add coordinate caching columns to streetworks table
-- Run this in the Supabase SQL Editor

-- Add columns for coordinate caching
ALTER TABLE streetworks 
ADD COLUMN IF NOT EXISTS cached_lat NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS cached_lng NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS cached_coordinate_source TEXT,
ADD COLUMN IF NOT EXISTS cached_coordinate_accuracy TEXT,
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coordinate_metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_streetworks_cached_coords 
ON streetworks(cached_lat, cached_lng) 
WHERE cached_lat IS NOT NULL AND cached_lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_streetworks_cached_at 
ON streetworks(cached_at) 
WHERE cached_at IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN streetworks.cached_lat IS 'Cached WGS84 latitude from coordinate processing';
COMMENT ON COLUMN streetworks.cached_lng IS 'Cached WGS84 longitude from coordinate processing';
COMMENT ON COLUMN streetworks.cached_coordinate_source IS 'Source of cached coordinates (e.g., street_manager_converted, geocoded, intelligent_resolution)';
COMMENT ON COLUMN streetworks.cached_coordinate_accuracy IS 'Accuracy level of cached coordinates (high, medium, low)';
COMMENT ON COLUMN streetworks.cached_at IS 'Timestamp when coordinates were cached';
COMMENT ON COLUMN streetworks.coordinate_metadata IS 'Additional metadata about coordinate processing (strategy, confidence, etc.)';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'streetworks' 
    AND column_name IN ('cached_lat', 'cached_lng', 'cached_coordinate_source', 'cached_coordinate_accuracy', 'cached_at', 'coordinate_metadata')
ORDER BY 
    ordinal_position;
