#!/bin/bash
# Test if routes are actually registered

API_URL="https://go-barry.onrender.com"

echo "🔍 Testing Route Registration..."

# Test health endpoints (these should work)
echo -e "\n1️⃣ Testing /api/health (should work):"
curl -s "$API_URL/api/health" | jq

# Test activity logs endpoints directly
echo -e "\n2️⃣ Testing GET /api/activity-logs (main endpoint):"
curl -s -X GET "$API_URL/api/activity-logs" | jq

echo -e "\n3️⃣ Testing GET /api/activity/logs (alias endpoint):"
curl -s -X GET "$API_URL/api/activity/logs" | jq

# Test duty endpoints
echo -e "\n4️⃣ Testing GET /api/duty/types:"
curl -s -X GET "$API_URL/api/duty/types" | jq

# Test supervisor endpoint (should work)
echo -e "\n5️⃣ Testing GET /api/supervisor/active (should work):"
curl -s -X GET "$API_URL/api/supervisor/active" | jq

# Test a non-existent endpoint
echo -e "\n6️⃣ Testing non-existent endpoint /api/nonexistent:"
curl -s -X GET "$API_URL/api/nonexistent" | jq

echo -e "\n✅ If all endpoints return the same 'renderOptimized' response, there's a catch-all route issue."
