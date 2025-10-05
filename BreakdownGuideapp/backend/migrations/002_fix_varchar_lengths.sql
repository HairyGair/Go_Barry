-- =====================================================
-- Fix VARCHAR Length Issues
-- =====================================================
-- The default_dashboard column needs to be longer to
-- accommodate values like 'breakdown-guide'
-- =====================================================

-- Fix default_dashboard column length
ALTER TABLE user_preferences
  ALTER COLUMN default_dashboard TYPE VARCHAR(100);

-- Fix map_view column length (in case of longer values)
ALTER TABLE user_preferences
  ALTER COLUMN map_view TYPE VARCHAR(50);

-- Verify the changes
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_preferences'
  AND column_name IN ('default_dashboard', 'map_view');
