-- =====================================================
-- Migration 033: Create Demo Supervisor Account
-- =====================================================
-- Creates a demo supervisor for showcasing the system
-- to potential customers. Badge DEMO01 (never collides
-- with production XX999 pattern).
-- =====================================================

-- Insert demo supervisor (skip if already exists)
INSERT IGNORE INTO supervisors (
    id,
    email,
    name,
    badge_number,
    depot,
    role,
    password_hash,
    is_active,
    pending_approval,
    created_at,
    updated_at
) VALUES (
    'demo-0000-0000-0000-000000000001',
    'demo@gobarry.co.uk',
    'Demo User',
    'DEMO01',
    'Riverside',
    'admin',
    '$2b$10$DEMO_PLACEHOLDER_NOT_USED_FOR_LOGIN',
    1,
    0,
    NOW(),
    NOW()
);
