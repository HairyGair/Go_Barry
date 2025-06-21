#!/bin/bash
# test-backend-routes.sh
# Test which routes are actually working on the deployed backend

echo "🧪 Testing Backend Route Registration"
echo "===================================="
echo ""

BASE_URL="https://go-barry.onrender.com"

# Test working route
echo "1️⃣ Testing WORKING route (/api/supervisor/active):"
curl -s "$BASE_URL/api/supervisor/active" | jq -C '.'
echo ""

# Test activity logs routes
echo "2️⃣ Testing activity logs route (/api/activity-logs):"
RESPONSE=$(curl -s "$BASE_URL/api/activity-logs")
echo "$RESPONSE" | jq -C '.'
if echo "$RESPONSE" | grep -q "renderOptimized"; then
  echo "❌ Route NOT registered - getting default response"
else
  echo "✅ Route IS registered"
fi
echo ""

# Test duty routes
echo "3️⃣ Testing duty route (/api/duty/types):"
RESPONSE=$(curl -s "$BASE_URL/api/duty/types")
echo "$RESPONSE" | jq -C '.'
if echo "$RESPONSE" | grep -q "renderOptimized"; then
  echo "❌ Route NOT registered - getting default response"
else
  echo "✅ Route IS registered"
fi
echo ""

# Test health extended
echo "4️⃣ Testing health extended (should work):"
curl -s "$BASE_URL/api/health-extended" | jq -C '.services | keys'
echo ""

# Add a direct test endpoint to backend
echo "5️⃣ Creating test endpoint to verify deployment..."
echo ""
echo "Add this to your backend/index.js after the activity logs registration:"
echo ""
echo "// TEST ENDPOINT - Remove after testing"
echo "app.get('/api/test-deployment-' + Date.now(), (req, res) => {"
echo "  res.json({"
echo "    success: true,"
echo "    message: 'Deployment successful',"
echo "    timestamp: new Date().toISOString(),"
echo "    activityLogsRegistered: !!activityLogsAPI,"
echo "    dutyAPIRegistered: !!dutyAPI"
echo "  });"
echo "});"
echo ""
echo "This will prove if the new code is actually deployed."
