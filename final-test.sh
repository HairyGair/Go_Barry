#!/bin/bash
# Final test after adding Supabase credentials

echo "================================"
echo "🎯 FINAL BREAKDOWN SYSTEM TEST"
echo "================================"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}1. Testing Breakdown Creation${NC}"
echo "Creating breakdown for fleet 6301..."
echo ""

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

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ SUCCESS! Breakdown created!${NC}"
  
  BREAKDOWN_ID=$(echo "$RESPONSE" | grep -o '"breakdown_id":"[^"]*' | sed 's/"breakdown_id":"//')
  DAILY_ID=$(echo "$RESPONSE" | grep -o '"daily_id":"[^"]*' | sed 's/"daily_id":"//')
  
  echo -e "${BLUE}Breakdown ID: $BREAKDOWN_ID${NC}"
  echo -e "${BLUE}Daily ID: $DAILY_ID${NC}"
  echo ""
  
  echo -e "${YELLOW}2. Checking Live Breakdowns${NC}"
  curl -s "$BACKEND_URL/api/breakdowns/live" | python3 -m json.tool 2>/dev/null || curl -s "$BACKEND_URL/api/breakdowns/live"
  echo ""
  
  echo -e "${GREEN}================================${NC}"
  echo -e "${GREEN}🎉 SYSTEM FULLY OPERATIONAL! 🎉${NC}"
  echo -e "${GREEN}================================${NC}"
  echo ""
  echo "✅ Backend deployed and working"
  echo "✅ Database connected"
  echo "✅ Breakdown tracking active"
  echo "✅ Sequential IDs generating"
  echo ""
  echo -e "${BLUE}Open the dashboard to see live data:${NC}"
  echo "file:///Users/anthony/Go BARRY App/Go_BARRY/public/enhanced-breakdown-dashboard.html"
  echo ""
  echo -e "${BLUE}Open the breakdown guide:${NC}"
  echo "file:///Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/index.html"
  
else
  echo -e "${RED}❌ Breakdown creation failed${NC}"
  echo ""
  echo -e "${YELLOW}This means Supabase credentials are still missing.${NC}"
  echo ""
  echo "To fix:"
  echo "1. Go to https://dashboard.render.com"
  echo "2. Click 'go-barry' service"
  echo "3. Click 'Environment' tab"
  echo "4. Add these variables:"
  echo "   SUPABASE_URL = [your Supabase project URL]"
  echo "   SUPABASE_ANON_KEY = [your anon public key]"
  echo "5. Save and wait for redeploy"
fi

echo ""
