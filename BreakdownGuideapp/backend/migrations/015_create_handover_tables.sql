-- =====================================================
-- Migration: 015_create_handover_tables.sql
-- Description: Create tables for duty handover functionality
-- Date: December 20, 2025
-- =====================================================

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS handover_breakdowns;
DROP TABLE IF EXISTS duty_handovers;

-- =====================================================
-- Table: duty_handovers
-- Stores shift handover records between supervisors
-- =====================================================
CREATE TABLE duty_handovers (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Outgoing supervisor info
    outgoing_supervisor_badge VARCHAR(20) NOT NULL,
    outgoing_supervisor_name VARCHAR(100),
    outgoing_duty_code VARCHAR(10),

    -- Incoming supervisor info (nullable for "next shift" handovers)
    incoming_supervisor_badge VARCHAR(20),
    incoming_supervisor_name VARCHAR(100),

    -- Handover details
    general_notes TEXT,
    breakdowns_count INT DEFAULT 0,
    handover_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'acknowledged') DEFAULT 'completed',

    -- Acknowledgment tracking
    acknowledged_at DATETIME,
    acknowledged_by VARCHAR(20),

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_outgoing_badge (outgoing_supervisor_badge),
    INDEX idx_incoming_badge (incoming_supervisor_badge),
    INDEX idx_handover_time (handover_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: handover_breakdowns
-- Links breakdowns to handover records with notes
-- =====================================================
CREATE TABLE handover_breakdowns (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Foreign key to handover
    handover_id INT NOT NULL,

    -- Breakdown reference
    breakdown_id VARCHAR(50),
    fleet_no VARCHAR(20),
    issue_category VARCHAR(100),
    severity VARCHAR(20),

    -- Handover-specific notes for this breakdown
    handover_notes TEXT,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    FOREIGN KEY (handover_id) REFERENCES duty_handovers(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_handover_id (handover_id),
    INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Add handover columns to breakdowns table (if not exists)
-- =====================================================
ALTER TABLE breakdowns
    ADD COLUMN IF NOT EXISTS handover_from VARCHAR(20),
    ADD COLUMN IF NOT EXISTS handover_to VARCHAR(20),
    ADD COLUMN IF NOT EXISTS handover_time DATETIME,
    ADD COLUMN IF NOT EXISTS handover_notes TEXT;

-- Add index for handover queries
CREATE INDEX IF NOT EXISTS idx_breakdowns_handover ON breakdowns(handover_from, handover_to);

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Migration 015: Handover tables created successfully' AS status;
