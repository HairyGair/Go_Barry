#!/bin/bash

# Test CORS Configuration for Breakdown Dashboard
# This script tests if the CORS fix is working properly

echo "🔍 Testing CORS Configuration for Breakdown Dashboard"
echo "===================================================="
echo ""

API_URL="https://go-barry.onrender.com/api/breakdowns/live"
ORIGIN="https://breakdowns.gobarry.co.uk"

echo "📡 Testing API endpoint: $API_URL"
echo "🌐 From origin: $ORIGIN"
echo ""

# Test with curl including Origin header
echo "1️⃣ Testing with Origin header..."
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: $ORIGIN" \
  -H "Accept: application/json" \
  "$API_URL")

if [ "$response" = "200" ]; then
    echo "✅ API returned 200 OK"
else
    echo "❌ API returned HTTP $response"
fi

# Check if CORS headers are present
echo ""
echo "2️⃣ Checking CORS headers..."
cors_headers=$(curl -sI \
  -H "Origin: $ORIGIN" \
  -H "Accept: application/json" \
  "$API_URL" | grep -i "access-control")

if [ -n "$cors_headers" ]; then
    echo "✅ CORS headers found:"
    echo "$cors_headers"
else
    echo "❌ No CORS headers found"
fi

# Test preflight request
echo ""
echo "3️⃣ Testing preflight OPTIONS request..."
options_response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$API_URL")

if [ "$options_response" = "200" ] || [ "$options_response" = "204" ]; then
    echo "✅ Preflight request successful (HTTP $options_response)"
else
    echo "❌ Preflight request failed (HTTP $options_response)"
fi

# Test actual data fetch
echo ""
echo "4️⃣ Testing actual data fetch..."
data=$(curl -s \
  -H "Origin: $ORIGIN" \
  -H "Accept: application/json" \
  "$API_URL")

if echo "$data" | grep -q "success"; then
    echo "✅ Successfully fetched data from API"
    echo "📊 Response preview:"
    echo "$data" | head -c 200
    echo "..."
else
    echo "❌ Failed to fetch data from API"
    echo "Response: $data"
fi

echo ""
echo "===================================================="
echo "📝 Summary:"
echo ""

# Provide diagnosis
if [ "$response" = "200" ] && [ -n "$cors_headers" ]; then
    echo "✅ CORS is properly configured!"
    echo "The dashboard at $ORIGIN should be able to access the API."
else
    echo "⚠️ CORS may not be fully configured."
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Ensure backend is deployed with the CORS fix"
    echo "2. Check Render.com deployment logs"
    echo "3. Verify render-startup.js includes $ORIGIN in allowed origins"
    echo "4. Try clearing browser cache and cookies"
fi

echo ""
echo "🔗 Test the dashboard directly at:"
echo "https://breakdowns.gobarry.co.uk/dashboard/"
