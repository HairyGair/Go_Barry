-- Migration: Create Engineering Tables for MySQL
-- Purpose: Create engineers and depots tables for engineering job tracking
-- Created: October 16, 2025
-- Migrated from Supabase to MySQL

-- ============================================
-- DEPOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS depots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_depot_code (code),
  INDEX idx_depot_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default depots
INSERT INTO depots (code, name, latitude, longitude, is_active) VALUES
  ('WAS', 'Washington', 54.9005, -1.5169, true),
  ('NCL', 'Riverside', 54.9731, -1.6178, true),
  ('CON', 'Consett', 54.8519, -1.8314, true),
  ('HEX', 'Hexham', 54.9719, -2.1011, true),
  ('GTS', 'Deptford', 54.9501, -1.5783, true),
  ('DAR', 'Darlington', 54.5245, -1.5515, true)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  is_active = VALUES(is_active);

-- ============================================
-- ENGINEERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS engineers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  depot VARCHAR(50) NOT NULL,

  -- Skills and certifications stored as JSON
  skills JSON DEFAULT NULL,
  certifications JSON DEFAULT NULL,

  -- Status tracking
  status ENUM('available', 'on_job', 'off_duty', 'unavailable') DEFAULT 'available',
  current_breakdown_id VARCHAR(50),

  -- Location tracking (point geometry for future use)
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),

  -- Shift information
  shift_start TIME,
  shift_end TIME,

  -- Active status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_engineer_depot (depot),
  INDEX idx_engineer_status (status),
  INDEX idx_engineer_badge (badge_number),
  INDEX idx_engineer_active (is_active),
  INDEX idx_engineer_breakdown (current_breakdown_id),

  FOREIGN KEY (current_breakdown_id) REFERENCES breakdowns(breakdown_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample engineers for testing
INSERT INTO engineers (badge_number, name, email, depot, skills, status) VALUES
  ('ENG001', 'John Smith', 'john.smith@gonortheast.co.uk', 'WAS',
   JSON_ARRAY('electrical', 'mechanical'), 'available'),
  ('ENG002', 'Sarah Johnson', 'sarah.johnson@gonortheast.co.uk', 'NCL',
   JSON_ARRAY('hvac', 'mechanical'), 'available'),
  ('ENG003', 'Mike Williams', 'mike.williams@gonortheast.co.uk', 'CON',
   JSON_ARRAY('electrical', 'diagnostics'), 'available'),
  ('ENG004', 'Emma Brown', 'emma.brown@gonortheast.co.uk', 'WAS',
   JSON_ARRAY('mechanical', 'hydraulics'), 'available'),
  ('ENG005', 'David Wilson', 'david.wilson@gonortheast.co.uk', 'GTS',
   JSON_ARRAY('electrical', 'mechanical', 'hvac'), 'available')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  depot = VALUES(depot),
  skills = VALUES(skills);

-- ============================================
-- BREAKDOWN_EVENTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS breakdown_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_event_breakdown (breakdown_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_created (created_at),

  FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add engineering tracking columns to breakdowns table (if not exist)
-- These track the engineer job lifecycle

-- Check and add columns using ALTER TABLE IF NOT EXISTS pattern
SET @dbname = DATABASE();
SET @tablename = 'breakdowns';

-- Engineer assignment columns
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_id') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_id VARCHAR(50)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_name') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_name VARCHAR(100)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_badge') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_badge VARCHAR(20)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Engineer workflow timestamps
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_accepted_at') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_accepted_at TIMESTAMP NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_on_site_at') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_on_site_at TIMESTAMP NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_fixing_at') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_fixing_at TIMESTAMP NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_completed_at') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_completed_at TIMESTAMP NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_dispatched_at') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_dispatched_at TIMESTAMP NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Engineer ETA
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_eta_minutes') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_eta_minutes INT')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Engineering work details
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'engineer_notes') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN engineer_notes JSON DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'parts_used') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN parts_used JSON DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'labor_hours') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN labor_hours DECIMAL(5,2)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'repair_category') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN repair_category VARCHAR(100)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'root_cause') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN root_cause TEXT')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = 'returned_to_service') > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN returned_to_service BOOLEAN DEFAULT true')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakdown_engineer_id ON breakdowns(engineer_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_engineer_badge ON breakdowns(engineer_badge);
CREATE INDEX IF NOT EXISTS idx_breakdown_repair_category ON breakdowns(repair_category);
CREATE INDEX IF NOT EXISTS idx_breakdown_engineer_accepted ON breakdowns(engineer_accepted_at);

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON engineers TO 'gobarry_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON depots TO 'gobarry_user'@'localhost';
-- GRANT SELECT, INSERT ON breakdown_events TO 'gobarry_user'@'localhost';

-- Migration complete
SELECT 'Engineering tables migration completed successfully' AS Status;
