-- Add coordinate caching columns to streetworks table
ALTER TABLE streetworks 
ADD COLUMN IF NOT EXISTS converted_coordinates jsonb,
ADD COLUMN IF NOT EXISTS coordinate_metadata jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_streetworks_converted_coords 
ON streetworks ((converted_coordinates->>'lat'), (converted_coordinates->>'lng'));

-- Example of what will be stored:
-- converted_coordinates: {"lat": 54.8438741, "lng": -1.3649645, "accuracy": "high"}
-- coordinate_metadata: {
--   "converted_at": "2025-01-15T10:30:00Z",
--   "method": "proj4_osgb36_wgs84",
--   "precision": "1.1cm",
--   "confidence": 0.95,
--   "points_count": 3,
--   "verified": false
-- }
