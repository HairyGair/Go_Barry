#!/bin/bash

# Deployment Verification Script
# Run this from your local machine to test the deployed system

echo "========================================="
echo "Go BARRY Deployment Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo "1. Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s https://breakdowns.gobarry.co.uk/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Public Breakdowns API
echo "2. Testing Public Breakdowns API..."
BREAKDOWNS_RESPONSE=$(curl -s -w "\n%{http_code}" https://breakdowns.gobarry.co.uk/api/public/breakdowns/live)
HTTP_CODE=$(echo "$BREAKDOWNS_RESPONSE" | tail -n 1)
BODY=$(echo "$BREAKDOWNS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Breakdowns API returned 200 OK${NC}"
    if echo "$BODY" | grep -q "success"; then
        echo -e "${GREEN}✅ Valid JSON response received${NC}"
        BREAKDOWN_COUNT=$(echo "$BODY" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo "   Active breakdowns: $BREAKDOWN_COUNT"
    else
        echo -e "${YELLOW}⚠️  Response doesn't look like expected JSON${NC}"
        echo "   Response: $BODY"
    fi
else
    echo -e "${RED}❌ Breakdowns API returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: SDC Dashboard Accessibility
echo "3. Testing SDC Dashboard..."
SDC_RESPONSE=$(curl -s -w "\n%{http_code}" https://breakdowns.gobarry.co.uk/dashboards/sdc)
SDC_CODE=$(echo "$SDC_RESPONSE" | tail -n 1)

if [ "$SDC_CODE" = "200" ]; then
    echo -e "${GREEN}✅ SDC Dashboard returned 200 OK${NC}"
else
    echo -e "${RED}❌ SDC Dashboard returned HTTP $SDC_CODE${NC}"
fi
echo ""

# Test 4: Engineering Dashboard
echo "4. Testing Engineering Dashboard..."
ENG_RESPONSE=$(curl -s -w "\n%{http_code}" https://breakdowns.gobarry.co.uk/dashboards/engineering)
ENG_CODE=$(echo "$ENG_RESPONSE" | tail -n 1)

if [ "$ENG_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Engineering Dashboard returned 200 OK${NC}"
else
    echo -e "${RED}❌ Engineering Dashboard returned HTTP $ENG_CODE${NC}"
fi
echo ""

# Test 5: Management Dashboard
echo "5. Testing Management Dashboard..."
MGT_RESPONSE=$(curl -s -w "\n%{http_code}" https://breakdowns.gobarry.co.uk/dashboards/management)
MGT_CODE=$(echo "$MGT_RESPONSE" | tail -n 1)

if [ "$MGT_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Management Dashboard returned 200 OK${NC}"
else
    echo -e "${RED}❌ Management Dashboard returned HTTP $MGT_CODE${NC}"
fi
echo ""

# Test 6: Full Dashboard URL (Fallback)
echo "6. Testing Full Dashboard URL..."
FULL_RESPONSE=$(curl -s -w "\n%{http_code}" https://breakdowns.gobarry.co.uk/dashboards/sdc-operations-dashboard.html)
FULL_CODE=$(echo "$FULL_RESPONSE" | tail -n 1)

if [ "$FULL_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Full dashboard URL returned 200 OK${NC}"
else
    echo -e "${RED}❌ Full dashboard URL returned HTTP $FULL_CODE${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Open https://breakdowns.gobarry.co.uk/dashboards/sdc in your browser"
echo "2. Press F12 to open browser console"
echo "3. Check Network tab for any errors"
echo "4. Verify breakdowns appear (or 'No active breakdowns' message)"
echo ""
echo "If all tests passed above but dashboards don't show data:"
echo "- Check browser console for JavaScript errors"
echo "- Verify dashboard files were re-uploaded with fixed URLs"
echo "- Check that shared-navigation.js has correct API URLs"
echo ""
