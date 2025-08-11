#!/bin/bash
# Test script for Breakdown Tracker V2 API

echo "Testing Breakdown Tracker V2 API..."
echo "===================================="

BASE_URL="http://localhost:3001/api/breakdowns"

# Test 1: Check if working
echo ""
echo "1. Testing if V2 is working..."
curl -s "$BASE_URL/test" | json_pp

# Test 2: Start a breakdown
echo ""
echo "2. Starting a new breakdown..."
response=$(curl -s -X POST "$BASE_URL/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "5501",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location": "Newcastle City Centre",
    "depot_id": "Riverside",
    "route_number": "X21"
  }')

echo "$response" | json_pp

# Extract breakdown_id if successful
breakdown_id=$(echo "$response" | grep -o '"breakdown_id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$breakdown_id" ]; then
  echo ""
  echo "✅ Breakdown created with ID: $breakdown_id"
fi

# Test 3: Get live breakdowns
echo ""
echo "3. Getting live breakdowns..."
curl -s "$BASE_URL/live" | json_pp

# Test 4: Get today's breakdowns
echo ""
echo "4. Getting today's breakdowns..."
curl -s "$BASE_URL/today" | json_pp

echo ""
echo "Test complete!"
