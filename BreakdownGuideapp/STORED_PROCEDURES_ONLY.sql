-- =====================================================
-- STORED PROCEDURES FOR CPANEL MYSQL
-- =====================================================
-- Run this separately AFTER creating all tables
-- For phpMyAdmin: Copy and paste this entire section
-- =====================================================

DROP PROCEDURE IF EXISTS `get_or_create_preferences`;
DROP PROCEDURE IF EXISTS `cleanup_old_breakdowns`;

-- =====================================================
-- PROCEDURE 1: get_or_create_preferences
-- =====================================================

DELIMITER $$

CREATE PROCEDURE `get_or_create_preferences`(
    IN p_supervisor_id CHAR(36)
)
BEGIN
    DECLARE v_exists INT;

    -- Check if preferences exist
    SELECT COUNT(*) INTO v_exists
    FROM `user_preferences`
    WHERE `supervisor_id` = p_supervisor_id;

    -- If not found, create with defaults
    IF v_exists = 0 THEN
        INSERT INTO `user_preferences` (`supervisor_id`)
        VALUES (p_supervisor_id);
    END IF;

    -- Return the preferences
    SELECT * FROM `user_preferences`
    WHERE `supervisor_id` = p_supervisor_id;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDURE 2: cleanup_old_breakdowns
-- =====================================================

DELIMITER $$

CREATE PROCEDURE `cleanup_old_breakdowns`()
BEGIN
    DECLARE rows_deleted INT DEFAULT 0;

    -- Delete old resolved breakdowns
    DELETE FROM `breakdowns`
    WHERE `status` = 'resolved'
        AND `resolved_at` IS NOT NULL
        AND `resolved_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);

    -- Get number of rows deleted
    SET rows_deleted = ROW_COUNT();

    -- Return results
    SELECT
        rows_deleted AS deleted_count,
        NOW() AS cleanup_date;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Stored procedures created successfully' AS status;

-- Test that procedures exist
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
