#!/bin/bash

# =====================================================
# LOCATION CAPTURE DEPLOYMENT SCRIPT
# Deploy control room location capture to breakdown guide
# =====================================================

echo "🚀 Deploying Location Capture for Control Room..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if files exist
echo -e "${YELLOW}Step 1: Checking files...${NC}"

if [ -f "Go_BARRY/public/breakdown-guide/location-capture-control-room.js" ]; then
    echo -e "${GREEN}✓ JavaScript file exists${NC}"
else
    echo -e "${RED}✗ JavaScript file missing${NC}"
    exit 1
fi

if [ -f "Go_BARRY/public/breakdown-guide/location-capture-styles.css" ]; then
    echo -e "${GREEN}✓ CSS file exists${NC}"
else
    echo -e "${RED}✗ CSS file missing${NC}"
    exit 1
fi

# Step 2: Backup existing files
echo -e "${YELLOW}Step 2: Creating backups...${NC}"

BACKUP_DIR="backups/location-capture-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "Go_BARRY/public/breakdown-guide/guide.html" ]; then
    cp "Go_BARRY/public/breakdown-guide/guide.html" "$BACKUP_DIR/guide.html.backup"
    echo -e "${GREEN}✓ Backed up guide.html${NC}"
fi

if [ -f "Go_BARRY/public/breakdown-guide/supervisorBreakdownLogger.js" ]; then
    cp "Go_BARRY/public/breakdown-guide/supervisorBreakdownLogger.js" "$BACKUP_DIR/supervisorBreakdownLogger.js.backup"
    echo -e "${GREEN}✓ Backed up supervisorBreakdownLogger.js${NC}"
fi

# Step 3: Update guide.html to include new files
echo -e "${YELLOW}Step 3: Updating guide.html...${NC}"

if [ -f "Go_BARRY/public/breakdown-guide/guide.html" ]; then
    # Check if already included
    if grep -q "location-capture-control-room.js" "Go_BARRY/public/breakdown-guide/guide.html"; then
        echo -e "${GREEN}✓ JavaScript already included in guide.html${NC}"
    else
        # Add before closing </head> tag
        sed -i.bak '/<\/head>/i\
    <link rel="stylesheet" href="location-capture-styles.css">\
    <script src="location-capture-control-room.js"></script>' "Go_BARRY/public/breakdown-guide/guide.html"
        echo -e "${GREEN}✓ Added location capture files to guide.html${NC}"
    fi
else
    echo -e "${RED}✗ guide.html not found${NC}"
fi

# Step 4: Database migration
echo -e "${YELLOW}Step 4: Database migration SQL...${NC}"

cat > "location-capture-migration.sql" << 'EOF'
-- =====================================================
-- LOCATION CAPTURE DATABASE MIGRATION
-- Add location fields to breakdowns table
-- =====================================================

-- Add location columns if they don't exist
DO $$ 
BEGIN
    -- Add location_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_type') THEN
        ALTER TABLE breakdowns ADD COLUMN location_type VARCHAR(50);
    END IF;
    
    -- Add location_coords column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_coords') THEN
        ALTER TABLE breakdowns ADD COLUMN location_coords JSONB;
    END IF;
    
    -- Add location_w3w column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_w3w') THEN
        ALTER TABLE breakdowns ADD COLUMN location_w3w VARCHAR(255);
    END IF;
    
    -- Add location_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_verified') THEN
        ALTER TABLE breakdowns ADD COLUMN location_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Add location_updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='breakdowns' AND column_name='location_updated_at') THEN
        ALTER TABLE breakdowns ADD COLUMN location_updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_location_type ON breakdowns(location_type);
CREATE INDEX IF NOT EXISTS idx_breakdowns_w3w ON breakdowns(location_w3w);
CREATE INDEX IF NOT EXISTS idx_breakdowns_coords ON breakdowns USING GIN (location_coords);

-- Add comment to table
COMMENT ON COLUMN breakdowns.location_type IS 'Type of location capture: w3w, depot, bus_station, road, manual, search';
COMMENT ON COLUMN breakdowns.location_coords IS 'GPS coordinates as JSON: {lat: number, lng: number}';
COMMENT ON COLUMN breakdowns.location_w3w IS 'What3Words address without slashes';
COMMENT ON COLUMN breakdowns.location_verified IS 'Whether location is from a known/verified source';
COMMENT ON COLUMN breakdowns.location_updated_at IS 'Last time location was updated if vehicle moved';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON breakdowns TO authenticated;
GRANT SELECT ON breakdowns TO anon;
EOF

echo -e "${GREEN}✓ Created migration SQL file${NC}"
echo -e "${YELLOW}   Run this in Supabase SQL Editor: location-capture-migration.sql${NC}"

# Step 5: Create test command
echo -e "${YELLOW}Step 5: Creating test command...${NC}"

cat > "test-location-capture.sh" << 'EOF'
#!/bin/bash
# Quick test of location capture
echo "Opening location capture test in browser..."
open "test-location-capture.html"
EOF

chmod +x test-location-capture.sh
echo -e "${GREEN}✓ Created test script${NC}"

# Step 6: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Location Capture Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run the database migration in Supabase:"
echo "   - Open Supabase SQL Editor"
echo "   - Copy contents of location-capture-migration.sql"
echo "   - Execute the migration"
echo ""
echo "2. Test the location capture:"
echo "   ./test-location-capture.sh"
echo ""
echo "3. Update backend API to handle new location fields"
echo ""
echo "4. Deploy to production when ready"
echo ""
echo "Files created/updated:"
echo "  ✓ location-capture-control-room.js"
echo "  ✓ location-capture-styles.css"
echo "  ✓ location-capture-migration.sql"
echo "  ✓ test-location-capture.html"
echo "  ✓ LOCATION_CAPTURE_IMPLEMENTATION.md"
echo ""
echo "Backups saved to: $BACKUP_DIR"