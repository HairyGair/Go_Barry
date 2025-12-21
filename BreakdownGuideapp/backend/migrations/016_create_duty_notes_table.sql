-- =====================================================
-- Migration: 016_create_duty_notes_table.sql
-- Description: Create table for duty shift notes
-- Date: December 20, 2025
-- =====================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS duty_notes;

-- =====================================================
-- Table: duty_notes
-- Stores notes created during supervisor shifts
-- =====================================================
CREATE TABLE duty_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Supervisor info
    supervisor_id VARCHAR(36),
    supervisor_badge VARCHAR(20) NOT NULL,
    supervisor_name VARCHAR(100),

    -- Duty context
    duty_code VARCHAR(10) NOT NULL,
    duty_start_time DATETIME,

    -- Note content
    note TEXT NOT NULL,
    note_type ENUM('general', 'breakdown', 'handover', 'priority', 'info') DEFAULT 'general',

    -- Optional breakdown reference
    breakdown_id VARCHAR(50),

    -- Priority flag
    is_priority BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for common queries
    INDEX idx_supervisor_badge (supervisor_badge),
    INDEX idx_duty_code (duty_code),
    INDEX idx_created_at (created_at),
    INDEX idx_note_type (note_type),
    INDEX idx_is_priority (is_priority),
    INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Migration 016: Duty notes table created successfully' AS status;
