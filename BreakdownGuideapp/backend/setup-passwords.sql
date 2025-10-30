-- =========================================
-- Go BARRY Supervisor Password Setup SQL
-- Generated: 2025-10-22T21:49:43.954Z
--
-- INSTRUCTIONS:
-- 1. Log into cPanel
-- 2. Go to phpMyAdmin
-- 3. Select your database
-- 4. Click "SQL" tab
-- 5. Copy and paste ALL of this SQL
-- 6. Click "Go"
-- =========================================

-- Step 1: Create/Update supervisors with password hashes
-- Password for all: Stafford45!

-- Anthony Gair (anthony.gair@gonortheast.co.uk)
INSERT INTO supervisors (email, name, badge_number, role, depot, is_active, pending_approval, password_hash, created_at, updated_at)
VALUES ('anthony.gair@gonortheast.co.uk', 'Anthony Gair', 'AG003', 'admin', 'Washington', 1, 0, '$2b$10$/Rij4pcQjzFsprwgyJYijOcfpsGnZF5HQ52JjnZRiOnO9BDBRR2f6', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  password_hash = '$2b$10$/Rij4pcQjzFsprwgyJYijOcfpsGnZF5HQ52JjnZRiOnO9BDBRR2f6',
  is_active = 1,
  updated_at = NOW();

-- Jamie Rao (jamie.rao@goahead.com)
INSERT INTO supervisors (email, name, badge_number, role, depot, is_active, pending_approval, password_hash, created_at, updated_at)
VALUES ('jamie.rao@goahead.com', 'Jamie Rao', 'JR001', 'supervisor', 'Washington', 1, 0, '$2b$10$bSBKdpop7ZV9g9vnFjtAFuG6T/kFp7shisryKNgKlZRSpdGDdutBW', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  password_hash = '$2b$10$bSBKdpop7ZV9g9vnFjtAFuG6T/kFp7shisryKNgKlZRSpdGDdutBW',
  is_active = 1,
  updated_at = NOW();

-- Ben Potts (ben.potts@goahead.com)
INSERT INTO supervisors (email, name, badge_number, role, depot, is_active, pending_approval, password_hash, created_at, updated_at)
VALUES ('ben.potts@goahead.com', 'Ben Potts', 'BP009', 'admin', 'Washington', 1, 0, '$2b$10$4lwC5GMYw8apk1MyewAqi..Kkj56YOP8BuSAPNLYTRRqmC8FkFtHu', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  password_hash = '$2b$10$4lwC5GMYw8apk1MyewAqi..Kkj56YOP8BuSAPNLYTRRqmC8FkFtHu',
  is_active = 1,
  updated_at = NOW();

-- =========================================
-- Step 2: Verify the setup worked
-- =========================================

SELECT
    email,
    name,
    badge_number,
    role,
    CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as has_password,
    is_active
FROM supervisors
ORDER BY name;

-- =========================================
-- Expected Results:
-- =========================================
-- anthony.gair@gonortheast.co.uk | Anthony Gair | AG003 | admin | YES | 1
-- ben.potts@goahead.com | Ben Potts | BP009 | admin | YES | 1
-- jamie.rao@goahead.com | Jamie Rao | JR001 | supervisor | YES | 1
--
-- =========================================
-- Now Test Login At:
-- =========================================
-- URL: https://breakdowns.gobarry.co.uk
--
-- Email: anthony.gair@gonortheast.co.uk
-- Password: Stafford45!
--
-- OR
--
-- Email: jamie.rao@goahead.com
-- Password: Stafford45!
-- =========================================
