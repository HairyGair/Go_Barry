#!/bin/bash
# Test script for Supervisor Activity Log and Duty Management

API_URL="https://go-barry.onrender.com"
# API_URL="http://localhost:3001"

echo "🧪 Testing Supervisor Activity Log and Duty Management..."

# Test 1: Login as supervisor
echo -e "\n1️⃣ Testing supervisor login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorId": "supervisor005",
    "badge": "DH005"
  }')

SESSION_ID=$(echo $LOGIN_RESPONSE | jq -r '.sessionId')
echo "✅ Logged in as David Hall - Session: $SESSION_ID"

# Test 2: Start duty
echo -e "\n2️⃣ Starting Duty 100..."
curl -s -X POST $API_URL/api/duty/start \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"dutyNumber\": 100
  }" | jq

# Test 3: Check activity logs
echo -e "\n3️⃣ Checking recent activity logs..."
curl -s "$API_URL/api/activity/logs?limit=5&screenType=supervisor" | jq '.logs[] | {action: .action, supervisor: .supervisor_name, details: .details}'

# Test 4: Create a roadwork
echo -e "\n4️⃣ Creating a test roadwork..."
curl -s -X POST $API_URL/api/roadworks \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Roadwork - A1 Northbound\",
    \"location\": \"A1 Northbound, Newcastle\",
    \"sessionId\": \"$SESSION_ID\",
    \"coordinates\": {\"latitude\": 54.9783, \"longitude\": -1.6178},
    \"priority\": \"high\"
  }" | jq '.success'

# Test 5: Check duty status
echo -e "\n5️⃣ Checking duty status..."
curl -s "$API_URL/api/duty/status?sessionId=$SESSION_ID" | jq

# Test 6: Check active duties
echo -e "\n6️⃣ Checking all active duties..."
curl -s "$API_URL/api/duty/active" | jq

# Test 7: End duty
echo -e "\n7️⃣ Ending duty..."
curl -s -X POST $API_URL/api/duty/end \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"notes\": \"Shift completed successfully\"
  }" | jq

# Test 8: Final activity log check
echo -e "\n8️⃣ Final activity log check (should show all activities)..."
curl -s "$API_URL/api/activity/logs?limit=10&screenType=supervisor" | jq '.logs[] | {action: .action, supervisor: .supervisor_name, time: .created_at}'

echo -e "\n✅ Testing complete! Check the Display Screen to see all activities."
