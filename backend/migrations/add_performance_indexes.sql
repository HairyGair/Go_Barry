-- Add performance indexes for Go BARRY backend optimization
-- These indexes will speed up the most common queries

-- Index for state and date filtering (main query pattern)
CREATE INDEX IF NOT EXISTS idx_streetworks_state_dates 
ON streetworks (sm_works_state, sm_start_date, sm_end_date);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_streetworks_date_range 
ON streetworks (sm_start_date, sm_end_date);

-- Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_streetworks_location 
ON streetworks (sm_highway_authority, sm_town, sm_area);

-- Index for reference-based lookups
CREATE INDEX IF NOT EXISTS idx_streetworks_references 
ON streetworks (sm_reference, sm_permit_reference, sm_works_reference);

-- Partial index for active roadworks (most common filter)
CREATE INDEX IF NOT EXISTS idx_streetworks_active 
ON streetworks (sm_start_date) 
WHERE sm_works_state IN ('Works planned', 'Works in progress');

-- Index for coordinate existence checks
CREATE INDEX IF NOT EXISTS idx_streetworks_has_coords 
ON streetworks (id) 
WHERE sm_easting IS NOT NULL AND sm_northing IS NOT NULL;

-- Composite index for pagination with state filter
CREATE INDEX IF NOT EXISTS idx_streetworks_pagination 
ON streetworks (sm_works_state, sm_start_date, id);

-- Index for newly processed items (cache checking)
CREATE INDEX IF NOT EXISTS idx_streetworks_cache_status 
ON streetworks (converted_coordinates, coordinate_metadata);