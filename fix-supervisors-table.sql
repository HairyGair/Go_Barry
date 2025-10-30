-- Fix missing columns in supervisors table
-- Run this in phpMyAdmin SQL tab for database: gobarryco_breakdowns

-- Step 1: Check current table structure
DESCRIBE supervisors;

-- Step 2: Add missing shift_start column (if it doesn't exist)
ALTER TABLE supervisors
ADD COLUMN shift_start TIME NULL AFTER role;

-- Step 3: Add missing shift_end column (if it doesn't exist)
ALTER TABLE supervisors
ADD COLUMN shift_end TIME NULL AFTER shift_start;

-- Step 4: Verify the columns were added
DESCRIBE supervisors;

-- Step 5: Check if there are any supervisors in the table
SELECT id, email, name, badge_number, depot, role, shift_start, shift_end
FROM supervisors
LIMIT 5;
