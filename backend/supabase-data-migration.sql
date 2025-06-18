-- Go BARRY Database Migration SQL
-- Generated: 2025-06-18T18:12:19.138Z
-- Run this in Supabase SQL Editor

-- Start transaction
BEGIN;

-- Supervisors Data
-- Message Templates Data

-- Commit transaction
COMMIT;

-- Verify data
SELECT 'supervisors' as table_name, count(*) as record_count FROM supervisors
UNION ALL
SELECT 'message_templates', count(*) FROM message_templates  
UNION ALL
SELECT 'template_categories', count(*) FROM template_categories
UNION ALL
SELECT 'historical_incidents', count(*) FROM historical_incidents;
