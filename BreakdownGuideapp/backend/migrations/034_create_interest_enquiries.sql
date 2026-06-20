-- =====================================================
-- Migration 034: Create interest_enquiries table
-- =====================================================
-- Persists every "I'm Interested" enquiry from the public site so none are
-- lost even if the notification email fails. Email remains the primary channel;
-- this is the durable backstop + an admin-reviewable record.
-- =====================================================

CREATE TABLE IF NOT EXISTS interest_enquiries (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NULL,
  role VARCHAR(150) NULL,
  fleet_size VARCHAR(100) NULL,
  depots VARCHAR(100) NULL,
  current_process VARCHAR(500) NULL,
  features JSON NULL,
  message TEXT NULL,
  email_sent TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(45) NULL,
  status ENUM('new', 'contacted', 'archived') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_interest_created (created_at),
  INDEX idx_interest_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
