-- Import all remaining data (skips duplicates)
SET FOREIGN_KEY_CHECKS=0;

-- ENGINEERS (5 records)
INSERT IGNORE INTO `engineers` (`id`, `badge_number`, `name`, `email`, `phone`, `depot`, `skills`, `certifications`, `status`, `current_breakdown_id`, `shift_start`, `shift_end`, `is_active`, `created_at`, `updated_at`) VALUES
  ('eng-uuid-001', 'ENG001', 'John Smith', 'john.smith@gonortheast.co.uk', NULL, 'Washington', '["electrical", "mechanical"]', '[]', 'available', NULL, NULL, NULL, 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27'),
  ('eng-uuid-002', 'ENG002', 'Sarah Johnson', 'sarah.johnson@gonortheast.co.uk', NULL, 'Riverside', '["hvac", "mechanical"]', '[]', 'available', NULL, NULL, NULL, 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27'),
  ('eng-uuid-003', 'ENG003', 'Mike Williams', 'mike.williams@gonortheast.co.uk', NULL, 'Consett', '["electrical", "diagnostics"]', '[]', 'available', NULL, NULL, NULL, 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27'),
  ('eng-uuid-004', 'ENG004', 'Emma Brown', 'emma.brown@gonortheast.co.uk', NULL, 'Washington', '["mechanical", "hydraulics"]', '[]', 'available', NULL, NULL, NULL, 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27'),
  ('eng-uuid-005', 'ENG005', 'David Wilson', 'david.wilson@gonortheast.co.uk', NULL, 'Deptford', '["electrical", "mechanical", "hvac"]', '[]', 'available', NULL, NULL, NULL, 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27');

-- FLEET VEHICLES (1 record)
INSERT IGNORE INTO `fleet_vehicles` (`id`, `fleet_no`, `registration`, `vehicle_type`, `make`, `model`, `depot`, `is_active`, `created_at`, `updated_at`) VALUES
  ('fleet-uuid-001', '5801', 'NK14 FZP', 'Yutong E12', 'Yutong', 'E12', 'Washington', 1, '2025-09-29 22:30:27', '2025-09-29 22:30:27');

SET FOREIGN_KEY_CHECKS=1;

-- Verification
SELECT 'Data import complete!' as status;
SELECT 'engineers' as table_name, COUNT(*) as records FROM engineers
UNION ALL SELECT 'fleet_vehicles', COUNT(*) FROM fleet_vehicles
UNION ALL SELECT 'breakdowns', COUNT(*) FROM breakdowns;
