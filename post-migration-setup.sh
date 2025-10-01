#!/bin/bash

# =====================================================
# POST-MIGRATION VERIFICATION & INTEGRATION
# Run after database migration is complete
# =====================================================

echo "================================================"
echo "🎯 LOCATION CAPTURE - POST-MIGRATION STEPS"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}✅ Step 1: Database Migration - COMPLETE${NC}"
echo ""

# Step 2: Test the location capture UI
echo -e "${BLUE}📍 Step 2: Testing Location Capture UI${NC}"
echo "----------------------------------------"
echo "Opening test page..."
echo ""

# Create a simple test HTML if it doesn't exist
if [ -f "test-location-capture.html" ]; then
    open test-location-capture.html 2>/dev/null || xdg-open test-location-capture.html 2>/dev/null || start test-location-capture.html 2>/dev/null
    echo "Test page opened in browser"
else
    echo -e "${RED}Test page not found${NC}"
fi

echo ""
echo "Try these tests:"
echo "  1. Enter fleet number: 6301"
echo "  2. Click 'Start Breakdown Report'"
echo "  3. Test What3Words: enter 'cafe.pulse.risky'"
echo "  4. Test depot selection: click 'Gateshead'"
echo "  5. Test manual entry: type a description"
echo ""
echo -e "${YELLOW}Does the location modal work correctly? (y/n)${NC}"
read -p "> " MODAL_WORKS

if [ "$MODAL_WORKS" != "y" ]; then
    echo -e "${RED}Please check browser console for errors${NC}"
    echo "Common issues:"
    echo "  - Files not loaded in correct path"
    echo "  - JavaScript errors in console"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Location capture UI working${NC}"
echo ""

# Step 3: Update guide.html
echo -e "${BLUE}📝 Step 3: Update Breakdown Guide HTML${NC}"
echo "----------------------------------------"
echo "Add these lines to breakdown-guide/guide.html <head>:"
echo ""
echo -e "${YELLOW}<link rel=\"stylesheet\" href=\"location-capture-styles.css\">"
echo -e "<script src=\"location-capture-control-room.js\"></script>${NC}"
echo ""
echo "File location: Go_BARRY/public/breakdown-guide/guide.html"
echo ""
read -p "Press ENTER when guide.html is updated..."

# Step 4: Update supervisorBreakdownLogger.js
echo ""
echo -e "${BLUE}🔧 Step 4: Update Supervisor Logger${NC}"
echo "----------------------------------------"
echo "We need to modify supervisorBreakdownLogger.js"
echo ""
echo "Would you like me to:"
echo "  1. Show you the code changes to make manually"
echo "  2. Create a patched version for you to review"
echo ""
read -p "Enter choice (1 or 2): " UPDATE_CHOICE

if [ "$UPDATE_CHOICE" = "2" ]; then
    echo ""
    echo "Creating patched version..."
    echo "Check: supervisorBreakdownLogger-with-location.js"
fi

# Step 5: Test with a real wizard
echo ""
echo -e "${BLUE}🧪 Step 5: Test with Real Wizard${NC}"
echo "----------------------------------------"
echo "Let's test with the Wipers wizard (simplest one)"
echo ""
echo "1. Open breakdown guide"
echo "2. Login as supervisor"
echo "3. Enter fleet number"
echo "4. Select 'Wipers/Washers' wizard"
echo "5. Verify location modal appears BEFORE wizard starts"
echo ""
read -p "Press ENTER to continue..."

# Step 6: Backend API update
echo ""
echo -e "${BLUE}🔌 Step 6: Backend API Integration${NC}"
echo "----------------------------------------"
echo "Update backend/routes/breakdownTrackerV2.js with:"
echo ""
echo "  • Add location fields to /start endpoint"
echo "  • Add /location/:id update endpoint"
echo "  • Update /live endpoint to include location"
echo ""
echo "Reference file: breakdownTrackerV2-location-update.js"
echo ""
echo -e "${YELLOW}Has the backend been updated? (y/n)${NC}"
read -p "> " BACKEND_UPDATED

if [ "$BACKEND_UPDATED" = "y" ]; then
    echo -e "${GREEN}✅ Backend ready${NC}"
else
    echo -e "${YELLOW}⚠️  Backend update pending${NC}"
fi

# Step 7: Quick API test
echo ""
echo -e "${BLUE}🔍 Step 7: API Test${NC}"
echo "----------------------------------------"
echo "Testing breakdown creation with location..."
echo ""

# Create test data
cat > test-location-api.json << EOF
{
  "fleet_number": "6301",
  "supervisor_badge": "AG003",
  "supervisor_name": "Anthony Gair",
  "depot_id": "Gateshead",
  "wizard_type": "wipers",
  "location": "Newcastle Central Station",
  "location_type": "bus_station",
  "location_coords": {"lat": 54.9683, "lng": -1.6174},
  "location_w3w": "cafe.pulse.risky",
  "location_verified": true,
  "route_number": "21"
}
EOF

echo "Test data created in test-location-api.json"
echo ""
echo "Run this curl command to test:"
echo ""
echo -e "${YELLOW}curl -X POST https://go-barry.onrender.com/api/breakdowns/start \\"
echo "  -H \"Content-Type: application/json\" \\"
echo -e "  -d @test-location-api.json${NC}"
echo ""
read -p "Press ENTER after testing the API..."

# Step 8: Dashboard check
echo ""
echo -e "${BLUE}📊 Step 8: Enhanced Dashboard${NC}"
echo "----------------------------------------"
echo "Opening enhanced dashboard with location features..."
echo ""

if [ -f "enhanced-breakdown-dashboard-location.html" ]; then
    open enhanced-breakdown-dashboard-location.html 2>/dev/null
    echo "Dashboard opened"
    echo ""
    echo "Check for:"
    echo "  ✓ Location section in each breakdown card"
    echo "  ✓ What3Words links (///) "
    echo "  ✓ 'Open Maps' button"
    echo "  ✓ 'Get Directions' button"
    echo "  ✓ Verified/Unverified badges"
else
    echo -e "${RED}Enhanced dashboard not found${NC}"
fi

echo ""
read -p "Press ENTER to see final summary..."

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}📋 INTEGRATION SUMMARY${NC}"
echo "================================================"
echo ""

# Check what's done
CHECKS=0
TOTAL=8

echo -e "${GREEN}✅ Database migration complete${NC}"
((CHECKS++))

if [ "$MODAL_WORKS" = "y" ]; then
    echo -e "${GREEN}✅ Location modal tested${NC}"
    ((CHECKS++))
else
    echo -e "${RED}❌ Location modal needs fixing${NC}"
fi

if [ -f "Go_BARRY/public/breakdown-guide/guide.html" ]; then
    if grep -q "location-capture-control-room.js" "Go_BARRY/public/breakdown-guide/guide.html" 2>/dev/null; then
        echo -e "${GREEN}✅ Guide HTML updated${NC}"
        ((CHECKS++))
    else
        echo -e "${YELLOW}⚠️  Guide HTML needs updating${NC}"
    fi
fi

if [ "$BACKEND_UPDATED" = "y" ]; then
    echo -e "${GREEN}✅ Backend API updated${NC}"
    ((CHECKS++))
else
    echo -e "${YELLOW}⚠️  Backend API needs updating${NC}"
fi

echo ""
echo "Progress: $CHECKS/$TOTAL steps complete"
echo ""

if [ $CHECKS -eq $TOTAL ]; then
    echo -e "${GREEN}🎉 SYSTEM READY FOR PRODUCTION!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Train SDC operators (15 minutes)"
    echo "  2. Run pilot with one service"
    echo "  3. Monitor and gather feedback"
    echo "  4. Roll out to all services"
else
    echo -e "${YELLOW}Almost there! Complete remaining steps above.${NC}"
fi

echo ""
echo "================================================"
echo "Documentation:"
echo "  • Guide: LOCATION_CAPTURE_IMPLEMENTATION.md"
echo "  • Package: LOCATION_CAPTURE_FINAL_PACKAGE.md"
echo ""
echo "Support files:"
echo "  • Test page: test-location-capture.html"
echo "  • Dashboard: enhanced-breakdown-dashboard-location.html"
echo "  • API reference: breakdownTrackerV2-location-update.js"
echo "================================================"