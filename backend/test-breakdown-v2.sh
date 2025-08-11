#!/bin/bash
# Test script for Breakdown Tracker V2 API
# Make executable: chmod +x test-breakdown-v2.sh
# Run: ./test-breakdown-v2.sh

echo "Testing Breakdown Tracker V2 API endpoints..."
echo "==========================================="

# Base URL
BASE_URL="http://localhost:3001/api/breakdowns"

# Test 1: Start a new breakdown
echo ""
echo "1. Starting new breakdown..."
curl -X POST "$BASE_URL/start" \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_number": "5501",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location": "Newcastle City Centre",
    "depot_id": "Riverside",
    "route_number": "X21",
    "wizard_type": "general"
  }' | json_pp

echo ""
echo "2. Testing live breakdowns endpoint..."
curl "$BASE_URL/live" | json_pp

echo ""
echo "3. Testing today's breakdowns..."
curl "$BASE_URL/today" | json_pp

echo ""
echo "Test complete!"
