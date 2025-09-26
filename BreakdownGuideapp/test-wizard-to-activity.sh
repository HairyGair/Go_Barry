#!/bin/bash

echo "🔍 Testing Wizard to Activity Feed Flow"
echo "========================================"

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check backend health
echo ""
echo "1️⃣ Checking Backend Health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not responding or unhealthy${NC}"
    echo "Response: $HEALTH_RESPONSE"
    echo ""
    echo "Please start the backend server with:"
    echo "  cd backend && npm start"
    exit 1
fi

# Step 2: Test wizard completion endpoint
echo ""
echo "2️⃣ Testing Wizard Completion Endpoint..."

WIZARD_DATA='{
  "wizard_type": "Brakes",
  "wizard_decision": "CONTINUE",
  "wizard_assessment_data": {
    "brakeToFloor": false,
    "delayedBraking": false,
    "unusualNoises": true
  },
  "fleet_number": "5801",
  "location": "Test Location - Bradford",
  "supervisor_badge": "TEST001",
  "supervisor_name": "Anthony Gair",
  "issue_category": "brakes",
  "severity": "CONTINUE",
  "priority_level": 3,
  "engineering_required": false,
  "replacement_vehicle_required": false
}'

WIZARD_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/from-wizard" \
  -H "Content-Type: application/json" \
  -d "$WIZARD_DATA")

if echo "$WIZARD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Wizard data accepted${NC}"
    BREAKDOWN_ID=$(echo "$WIZARD_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('breakdown_id', 'unknown'))")
    echo "   Breakdown ID: $BREAKDOWN_ID"
else
    echo -e "${RED}❌ Wizard endpoint failed${NC}"
    echo "Response: $WIZARD_RESPONSE"
fi

# Step 3: Test live breakdowns endpoint
echo ""
echo "3️⃣ Testing Live Breakdowns Endpoint..."

LIVE_RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/live")

if echo "$LIVE_RESPONSE" | grep -q '"success":true'; then
    COUNT=$(echo "$LIVE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('breakdowns', [])))")
    echo -e "${GREEN}✅ Live breakdowns endpoint working${NC}"
    echo "   Found $COUNT active breakdowns"
    
    # Check if our test assessment appears
    if echo "$LIVE_RESPONSE" | grep -q "TEST001"; then
        echo -e "${GREEN}✅ Test assessment appears in live feed${NC}"
    else
        echo -e "${YELLOW}⚠️ Test assessment not found in live feed (might be filtered)${NC}"
    fi
else
    echo -e "${RED}❌ Live breakdowns endpoint failed${NC}"
    echo "Response: $LIVE_RESPONSE"
fi

# Step 4: Check activity feed formatting
echo ""
echo "4️⃣ Checking Activity Feed Format..."

# Check if breakdowns have wizard fields
if echo "$LIVE_RESPONSE" | grep -q '"wizard_type"'; then
    echo -e "${GREEN}✅ Wizard type field present${NC}"
else
    echo -e "${YELLOW}⚠️ Wizard type field missing${NC}"
fi

if echo "$LIVE_RESPONSE" | grep -q '"wizard_decision"'; then
    echo -e "${GREEN}✅ Wizard decision field present${NC}"
else
    echo -e "${YELLOW}⚠️ Wizard decision field missing${NC}"
fi

if echo "$LIVE_RESPONSE" | grep -q '"breakdown_source":"wizard"'; then
    echo -e "${GREEN}✅ Breakdown source identified as wizard${NC}"
else
    echo -e "${YELLOW}⚠️ Breakdown source not set to wizard${NC}"
fi

# Step 5: Test stats endpoint
echo ""
echo "5️⃣ Testing Stats Endpoint..."

STATS_RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/stats?period=today")

if [ ! -z "$STATS_RESPONSE" ]; then
    echo -e "${GREEN}✅ Stats endpoint responding${NC}"
    echo "   Stats: $STATS_RESPONSE"
else
    echo -e "${YELLOW}⚠️ Stats endpoint not responding${NC}"
fi

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary:"
echo ""

# Count successes
SUCCESS_COUNT=0
TOTAL_TESTS=5

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then ((SUCCESS_COUNT++)); fi
if echo "$WIZARD_RESPONSE" | grep -q '"success":true'; then ((SUCCESS_COUNT++)); fi
if echo "$LIVE_RESPONSE" | grep -q '"success":true'; then ((SUCCESS_COUNT++)); fi
if echo "$LIVE_RESPONSE" | grep -q '"wizard_'; then ((SUCCESS_COUNT++)); fi
if [ ! -z "$STATS_RESPONSE" ]; then ((SUCCESS_COUNT++)); fi

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✅ All tests passed! ($SUCCESS_COUNT/$TOTAL_TESTS)${NC}"
    echo ""
    echo "The wizard-to-activity-feed flow is working correctly."
else
    echo -e "${YELLOW}⚠️ Some tests failed ($SUCCESS_COUNT/$TOTAL_TESTS)${NC}"
    echo ""
    echo "Recommendations:"
    echo "1. Check backend logs for errors"
    echo "2. Verify database columns match the schema"
    echo "3. Ensure Supabase connection is configured"
fi

echo ""
echo "To view live activity feed:"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Login as a supervisor"
echo "3. Complete a wizard assessment"
echo "4. Check the activity feed on the home page"
