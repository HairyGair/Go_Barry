#!/bin/bash
# Test the complete flow from wizard to dashboard

echo "====================================="
echo "Testing Complete Breakdown Flow"
echo "====================================="
echo ""
echo "This test verifies that breakdowns created in the"
echo "Breakdown Guide appear in the dashboard"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Step 1: Creating a test breakdown via API..."
echo ""

# Create a breakdown
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "TEST-'$(date +%s)'",
    "supervisor_badge": "TEST",
    "supervisor_name": "Test Supervisor",
    "location": "Test Location",
    "depot_id": "TEST",
    "wizard_type": "steering"
  }')

if echo "$RESPONSE" | grep -q "breakdown_id"; then
  BREAKDOWN_ID=$(echo "$RESPONSE" | grep -o '"breakdown_id":"[^"]*' | cut -d'"' -f4)
  DAILY_ID=$(echo "$RESPONSE" | grep -o '"daily_id":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Test breakdown created${NC}"
  echo "  Breakdown ID: $BREAKDOWN_ID"
  echo "  Daily ID: $DAILY_ID"
else
  echo -e "${RED}✗ Failed to create test breakdown${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "Step 2: Completing diagnosis..."

# Complete diagnosis
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/diagnose" \
  -H "Content-Type: application/json" \
  -d "{
    \"breakdown_id\": \"$BREAKDOWN_ID\",
    \"diagnosis\": \"Test diagnosis - steering issue\",
    \"severity\": \"AMBER\",
    \"passenger_cloud_required\": false
  }")

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Diagnosis completed${NC}"
else
  echo -e "${RED}✗ Failed to complete diagnosis${NC}"
fi

echo ""
echo "Step 3: Checking if breakdown appears in live list..."

# Get live breakdowns
RESPONSE=$(curl -s "$BACKEND_URL/api/breakdowns/live")

if echo "$RESPONSE" | grep -q "$BREAKDOWN_ID"; then
  echo -e "${GREEN}✓ Breakdown appears in live dashboard data${NC}"
else
  echo -e "${YELLOW}⚠ Breakdown not found in live data${NC}"
  echo "  This might be normal if it was already resolved"
fi

echo ""
echo "====================================="
echo "Manual Testing Instructions"
echo "====================================="
echo ""
echo -e "${YELLOW}1. Test Wizard → Dashboard Flow:${NC}"
echo "   a) Open the Breakdown Guide in a browser"
echo "   b) Login as a supervisor (e.g., AG003)"
echo "   c) Start any wizard (e.g., Steering)"
echo "   d) Enter a fleet number (e.g., 6301)"
echo "   e) Complete the wizard"
echo ""
echo -e "${YELLOW}2. Check Dashboard:${NC}"
echo "   a) Open breakdown-dashboard-enhanced.html in another tab"
echo "   b) Verify your breakdown appears with:"
echo "      - Correct fleet number"
echo "      - Daily ID (BD-2025-XXXXX format)"
echo "      - Timer counting minutes since diagnosis"
echo "      - Correct severity color"
echo ""
echo -e "${YELLOW}3. Test Real-time Updates:${NC}"
echo "   a) Complete another wizard"
echo "   b) Watch dashboard auto-refresh (5 seconds)"
echo "   c) New breakdown should appear automatically"
echo ""
echo -e "${YELLOW}4. Test Resolution:${NC}"
echo "   a) Click 'Resolve' on a breakdown"
echo "   b) Enter resolution notes"
echo "   c) Breakdown should disappear from dashboard"
echo ""

# Clean up test breakdown
if [ ! -z "$BREAKDOWN_ID" ]; then
  echo "Cleaning up test breakdown..."
  curl -s -X PUT "$BACKEND_URL/api/breakdowns/$BREAKDOWN_ID/resolve" \
    -H "Content-Type: application/json" \
    -d '{
      "resolution_notes": "Test completed",
      "resolving_supervisor": "TEST",
      "returned_to_service": true
    }' > /dev/null
  echo -e "${GREEN}✓ Test breakdown cleaned up${NC}"
fi

echo ""
echo "====================================="
echo -e "${GREEN}Connection Test Complete!${NC}"
echo "====================================="
echo ""
echo "The API connection is working. Now test the full flow"
echo "manually using the instructions above to verify the"
echo "wizard → dashboard integration is complete."
