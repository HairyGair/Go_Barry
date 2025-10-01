#!/bin/bash

# =====================================================
# LOCATION CAPTURE INTEGRATION VERIFICATION
# Checks that location capture is properly integrated
# =====================================================

echo "================================================"
echo "✅ LOCATION CAPTURE INTEGRATION STATUS"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ -d "breakdown-guide-service" ]; then
    echo -e "${GREEN}✅ Found breakdown-guide-service directory${NC}"
else
    echo -e "${RED}❌ breakdown-guide-service directory not found${NC}"
    echo "Please run from Go BARRY App root directory"
    exit 1
fi

echo ""
echo "Checking HTML integration..."

# Check if index.html has the location capture includes
if grep -q "location-capture-control-room.js" "breakdown-guide-service/public/index.html"; then
    echo -e "${GREEN}✅ JavaScript included in index.html${NC}"
else
    echo -e "${RED}❌ JavaScript NOT included in index.html${NC}"
fi

if grep -q "location-capture-styles.css" "breakdown-guide-service/public/index.html"; then
    echo -e "${GREEN}✅ CSS included in index.html${NC}"
else
    echo -e "${RED}❌ CSS NOT included in index.html${NC}"
fi

echo ""
echo "Checking file presence in breakdown-guide-service..."

if [ -f "breakdown-guide-service/public/location-capture-control-room.js" ]; then
    echo -e "${GREEN}✅ location-capture-control-room.js exists${NC}"
    SIZE=$(ls -lh "breakdown-guide-service/public/location-capture-control-room.js" | awk '{print $5}')
    echo "   Size: $SIZE"
else
    echo -e "${RED}❌ location-capture-control-room.js missing${NC}"
fi

if [ -f "breakdown-guide-service/public/location-capture-styles.css" ]; then
    echo -e "${GREEN}✅ location-capture-styles.css exists${NC}"
    SIZE=$(ls -lh "breakdown-guide-service/public/location-capture-styles.css" | awk '{print $5}')
    echo "   Size: $SIZE"
else
    echo -e "${RED}❌ location-capture-styles.css missing${NC}"
fi

echo ""
echo "Checking supervisorBreakdownLogger.js..."

if [ -f "breakdown-guide-service/public/supervisorBreakdownLogger.js" ]; then
    echo -e "${GREEN}✅ supervisorBreakdownLogger.js exists${NC}"
    
    # Check if it has location integration
    if grep -q "breakdownLocation" "breakdown-guide-service/public/supervisorBreakdownLogger.js"; then
        echo -e "${GREEN}✅ Location capture code found in logger${NC}"
    else
        echo -e "${YELLOW}⚠️  Location capture code NOT found in logger${NC}"
        echo "   You need to update supervisorBreakdownLogger.js"
        echo "   Reference: supervisorBreakdownLogger-with-location.js"
    fi
else
    echo -e "${RED}❌ supervisorBreakdownLogger.js missing${NC}"
fi

echo ""
echo "================================================"
echo "📋 INTEGRATION SUMMARY"
echo "================================================"
echo ""

# Count successes
CHECKS_PASSED=0
TOTAL_CHECKS=5

if grep -q "location-capture-control-room.js" "breakdown-guide-service/public/index.html" 2>/dev/null; then
    ((CHECKS_PASSED++))
fi
if grep -q "location-capture-styles.css" "breakdown-guide-service/public/index.html" 2>/dev/null; then
    ((CHECKS_PASSED++))
fi
if [ -f "breakdown-guide-service/public/location-capture-control-room.js" ]; then
    ((CHECKS_PASSED++))
fi
if [ -f "breakdown-guide-service/public/location-capture-styles.css" ]; then
    ((CHECKS_PASSED++))
fi
if grep -q "breakdownLocation" "breakdown-guide-service/public/supervisorBreakdownLogger.js" 2>/dev/null; then
    ((CHECKS_PASSED++))
fi

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 FULLY INTEGRATED!${NC}"
    echo "Location capture is ready to use!"
    echo ""
    echo "Test it now:"
    echo "1. Open breakdown-guide-service/public/index.html"
    echo "2. Login as supervisor"
    echo "3. Start any wizard"
    echo "4. Location modal should appear"
else
    echo -e "${YELLOW}⚠️  PARTIAL INTEGRATION ($CHECKS_PASSED/$TOTAL_CHECKS)${NC}"
    echo ""
    echo "To complete integration:"
    if ! grep -q "breakdownLocation" "breakdown-guide-service/public/supervisorBreakdownLogger.js" 2>/dev/null; then
        echo "1. Update supervisorBreakdownLogger.js with location capture code"
        echo "   Reference: supervisorBreakdownLogger-with-location.js"
    fi
fi

echo ""
echo "================================================"
echo "📁 File Locations:"
echo "  Service: breakdown-guide-service/public/"
echo "  Test: test-location-capture.html"
echo "  Reference: supervisorBreakdownLogger-with-location.js"
echo "================================================"