/**
 * Migration: Create activities table (MySQL)
 *
 * Purpose: Fix Activity Feed sync issues - replace JSON file logging with database
 *
 * Features:
 * - Unified activity feed for all system events and user actions
 * - Records breakdown actions, engineer assignments, wizard completions
 * - Full-text search support on messages
 * - Performance indexes for fast querying
 *
 * Usage:
 * - POST /api/activity/log - Log new activity
 * - GET /api/activity/feed - Get activity feed with filters
 * - GET /api/activity/search - Search activities
 *
 * Migration Date: 2025-11-02
 * Author: Anthony Gair
 * Converted from: create_activities_table.sql (PostgreSQL → MySQL)
 */

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    -- Primary key
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Activity classification
    activity_type VARCHAR(100) NOT NULL COMMENT 'Type of activity (breakdown_reported, engineer_assigned, etc.)',
    action VARCHAR(255) NOT NULL COMMENT 'Human-readable action description',

    -- Actor information (who performed the action)
    actor_type VARCHAR(50) NOT NULL COMMENT 'Type of actor (supervisor, engineer, admin, system)',
    actor_id VARCHAR(100) NULL COMMENT 'Actor unique identifier (badge number, user ID)',
    actor_name VARCHAR(255) NULL COMMENT 'Actor display name',

    -- Entity information (what was affected)
    entity_type VARCHAR(50) NULL COMMENT 'Type of entity affected (breakdown, vehicle, engineer, etc.)',
    entity_id VARCHAR(100) NULL COMMENT 'Entity unique identifier (breakdown_id, fleet_no)',
    entity_details JSON NULL COMMENT 'Additional structured data about the entity',

    -- Context and metadata
    depot VARCHAR(50) NULL COMMENT 'Depot where activity occurred',
    severity VARCHAR(20) DEFAULT 'info' COMMENT 'Activity severity (critical, high, medium, low, info)',
    priority INT DEFAULT 5 COMMENT 'Priority for sorting (1=highest, 10=lowest)',
    source VARCHAR(100) NULL COMMENT 'Source system or module that generated the activity',
    source_url VARCHAR(500) NULL COMMENT 'URL to view the related item',
    metadata JSON NULL COMMENT 'Additional unstructured metadata',
    icon VARCHAR(20) NULL COMMENT 'Emoji or icon for display',
    message TEXT NULL COMMENT 'Human-readable activity message for display',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When activity occurred',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When activity was last updated',

    -- Performance indexes
    INDEX idx_activities_type (activity_type),
    INDEX idx_activities_created (created_at DESC),
    INDEX idx_activities_depot (depot),
    INDEX idx_activities_entity (entity_id),
    INDEX idx_activities_actor (actor_id),
    INDEX idx_activities_severity (severity),
    INDEX idx_activities_composite (activity_type, created_at DESC, depot),

    -- Full-text search index for message search
    FULLTEXT INDEX idx_activities_message_search (message, action, actor_name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Unified activity feed for all system events and user actions';

-- Verify table creation
SELECT 'activities table created successfully' AS status;

-- Show table structure
DESCRIBE activities;

/**
 * Sample Queries for Testing
 */

-- Count total activities
-- SELECT COUNT(*) as total_activities FROM activities;

-- Recent activities
-- SELECT
--   id,
--   activity_type,
--   actor_name,
--   message,
--   created_at
-- FROM activities
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Activities by depot
-- SELECT
--   depot,
--   COUNT(*) as activity_count,
--   activity_type
-- FROM activities
-- WHERE depot IS NOT NULL
-- GROUP BY depot, activity_type
-- ORDER BY depot, activity_count DESC;

-- Search activities by text
-- SELECT
--   id,
--   activity_type,
--   message,
--   created_at
-- FROM activities
-- WHERE MATCH(message, action, actor_name) AGAINST('breakdown' IN NATURAL LANGUAGE MODE)
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Activities by severity
-- SELECT
--   severity,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM activities), 2) as percentage
-- FROM activities
-- GROUP BY severity
-- ORDER BY count DESC;
