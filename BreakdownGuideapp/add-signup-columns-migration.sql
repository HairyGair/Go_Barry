-- Add signup workflow columns to supervisors table
-- Run this in Supabase SQL Editor

-- Add the missing columns for signup workflow
ALTER TABLE supervisors 
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Update existing users to not be pending approval
UPDATE supervisors 
SET pending_approval = false 
WHERE pending_approval IS NULL;

-- Create index for pending approval queries
CREATE INDEX IF NOT EXISTS idx_supervisors_pending_approval ON supervisors(pending_approval);

-- Update RLS policies to support signup workflow
DROP POLICY IF EXISTS "Supervisors can view all supervisors" ON supervisors;
DROP POLICY IF EXISTS "Only admins can insert supervisors" ON supervisors;
DROP POLICY IF EXISTS "Only admins can update supervisors" ON supervisors;

-- Create new RLS policies
CREATE POLICY "Supervisors can view all active supervisors" ON supervisors
    FOR SELECT USING (is_active = true OR pending_approval = true);

CREATE POLICY "Allow signup for new supervisors" ON supervisors
    FOR INSERT WITH CHECK (
        pending_approval = true AND is_active = false
        OR EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can approve/update supervisors" ON supervisors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM supervisors
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'supervisors'
AND column_name IN ('pending_approval', 'signup_date', 'approved_date', 'auth_user_id')
ORDER BY column_name;