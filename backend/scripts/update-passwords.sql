-- ============================================================================
-- Set All Supervisor Passwords to: GoNorthEast2025!
-- Generated: 2025-10-26
-- ============================================================================

-- Update all active supervisors with the new password hash
UPDATE supervisors
SET password_hash = '$2b$10$5/iUdW8ItS/NMRAAfOU5U.4mf8KQoANVu039YfQE/IOHL1nb3AbvG'
WHERE is_active = 1;

-- Verify the update
SELECT
    badge_number,
    name,
    email,
    role,
    depot,
    LEFT(password_hash, 30) as password_preview,
    is_active
FROM supervisors
WHERE is_active = 1
ORDER BY name;

-- ============================================================================
-- Password Information:
-- ============================================================================
-- Password: GoNorthEast2025!
-- Hash Algorithm: bcrypt (10 rounds)
-- Hash: $2b$10$5/iUdW8ItS/NMRAAfOU5U.4mf8KQoANVu039YfQE/IOHL1nb3AbvG
--
-- All active supervisors can now log in with:
--   Password: GoNorthEast2025!
-- ============================================================================
