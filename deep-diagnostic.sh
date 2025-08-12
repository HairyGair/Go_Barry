#!/bin/bash
# Deep diagnostic for breakdown API issues

echo "================================"
echo "🔍 DEEP BREAKDOWN API DIAGNOSTIC"
echo "================================"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

echo "1. Checking backend health..."
HEALTH=$(curl -s "$BACKEND_URL/api/health")
echo "$HEALTH" | head -c 200
echo ""
echo ""

echo "2. Testing breakdown endpoint directly..."
echo "Request body:"
cat << EOF
{
  "fleet_number": "6301",
  "supervisor_badge": "AG003",
  "supervisor_name": "Anthony Gair",
  "location": "Test Location",
  "depot_id": "Gateshead",
  "wizard_type": "brakes"
}
EOF
echo ""
echo "Full response with headers:"
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"6301","supervisor_badge":"AG003","supervisor_name":"Anthony Gair","location":"Test Location","depot_id":"Gateshead","wizard_type":"brakes"}' \
  -i 2>&1
echo ""
echo ""

echo "3. Testing if Supabase tables exist (indirect check)..."
curl -s "$BACKEND_URL/api/breakdowns/live" | head -c 500
echo ""
echo ""

echo "4. Checking memory/optimization status..."
curl -s "$BACKEND_URL/api/optimization/status" | head -c 200
echo ""
echo ""

echo "5. Checking if other database operations work..."
curl -s "$BACKEND_URL/api/alerts" | head -c 200
echo ""
echo ""

echo "================================"
echo "DIAGNOSIS SUMMARY"
echo "================================"
echo ""
echo "Possible issues:"
echo "1. Database tables not created - Run migration in Supabase"
echo "2. Supabase credentials missing - Check Render environment variables"
echo "3. Connection timeout - Check Supabase project is active"
echo ""
echo "To fix:"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project"
echo "3. Click 'SQL Editor'"
echo "4. Run the migration script"
echo ""
echo "Required Render environment variables:"
echo "- SUPABASE_URL (e.g., https://xxxxx.supabase.co)"
echo "- SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY"
echo ""
