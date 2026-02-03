-- QUICKSTART: Engineering Dashboard Setup for Supabase (FIXED VERSION)
-- Copy and paste this entire script into Supabase SQL Editor
-- Run it all at once - it's safe to run multiple times

-- ============================================
-- STEP 1: Add Columns to Breakdowns Table
-- ============================================

DO $$
BEGIN
    -- Add engineering workflow timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_accepted_at') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_accepted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_on_site_at') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_on_site_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_fixing_at') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_fixing_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_completed_at') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_completed_at TIMESTAMPTZ;
    END IF;

    -- Add engineering data fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_notes') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_notes JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='parts_used') THEN
        ALTER TABLE breakdowns ADD COLUMN parts_used JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='labor_hours') THEN
        ALTER TABLE breakdowns ADD COLUMN labor_hours DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='repair_category') THEN
        ALTER TABLE breakdowns ADD COLUMN repair_category VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='root_cause') THEN
        ALTER TABLE breakdowns ADD COLUMN root_cause TEXT;
    END IF;

    -- Add engineer assignment tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_id') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_id VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_name') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_badge') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_badge VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdowns' AND column_name='engineer_eta_minutes') THEN
        ALTER TABLE breakdowns ADD COLUMN engineer_eta_minutes INTEGER;
    END IF;

    RAISE NOTICE '✅ Step 1: Breakdowns table columns added successfully';
END $$;

-- ============================================
-- STEP 2: Create Engineers Table
-- ============================================

DROP TABLE IF EXISTS engineers CASCADE;

CREATE TABLE engineers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  depot VARCHAR(50) NOT NULL,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'on_job', 'off_duty', 'unavailable')),
  current_breakdown_id VARCHAR(50),
  shift_start TIME,
  shift_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Add Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_id ON breakdowns(engineer_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_engineer_accepted_at ON breakdowns(engineer_accepted_at);
CREATE INDEX IF NOT EXISTS idx_breakdowns_repair_category ON breakdowns(repair_category);
CREATE INDEX IF NOT EXISTS idx_engineers_depot ON engineers(depot);
CREATE INDEX IF NOT EXISTS idx_engineers_status ON engineers(status);
CREATE INDEX IF NOT EXISTS idx_engineers_badge_number ON engineers(badge_number);

-- ============================================
-- STEP 4: Create Trigger for Updated At
-- ============================================

CREATE OR REPLACE FUNCTION update_engineers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_engineers_updated_at ON engineers;
CREATE TRIGGER update_engineers_updated_at
    BEFORE UPDATE ON engineers
    FOR EACH ROW
    EXECUTE FUNCTION update_engineers_updated_at_column();

-- ============================================
-- STEP 5: Insert Sample Engineers
-- ============================================

INSERT INTO engineers (badge_number, name, email, depot, skills, status) VALUES
  ('ENG001', 'John Smith', 'john.smith@example.com', 'Washington', '["electrical", "mechanical"]'::jsonb, 'available'),
  ('ENG002', 'Sarah Johnson', 'sarah.johnson@example.com', 'Riverside', '["hvac", "mechanical"]'::jsonb, 'available'),
  ('ENG003', 'Mike Williams', 'mike.williams@example.com', 'Consett', '["electrical", "diagnostics"]'::jsonb, 'available'),
  ('ENG004', 'Emma Brown', 'emma.brown@example.com', 'Washington', '["mechanical", "hydraulics"]'::jsonb, 'available'),
  ('ENG005', 'David Wilson', 'david.wilson@example.com', 'Deptford', '["electrical", "mechanical", "hvac"]'::jsonb, 'available')
ON CONFLICT (badge_number) DO NOTHING;

-- ============================================
-- STEP 6: Verify Installation
-- ============================================

DO $$
DECLARE
    breakdown_col_count INTEGER;
    engineer_count INTEGER;
BEGIN
    -- Count new columns in breakdowns table
    SELECT COUNT(*) INTO breakdown_col_count
    FROM information_schema.columns
    WHERE table_name = 'breakdowns'
    AND column_name IN (
        'engineer_accepted_at', 'engineer_on_site_at', 'engineer_fixing_at',
        'engineer_completed_at', 'engineer_notes', 'parts_used', 'labor_hours',
        'repair_category', 'root_cause', 'engineer_id', 'engineer_name',
        'engineer_badge', 'engineer_eta_minutes'
    );

    -- Count engineers
    SELECT COUNT(*) INTO engineer_count FROM engineers;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'Engineering Dashboard Setup Complete';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Breakdowns table: % engineering columns added', breakdown_col_count;
    RAISE NOTICE '✅ Engineers table: % engineers loaded', engineer_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Engineer Logins:';
    RAISE NOTICE '  ENG001 - John Smith (Washington)';
    RAISE NOTICE '  ENG002 - Sarah Johnson (Riverside)';
    RAISE NOTICE '  ENG003 - Mike Williams (Consett)';
    RAISE NOTICE '  ENG004 - Emma Brown (Washington)';
    RAISE NOTICE '  ENG005 - David Wilson (Deptford)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Deploy backend to Render';
    RAISE NOTICE '2. Deploy frontend';
    RAISE NOTICE '3. Test at https://breakdowns.gobarry.co.uk/engineering';
END $$;

-- Show final status
SELECT
    'breakdowns' as table_name,
    COUNT(*) FILTER (WHERE column_name LIKE 'engineer%') as engineer_columns
FROM information_schema.columns
WHERE table_name = 'breakdowns'
UNION ALL
SELECT
    'engineers' as table_name,
    COUNT(*) as total_engineers
FROM engineers;
