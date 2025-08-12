#!/bin/bash
# Debug Breakdown API Issues

echo "================================"
echo "🔍 DEBUGGING BREAKDOWN API"
echo "================================"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

echo "1. Testing API Health..."
curl -s "$BACKEND_URL/api/health" | head -c 100
echo ""
echo ""

echo "2. Testing Breakdown Test Endpoint..."
curl -s "$BACKEND_URL/api/breakdowns/test"
echo ""
echo ""

echo "3. Testing Supabase Connection..."
curl -s "$BACKEND_URL/api/supabase-health"
echo ""
echo ""

echo "4. Testing with Verbose Error Output..."
echo "Request:"
echo '{"fleet_number":"6301","supervisor_badge":"AG003","supervisor_name":"Anthony Gair","location":"Test","depot_id":"Gateshead","wizard_type":"brakes"}'
echo ""
echo "Response:"
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"6301","supervisor_badge":"AG003","supervisor_name":"Anthony Gair","location":"Test","depot_id":"Gateshead","wizard_type":"brakes"}' \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "5. Checking if tables exist (via live endpoint)..."
curl -s "$BACKEND_URL/api/breakdowns/live"
echo ""
echo ""

echo "6. Testing minimal payload..."
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"TEST","supervisor_badge":"TEST"}'
echo ""
echo ""

echo "================================"
echo "Diagnosis Complete"
echo "================================"
