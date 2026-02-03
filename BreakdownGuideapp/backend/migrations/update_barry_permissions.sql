-- Update Barry Perryman's authorization
-- Grant manager privileges while keeping his title as Service Delivery Controller

UPDATE supervisors
SET
  role = 'manager',  -- Grant manager privileges (access to most dashboards, engineering excluded)
  updated_at = NOW()
WHERE
  email = 'barry.perryman@example.com'
  OR badge_number = 'BP001';

-- Verify the update
SELECT
  id,
  name,
  email,
  badge_number,
  role,
  depot,
  is_active,
  updated_at
FROM supervisors
WHERE email = 'barry.perryman@example.com';

-- Expected result:
-- Barry Perryman should now have role = 'manager'
-- This grants him access to:
-- ✅ Breakdown Guide
-- ✅ Control Room Display
-- ✅ SDC Dashboard
-- ✅ Management Dashboard
-- ✅ Fleet Intelligence
-- ✅ Analytics
-- ❌ Engineering Dashboard (engineering role required)
