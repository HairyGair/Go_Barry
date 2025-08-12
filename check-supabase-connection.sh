#!/bin/bash
# Check Supabase connection and tables

echo "================================"
echo "🔍 SUPABASE CONNECTION CHECK"
echo "================================"
echo ""

BACKEND_URL="https://go-barry.onrender.com"

echo "1. Testing basic health..."
curl -s "$BACKEND_URL/api/health" | grep -o '"status":"[^"]*"'
echo ""

echo "2. Testing memory status (confirms backend is running)..."
curl -s "$BACKEND_URL/api/memory" | head -c 100
echo ""

echo "3. Testing breakdown test endpoint..."
curl -s "$BACKEND_URL/api/breakdowns/test"
echo ""

echo "4. Testing with different supervisor badge..."
curl -X POST "$BACKEND_URL/api/breakdowns/start" \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"TEST","supervisor_badge":"TEST","supervisor_name":"TEST","location":"TEST","depot_id":"TEST","wizard_type":"test"}' 
echo ""

echo "5. Testing GET endpoints..."
echo "Live breakdowns:"
curl -s "$BACKEND_URL/api/breakdowns/live"
echo ""
echo "Today's breakdowns:"
curl -s "$BACKEND_URL/api/breakdowns/today"
echo ""

echo "================================"
echo "LIKELY ISSUES:"
echo "================================"
echo ""
echo "If all endpoints fail with 'Failed to...' errors:"
echo "→ Supabase credentials are missing in Render"
echo ""
echo "TO FIX:"
echo "1. Go to Supabase Dashboard → Settings → API"
echo "2. Copy these values:"
echo "   - Project URL (https://xxxxx.supabase.co)"
echo "   - anon public key (starts with eyJ...)"
echo ""
echo "3. Go to Render Dashboard → go-barry → Environment"
echo "4. Add these variables:"
echo "   SUPABASE_URL = [your project URL]"
echo "   SUPABASE_ANON_KEY = [your anon key]"
echo ""
echo "5. Click 'Save Changes' - Render will auto-redeploy"
echo ""
echo "Alternative variable names that might work:"
echo "   SUPABASE_SERVICE_KEY (instead of ANON_KEY)"
echo "   SUPABASE_SERVICE_ROLE_KEY (another option)"
echo ""
