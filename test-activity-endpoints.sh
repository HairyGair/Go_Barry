#!/bin/bash
# Test activity log endpoints

echo "🧪 Testing Activity Log Endpoints..."
echo ""

# Test logging display view
echo "1️⃣ Testing POST /api/activity/display-view..."
curl -X POST https://go-barry.onrender.com/api/activity/display-view \
  -H "Content-Type: application/json" \
  -d '{
    "alertCount": 5,
    "criticalCount": 2,
    "viewTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "2️⃣ Testing GET /api/activity/logs..."
curl -X GET "https://go-barry.onrender.com/api/activity/logs?limit=5&screenType=display" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Test complete!"