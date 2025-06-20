-- Check current table structure
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'supervisor_sessions'
ORDER BY ordinal_position;