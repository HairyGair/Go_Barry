-- Query to check the actual structure of existing tables
-- Run this first to understand what columns exist

-- Check supervisors table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'supervisors'
ORDER BY ordinal_position;

-- Check breakdowns table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'breakdowns'
ORDER BY ordinal_position;

-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;