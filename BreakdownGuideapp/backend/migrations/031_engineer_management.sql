-- Migration 031: Engineer Management & Shift System
-- Created: 2026-02-12
-- Purpose: Add shift templates, daily shifts, and engineer management columns

-- engineer_shift_templates: manager-defined shift patterns
-- Note: supervisors.id and engineers.id are CHAR(36) UUIDs
CREATE TABLE IF NOT EXISTS engineer_shift_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_by CHAR(36) NOT NULL,
  depot_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_template_creator (created_by),
  FOREIGN KEY (created_by) REFERENCES supervisors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- engineer_daily_shifts: who's on shift today
CREATE TABLE IF NOT EXISTS engineer_daily_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  engineer_id CHAR(36) NOT NULL,
  shift_date DATE NOT NULL,
  shift_template_id INT,
  custom_start TIME,
  custom_end TIME,
  checked_in_by CHAR(36) NOT NULL,
  depot_code VARCHAR(10) NOT NULL,
  status ENUM('on_shift','completed','absent') DEFAULT 'on_shift',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_engineer_date (engineer_id, shift_date),
  INDEX idx_shift_date (shift_date),
  INDEX idx_shift_depot (depot_code, shift_date),
  FOREIGN KEY (engineer_id) REFERENCES engineers(id),
  FOREIGN KEY (shift_template_id) REFERENCES engineer_shift_templates(id),
  FOREIGN KEY (checked_in_by) REFERENCES supervisors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add managed_by + home_depot_code to engineers table
ALTER TABLE engineers ADD COLUMN managed_by CHAR(36) AFTER is_active;
ALTER TABLE engineers ADD COLUMN home_depot_code VARCHAR(10) AFTER depot;

-- Backfill home_depot_code from depot
UPDATE engineers SET home_depot_code = depot WHERE home_depot_code IS NULL;
