#!/bin/bash
# Test activity logs locally

echo "🧪 Testing Activity Logs on Local Backend..."

# Test activity logs endpoint
echo -e "\n1️⃣ Testing /api/activity/logs:"
curl -s http://localhost:3001/api/activity/logs?limit=5 | jq

# Test activity-logs endpoint (alternate)
echo -e "\n2️⃣ Testing /api/activity-logs:"
curl -s http://localhost:3001/api/activity-logs?limit=5 | jq

# Test duty types
echo -e "\n3️⃣ Testing /api/duty/types:"
curl -s http://localhost:3001/api/duty/types | jq

# Test supervisor login locally
echo -e "\n4️⃣ Testing supervisor login:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorId": "supervisor001",
    "badge": "AW001"
  }')

echo "$LOGIN_RESPONSE" | jq

SESSION_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.sessionId')

# Test duty start
echo -e "\n5️⃣ Testing duty start:"
curl -s -X POST http://localhost:3001/api/duty/start \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"dutyNumber\": 100
  }" | jq

# Check activity logs again
echo -e "\n6️⃣ Checking activity logs after actions:"
curl -s http://localhost:3001/api/activity/logs?limit=10 | jq

echo -e "\n✅ If these work locally, the code is correct and just needs deployment!"
