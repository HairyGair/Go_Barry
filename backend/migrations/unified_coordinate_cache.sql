-- Migration: Create unified coordinate cache table
-- Date: January 2025
-- Purpose: Support new unified coordinate service

-- Create coordinate_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS coordinate_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL, -- 6 decimal places standard
  longitude DECIMAL(9, 6) NOT NULL, -- 6 decimal places standard
  source VARCHAR(50),
  confidence INTEGER DEFAULT 0,
  metadata JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coordinate_cache_key ON coordinate_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_coordinate_cache_cached_at ON coordinate_cache(cached_at);
CREATE INDEX IF NOT EXISTS idx_coordinate_cache_lat_lng ON coordinate_cache(latitude, longitude);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coordinate_cache_updated_at 
  BEFORE UPDATE ON coordinate_cache 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Add coordinate columns to streetworks table if they don't exist
ALTER TABLE streetworks 
  ADD COLUMN IF NOT EXISTS cached_lat DECIMAL(9, 6),
  ADD COLUMN IF NOT EXISTS cached_lng DECIMAL(9, 6),
  ADD COLUMN IF NOT EXISTS cached_coordinate_source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cached_coordinate_confidence INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP WITH TIME ZONE;

-- Create index on streetworks coordinates
CREATE INDEX IF NOT EXISTS idx_streetworks_cached_coords 
  ON streetworks(cached_lat, cached_lng) 
  WHERE cached_lat IS NOT NULL AND cached_lng IS NOT NULL;

-- Grant permissions (adjust role names as needed)
GRANT SELECT, INSERT, UPDATE ON coordinate_cache TO authenticated;
GRANT SELECT ON streetworks TO authenticated;
