-- Add secured_mileage column to breakdowns table
-- This tracks whether a breakdown is on contracted/secured mileage work
-- which is critical business information for compliance

DO $$
BEGIN
    -- Add secured_mileage boolean field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='breakdowns'
                   AND column_name='secured_mileage') THEN
        ALTER TABLE breakdowns
        ADD COLUMN secured_mileage BOOLEAN DEFAULT false;

        RAISE NOTICE '✅ Added secured_mileage column to breakdowns table';
    ELSE
        RAISE NOTICE 'ℹ️ secured_mileage column already exists';
    END IF;
END $$;

-- Add index for secured mileage filtering
CREATE INDEX IF NOT EXISTS idx_breakdowns_secured_mileage
ON breakdowns(secured_mileage)
WHERE secured_mileage = true;

-- Add comment explaining the field
COMMENT ON COLUMN breakdowns.secured_mileage IS
'Indicates if the breakdown occurred on secured/contracted mileage work. Failure to fulfill secured mileage may result in contractual fines.';
