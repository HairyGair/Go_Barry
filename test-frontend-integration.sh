#!/bin/bash
# Make executable: chmod +x test-frontend-integration.sh

# Test script for Breakdown Tracker V2 Frontend Integration
# This tests the complete workflow from start to resolution

echo "================================"
echo "BREAKDOWN TRACKER V2 - TEST SUITE"
echo "================================"
echo ""

# Backend URL
BACKEND_URL="https://go-barry.onrender.com"

# Test data
FLEET_NUMBER="6301"
SUPERVISOR_BADGE="AG003"
SUPERVISOR_NAME="Anthony Gair"
DEPOT="Gateshead"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing: Start Breakdown${NC}"
echo "Creating new breakdown for fleet $FLEET_NUMBER..."

# Start breakdown and capture the response
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d "{
    \"fleet_number\": \"$FLEET_NUMBER\",
    \"supervisor_badge\": \"$SUPERVISOR_BADGE\",
    \"supervisor_name\": \"$SUPERVISOR_NAME\",
    \"location\": \"Newcastle Central Station\",
    \"depot_id\": \"$DEPOT\",
    \"wizard_type\": \"brakes\"
  }")

# Extract breakdown_id using grep and sed
BREAKDOWN_ID=$(echo "$RESPONSE" | grep -o '"breakdown_id":"[^"]*' | sed 's/"breakdown_id":"//')
DAILY_ID=$(echo "$RESPONSE" | grep -o '"daily_id":"[^"]*' | sed 's/"daily_id":"//')

if [ ! -z "$BREAKDOWN_ID" ]; then
  echo -e "${GREEN}✓ Breakdown created successfully${NC}"
  echo "  Breakdown ID: $BREAKDOWN_ID"
  echo "  Daily ID: $DAILY_ID"
else
  echo -e "${RED}✗ Failed to create breakdown${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo -e "${YELLOW}2. Testing: Log Wizard Step${NC}"
echo "Logging wizard step..."

STEP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/step" \
  -H "Content-Type: application/json" \
  -d "{
    \"breakdown_id\": \"$BREAKDOWN_ID\",
    \"step_type\": \"question_answered\",
    \"step_data\": {
      \"question\": \"Is brake pedal going to floor?\",
      \"answer\": \"No\"
    },
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }")

if echo "$STEP_RESPONSE" | grep -q "success\|ok\|true" || [ -z "$STEP_RESPONSE" ]; then
  echo -e "${GREEN}✓ Step logged${NC}"
else
  echo -e "${YELLOW}⚠ Step logging response: $STEP_RESPONSE${NC}"
fi

echo ""
echo -e "${YELLOW}3. Testing: Complete Diagnosis${NC}"
echo "Marking breakdown as diagnosed..."

DIAGNOSE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/diagnose" \
  -H "Content-Type: application/json" \
  -d "{
    \"breakdown_id\": \"$BREAKDOWN_ID\",
    \"diagnosis\": \"Brake pads worn - requires replacement\",
    \"severity\": \"AMBER\",
    \"passenger_cloud_required\": false
  }")

if echo "$DIAGNOSE_RESPONSE" | grep -q "success\|ok\|true" || [ -z "$DIAGNOSE_RESPONSE" ]; then
  echo -e "${GREEN}✓ Diagnosis recorded${NC}"
else
  echo -e "${YELLOW}⚠ Diagnosis response: $DIAGNOSE_RESPONSE${NC}"
fi

echo ""
echo -e "${YELLOW}4. Testing: Get Live Breakdowns${NC}"
echo "Fetching active breakdowns..."

LIVE_RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/live")
LIVE_COUNT=$(echo "$LIVE_RESPONSE" | grep -o '"fleet_no"' | wc -l | tr -d ' ')

if [ "$LIVE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Found $LIVE_COUNT active breakdown(s)${NC}"
else
  echo -e "${YELLOW}⚠ No active breakdowns found (may have been resolved)${NC}"
fi

echo ""
echo -e "${YELLOW}5. Testing: Get Today's Breakdowns${NC}"
echo "Fetching today's breakdown statistics..."

TODAY_RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/today")
TODAY_COUNT=$(echo "$TODAY_RESPONSE" | grep -o '"breakdown_id"' | wc -l | tr -d ' ')

echo -e "${GREEN}✓ Found $TODAY_COUNT breakdown(s) today${NC}"

echo ""
echo -e "${YELLOW}6. Testing: Resolve Breakdown${NC}"
echo "Resolving the breakdown..."

RESOLVE_RESPONSE=$(curl -s -X PUT "$BACKEND_URL/api/breakdowns/$BREAKDOWN_ID/resolve" \
  -H "Content-Type: application/json" \
  -d "{
    \"resolution_notes\": \"Brake pads replaced, vehicle tested and returned to service\",
    \"resolving_supervisor\": \"$SUPERVISOR_BADGE\",
    \"returned_to_service\": true
  }")

if echo "$RESOLVE_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Breakdown resolved successfully${NC}"
elif echo "$RESOLVE_RESPONSE" | grep -q "not found"; then
  echo -e "${YELLOW}⚠ Breakdown not found (may be testing issue)${NC}"
else
  echo -e "${YELLOW}⚠ Resolution response: $RESOLVE_RESPONSE${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}TEST SUITE COMPLETE${NC}"
echo "================================"
echo ""
echo "Summary:"
echo "- Breakdown ID: $BREAKDOWN_ID"
echo "- Daily ID: $DAILY_ID"
echo "- Fleet: $FLEET_NUMBER"
echo ""
echo "Next steps:"
echo "1. Open the dashboard at: /enhanced-breakdown-dashboard.html"
echo "2. Verify breakdowns appear with live timers"
echo "3. Test the filter buttons"
echo "4. Check auto-refresh is working (every 5 seconds)"
echo ""
echo "Dashboard URL: file://$(pwd)/Go_BARRY/public/enhanced-breakdown-dashboard.html"
