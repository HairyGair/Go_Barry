-- =====================================================
-- Migration 035: Demo Supervisor Uses a Fictional Depot
-- =====================================================
-- Migration 033 created the demo supervisor (badge DEMO01) with
-- depot = 'Riverside' - a real Go North East depot name, which leaks
-- into GET /api/auth/supervisors and GET /api/auth/depots for demo
-- sessions. The rest of the demo dataset (breakdowns, engineers,
-- replacement vehicles) now uses fictional depots from
-- backend/data/demoDepots.js. Align the demo supervisor's own
-- `depot` column with that fictional set ('Northgate' - NGT).
-- =====================================================

UPDATE supervisors
SET depot = 'Northgate'
WHERE badge_number = 'DEMO01';
