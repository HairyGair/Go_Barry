-- Bug Reports System Migration (v2 - No Foreign Keys)
-- Created: 2025-11-05
-- Purpose: Track bugs, errors, and user feedback

CREATE TABLE IF NOT EXISTS bug_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Report Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('bug', 'error', 'feature', 'feedback') NOT NULL DEFAULT 'bug',
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  status ENUM('new', 'in_progress', 'resolved', 'closed', 'duplicate') NOT NULL DEFAULT 'new',

  -- User Information
  reporter_id INT,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_badge VARCHAR(50),

  -- Technical Context
  page_url TEXT,
  user_agent TEXT,
  browser_info JSON,
  error_message TEXT,
  error_stack TEXT,

  -- System State
  app_version VARCHAR(50),
  environment VARCHAR(50) DEFAULT 'production',

  -- Screenshots & Attachments
  screenshot_url TEXT,
  additional_data JSON,

  -- Reproduction Steps
  steps_to_reproduce TEXT,

  -- Resolution
  resolved_by INT,
  resolved_at DATETIME,
  resolution_notes TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_type (type),
  INDEX idx_reporter (reporter_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bug Report Comments (for tracking resolution progress)
CREATE TABLE IF NOT EXISTS bug_report_comments (
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
