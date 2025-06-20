-- Fix column lengths ONLY (skip policies since they already exist)
ALTER TABLE activity_logs 
ALTER COLUMN supervisor_id TYPE VARCHAR(20);

ALTER TABLE supervisor_sessions
ALTER COLUMN supervisor_id TYPE VARCHAR(20);

ALTER TABLE dismissed_alerts
ALTER COLUMN supervisor_id TYPE VARCHAR(20);