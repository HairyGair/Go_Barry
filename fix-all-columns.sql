-- Check if we need to rename columns to match what the code expects
-- If supervisor_badge exists, rename it to badge_number
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'supervisor_sessions' 
               AND column_name = 'supervisor_badge') THEN
        ALTER TABLE supervisor_sessions 
        RENAME COLUMN supervisor_badge TO badge_number;
    END IF;
END $$;

-- Ensure all columns exist with correct names
ALTER TABLE supervisor_sessions 
ADD COLUMN IF NOT EXISTS badge_number VARCHAR(10);

-- Fix column lengths
ALTER TABLE activity_logs 
ALTER COLUMN supervisor_id TYPE VARCHAR(20);

ALTER TABLE supervisor_sessions
ALTER COLUMN supervisor_id TYPE VARCHAR(20);

ALTER TABLE dismissed_alerts
ALTER COLUMN supervisor_id TYPE VARCHAR(20);