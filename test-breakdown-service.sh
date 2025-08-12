#!/bin/bash
# Test the CORRECT Breakdown Guide API

echo "================================"
echo "🎯 TESTING BREAKDOWN GUIDE SERVICE"
echo "================================"
echo ""

# CORRECT URL for breakdown guide service
BACKEND_URL="https://go-barry-breakdown-guide.onrender.com"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Testing the dedicated Breakdown Guide service...${NC}"
echo "URL: $BACKEND_URL"
echo ""

echo "1. Testing if service is alive..."
curl -s "$BACKEND_URL/api/health" | head -c 200
echo ""
echo ""

echo "2. Testing breakdown test endpoint..."
curl -s "$BACKEND_URL/api/breakdowns/test"
echo ""
echo ""

echo "3. Creating a test breakdown..."
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "6301",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location": "Newcastle Central Station",
    "depot_id": "Gateshead",
    "wizard_type": "brakes"
  }')

echo "Response: $RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ SUCCESS! The breakdown guide service is working!${NC}"
  BREAKDOWN_ID=$(echo "$RESPONSE" | grep -o '"breakdown_id":"[^"]*' | sed 's/"breakdown_id":"//')
  echo -e "${BLUE}Created breakdown: $BREAKDOWN_ID${NC}"
else
  echo -e "${YELLOW}Note: This service might need configuration${NC}"
fi

echo ""
echo "4. Checking live breakdowns..."
curl -s "$BACKEND_URL/api/breakdowns/live"
echo ""
echo ""

echo "================================"
echo "UPDATING YOUR FRONTEND..."
echo "================================"
echo ""
echo "If the breakdown guide service is working, update your frontend files to use:"
echo -e "${GREEN}$BACKEND_URL${NC}"
echo ""
echo "Files to update:"
echo "1. Go_BARRY/public/breakdown-guide/supervisorBreakdownLogger.js"
echo "   Change: const BACKEND_URL = window.BACKEND_URL || 'https://go-barry.onrender.com';"
echo "   To:     const BACKEND_URL = window.BACKEND_URL || '$BACKEND_URL';"
echo ""
echo "2. Go_BARRY/public/enhanced-breakdown-dashboard.html"
echo "   Change: const BACKEND_URL = 'https://go-barry.onrender.com';"
echo "   To:     const BACKEND_URL = '$BACKEND_URL';"
echo ""
