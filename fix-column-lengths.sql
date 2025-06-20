-- Fix supervisor_id column length in activity_logs
ALTER TABLE activity_logs 
ALTER COLUMN supervisor_id TYPE VARCHAR(20);

-- Also check/update supervisor_sessions if needed
ALTER TABLE supervisor_sessions
ALTER COLUMN supervisor_id TYPE VARCHAR(20);