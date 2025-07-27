-- Add dismissal columns to streetworks table
-- This allows tracking of dismissed streetworks (Street Manager data)

ALTER TABLE streetworks 
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dismissed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS dismissal_reason TEXT,
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_streetworks_dismissed_at ON streetworks(dismissed_at);
CREATE INDEX IF NOT EXISTS idx_streetworks_dismissed_by ON streetworks(dismissed_by);
CREATE INDEX IF NOT EXISTS idx_streetworks_is_dismissed ON streetworks(is_dismissed);

-- Add comments for documentation
COMMENT ON COLUMN streetworks.dismissed_at IS 'Timestamp when the streetwork was dismissed by a supervisor';
COMMENT ON COLUMN streetworks.dismissed_by IS 'Name/badge of supervisor who dismissed this streetwork';
COMMENT ON COLUMN streetworks.dismissal_reason IS 'Reason provided for dismissing this streetwork';
COMMENT ON COLUMN streetworks.is_dismissed IS 'Flag indicating if this streetwork has been dismissed';