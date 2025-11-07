-- Bug Reports System - Simple Migration (No Foreign Keys)
-- Run this in phpMyAdmin

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS bug_report_comments;
DROP TABLE IF EXISTS bug_reports;

-- Create bug_reports table
CREATE TABLE bug_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('bug', 'error', 'feature', 'feedback') NOT NULL DEFAULT 'bug',
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM('new', 'in_progress', 'resolved', 'closed', 'duplicate') NOT NULL DEFAULT 'new',

  reporter_id INT,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_badge VARCHAR(50),

  page_url TEXT,
  user_agent TEXT,
  browser_info JSON,
  error_message TEXT,
  error_stack TEXT,

  app_version VARCHAR(50),
  environment VARCHAR(50) DEFAULT 'production',

  screenshot_url TEXT,
  additional_data JSON,
  steps_to_reproduce TEXT,

  resolved_by INT,
  resolved_at DATETIME,
  resolution_notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create bug_report_comments table
CREATE TABLE bug_report_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bug_report_id INT NOT NULL,
  user_id INT,
  user_name VARCHAR(255),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_bug_report (bug_report_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
