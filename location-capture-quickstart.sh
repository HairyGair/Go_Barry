#!/bin/bash

# =====================================================
# LOCATION CAPTURE QUICK START
# One-command deployment helper
# =====================================================

echo "================================================"
echo "🚀 LOCATION CAPTURE SYSTEM - QUICK START"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 STEP 1: Database Migration${NC}"
echo "----------------------------------------"
echo "1. Open Supabase SQL Editor"
echo "2. Copy contents of: location-capture-migration.sql"
echo "3. Run the migration"
echo ""
read -p "Press ENTER when database migration is complete..."

echo ""
echo -e "${BLUE}🧪 STEP 2: Test Location Capture${NC}"
echo "----------------------------------------"
echo "Opening test page in browser..."
open test-location-capture.html 2>/dev/null || xdg-open test-location-capture.html 2>/dev/null || echo "Please open test-location-capture.html manually"
echo ""
echo "Test each location method:"
echo "  • What3Words: Try 'cafe.pulse.risky'"
echo "  • Bus Stations: Select Newcastle Central"
echo "  • Depots: Select Gateshead"
echo "  • Manual: Enter any description"
echo ""
read -p "Press ENTER when testing is complete..."

echo ""
echo -e "${BLUE}📁 STEP 3: File Check${NC}"
echo "----------------------------------------"

# Check if files exist
FILES_OK=true

if [ -f "Go_BARRY/public/breakdown-guide/location-capture-control-room.js" ]; then
    echo -e "${GREEN}✓${NC} JavaScript module found"
else
    echo -e "❌ JavaScript module missing"
    FILES_OK=false
fi

if [ -f "Go_BARRY/public/breakdown-guide/location-capture-styles.css" ]; then
    echo -e "${GREEN}✓${NC} CSS styles found"
else
    echo -e "❌ CSS styles missing"
    FILES_OK=false
fi

if [ -f "enhanced-breakdown-dashboard-location.html" ]; then
    echo -e "${GREEN}✓${NC} Enhanced dashboard found"
else
    echo -e "❌ Enhanced dashboard missing"
    FILES_OK=false
fi

if [ "$FILES_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some files are missing. Please check the installation.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 STEP 4: Backend Integration${NC}"
echo "----------------------------------------"
echo "Update your backend API with:"
echo "  • File: backend/routes/breakdownTrackerV2-location-update.js"
echo "  • Add location fields to /start endpoint"
echo "  • Add /location/:id update endpoint"
echo "  • Add /hotspots analysis endpoint"
echo ""
read -p "Press ENTER when backend is updated..."

echo ""
echo -e "${BLUE}🎯 STEP 5: Frontend Integration${NC}"
echo "----------------------------------------"
echo "Add to breakdown-guide/guide.html <head> section:"
echo ""
echo '  <link rel="stylesheet" href="location-capture-styles.css">'
echo '  <script src="location-capture-control-room.js"></script>'
echo ""
read -p "Press ENTER when HTML is updated..."

echo ""
echo -e "${BLUE}📊 STEP 6: Dashboard Test${NC}"
echo "----------------------------------------"
echo "Opening enhanced dashboard..."
open enhanced-breakdown-dashboard-location.html 2>/dev/null || echo "Please open enhanced-breakdown-dashboard-location.html manually"
echo ""
echo "Verify:"
echo "  • Location sections display correctly"
echo "  • What3Words links work"
echo "  • Map links open Google Maps"
echo "  • Filter for verified locations works"
echo ""
read -p "Press ENTER when dashboard testing is complete..."

echo ""
echo "================================================"
echo -e "${GREEN}✅ LOCATION CAPTURE SYSTEM READY!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test with one wizard in production"
echo "2. Train SDC operators (15 minutes)"
echo "3. Monitor first day usage"
echo "4. Roll out to all 26 wizards"
echo ""
echo "Documentation:"
echo "  • Implementation: LOCATION_CAPTURE_IMPLEMENTATION.md"
echo "  • Full Package: LOCATION_CAPTURE_FINAL_PACKAGE.md"
echo "  • Quick Reference: LOCATION_CAPTURE_COMPLETE.md"
echo ""
echo "Support:"
echo "  • Check browser console for errors"
echo "  • Verify network requests in DevTools"
echo "  • Test What3Words format: word.word.word"
echo ""
echo -e "${GREEN}Good luck with the deployment! 🚀${NC}"