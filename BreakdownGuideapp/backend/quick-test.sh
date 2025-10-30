#!/bin/bash

# Quick Test Script for MySQL Backend
# Run this after server is started to verify everything works

echo "🚀 Testing Go BARRY MySQL Backend..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
    exit 1
fi
echo ""

# Test 2: Supervisors List
echo "2️⃣  Testing Supervisors API..."
SUPERVISORS=$(curl -s $BASE_URL/api/supervisors)
if echo "$SUPERVISORS" | grep -q "success"; then
    COUNT=$(echo "$SUPERVISORS" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✅ Supervisors API works - Found $COUNT supervisors${NC}"
else
    echo -e "${RED}❌ Supervisors API failed${NC}"
    echo "$SUPERVISORS"
fi
echo ""

# Test 3: Public Breakdowns
echo "3️⃣  Testing Public Breakdowns API..."
PUBLIC=$(curl -s $BASE_URL/api/public/breakdowns/live)
if echo "$PUBLIC" | grep -q "success"; then
    echo -e "${GREEN}✅ Public API works${NC}"
else
    echo -e "${RED}❌ Public API failed${NC}"
    echo "$PUBLIC"
fi
echo ""

# Test 4: Fleet API
echo "4️⃣  Testing Fleet API..."
FLEET=$(curl -s $BASE_URL/api/fleet)
if echo "$FLEET" | grep -q "success"; then
    echo -e "${GREEN}✅ Fleet API works${NC}"
else
    echo -e "${RED}❌ Fleet API failed${NC}"
    echo "$FLEET"
fi
echo ""

# Test 5: Analytics
echo "5️⃣  Testing Analytics API..."
ANALYTICS=$(curl -s "$BASE_URL/api/analytics/kpis?period=today")
if echo "$ANALYTICS" | grep -q "success"; then
    echo -e "${GREEN}✅ Analytics API works${NC}"
else
    echo -e "${RED}❌ Analytics API failed${NC}"
    echo "$ANALYTICS"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}All basic tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Test authentication with: curl -X POST $BASE_URL/api/auth/login ..."
echo "2. Run: node test-supervisors-migration.js"
echo "3. Run: node test-analytics-endpoints.js"
echo ""
echo "Full testing guide: see SETUP_AND_TEST.md"
echo ""
