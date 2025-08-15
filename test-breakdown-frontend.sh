#!/bin/bash
# Make this file executable with: chmod +x test-breakdown-frontend.sh

# Test script for frontend breakdown tracking integration
# Tests the new breakdown tracking endpoints and frontend integration

echo "=================================="
echo "Testing Breakdown Tracking Frontend"
echo "=================================="

BACKEND_URL="https://go-barry.onrender.com"
# BACKEND_URL="http://localhost:3001"  # Uncomment for local testing

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "Testing API endpoints..."
echo ""

# Test 1: Start a breakdown
echo "1. Testing breakdown start endpoint..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "6301",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location": "54.9783,-1.6178",
    "depot_id": "RIV",
    "wizard_type": "steering"
  }')

if echo "$RESPONSE" | grep -q "breakdown_id"; then
  echo -e "${GREEN}✓ Breakdown start successful${NC}"
  BREAKDOWN_ID=$(echo "$RESPONSE" | grep -o '"breakdown_id":"[^"]*' | cut -d'"' -f4)
  DAILY_ID=$(echo "$RESPONSE" | grep -o '"daily_id":"[^"]*' | cut -d'"' -f4)
  echo "  Breakdown ID: $BREAKDOWN_ID"
  echo "  Daily ID: $DAILY_ID"
else
  echo -e "${RED}✗ Breakdown start failed${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo ""

# Test 2: Log a step
echo "2. Testing step logging..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/step" \
  -H "Content-Type: application/json" \
  -d "{
    \"breakdown_id\": \"$BREAKDOWN_ID\",
    \"step_type\": \"initial_assessment\",
    \"step_data\": {
      \"concern\": \"excessive_play\",
      \"measurement\": \"90mm\"
    },
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Step logged successfully${NC}"
else
  echo -e "${RED}✗ Step logging failed${NC}"
  echo "$RESPONSE"
fi

echo ""

# Test 3: Complete diagnosis
echo "3. Testing diagnosis completion..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/diagnose" \
  -H "Content-Type: application/json" \
  -d "{
    \"breakdown_id\": \"$BREAKDOWN_ID\",
    \"diagnosis\": \"Excessive steering play - immediate stop required\",
    \"severity\": \"STOP\",
    \"passenger_cloud_required\": true
  }")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Diagnosis completed successfully${NC}"
else
  echo -e "${RED}✗ Diagnosis completion failed${NC}"
  echo "$RESPONSE"
fi

echo ""

# Test 4: Get live breakdowns
echo "4. Testing live breakdowns endpoint..."
RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/live")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Live breakdowns retrieved${NC}"
  COUNT=$(echo "$RESPONSE" | grep -o '"fleet_no"' | wc -l)
  echo "  Active breakdowns: $COUNT"
else
  echo -e "${RED}✗ Failed to get live breakdowns${NC}"
  echo "$RESPONSE"
fi

echo ""

# Test 5: Test dashboard access
echo "5. Testing dashboard HTML endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/breakdowns/dashboard")

if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ Dashboard accessible${NC}"
else
  echo -e "${RED}✗ Dashboard not accessible (HTTP $RESPONSE)${NC}"
fi

echo ""
echo "=================================="
echo "Frontend Integration Checklist"
echo "=================================="
echo ""
echo "Please verify these manually in the browser:"
echo ""
echo -e "${YELLOW}1. Breakdown Guide Integration:${NC}"
echo "   [ ] Open breakdown guide: http://localhost:8080 (or production URL)"
echo "   [ ] Login as supervisor (e.g., AG003)"
echo "   [ ] Start a wizard (e.g., Steering)"
echo "   [ ] Enter fleet number"
echo "   [ ] Check browser console for 'Breakdown tracking started' message"
echo "   [ ] Complete wizard steps"
echo "   [ ] Verify Passenger Cloud modal appears for STOP decisions"
echo ""
echo -e "${YELLOW}2. Dashboard Integration:${NC}"
echo "   [ ] Open dashboard: breakdown-dashboard-enhanced.html"
echo "   [ ] Verify breakdowns appear with timers"
echo "   [ ] Test filters (My breakdowns, Critical, Overdue, Priority)"
echo "   [ ] Test resolve button functionality"
echo "   [ ] Verify auto-refresh every 5 seconds"
echo ""
echo -e "${YELLOW}3. Real-time Features:${NC}"
echo "   [ ] Start breakdown in one browser tab"
echo "   [ ] Open dashboard in another tab"
echo "   [ ] Verify breakdown appears immediately"
echo "   [ ] Complete diagnosis in wizard"
echo "   [ ] Verify timer starts in dashboard"
echo "   [ ] Wait 30+ minutes (or adjust test data)"
echo "   [ ] Verify overdue highlighting"
echo ""
echo -e "${YELLOW}4. Pattern Detection:${NC}"
echo "   [ ] Create 3+ breakdowns for same fleet number"
echo "   [ ] Verify repeat warning appears"
echo "   [ ] Check dashboard shows repeat flag"
echo ""

# Clean up test breakdown (optional)
if [ ! -z "$BREAKDOWN_ID" ]; then
  echo ""
  echo "Cleaning up test breakdown..."
  RESPONSE=$(curl -s -X PUT "$BACKEND_URL/api/breakdowns/$BREAKDOWN_ID/resolve" \
    -H "Content-Type: application/json" \
    -d '{
      "resolution_notes": "Test completed - resolved",
      "resolving_supervisor": "AG003",
      "returned_to_service": true
    }')
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Test breakdown resolved${NC}"
  else
    echo -e "${YELLOW}⚠ Could not resolve test breakdown${NC}"
  fi
fi

echo ""
echo "=================================="
echo -e "${GREEN}Frontend integration test complete!${NC}"
echo "=================================="
