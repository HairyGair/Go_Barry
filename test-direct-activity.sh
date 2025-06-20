#!/bin/bash
# Direct test to create activity log entries

API_URL="https://go-barry.onrender.com"

echo "🧪 Direct Activity Log Test..."

# First, login as a supervisor
echo -e "\n1️⃣ Logging in as supervisor..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorId": "supervisor003",
    "badge": "AG003"
  }')

SESSION_ID=$(echo $LOGIN_RESPONSE | jq -r '.sessionId')
echo "✅ Logged in as Anthony Gair - Session: $SESSION_ID"

# Start a duty
echo -e "\n2️⃣ Starting Duty 200..."
curl -s -X POST $API_URL/api/duty/start \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"dutyNumber\": 200
  }" | jq '.success'

# Create a test roadwork
echo -e "\n3️⃣ Creating test roadwork..."
ROADWORK_RESPONSE=$(curl -s -X POST $API_URL/api/roadworks \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Activity Log - City Centre Closure\",
    \"location\": \"Northumberland Street, Newcastle\",
    \"sessionId\": \"$SESSION_ID\",
    \"coordinates\": {\"latitude\": 54.9742, \"longitude\": -1.6139},
    \"priority\": \"critical\",
    \"description\": \"Complete closure for emergency gas works\"
  }")
echo "Roadwork created: $(echo $ROADWORK_RESPONSE | jq -r '.success')"

# Dismiss an alert (if one exists)
echo -e "\n4️⃣ Trying to dismiss an alert..."
curl -s -X POST $API_URL/api/supervisor/dismiss-alert \
  -H "Content-Type: application/json" \
  -d "{
    \"alertId\": \"test_alert_123\",
    \"sessionId\": \"$SESSION_ID\",
    \"reason\": \"Testing activity log\",
    \"alertData\": {
      \"location\": \"Test Location\",
      \"title\": \"Test Alert\"
    }
  }" | jq '.success'

# Now check the activity logs
echo -e "\n5️⃣ Checking activity logs (raw response)..."
curl -s "$API_URL/api/activity/logs?limit=20" | jq

echo -e "\n6️⃣ Checking formatted activities..."
curl -s "$API_URL/api/activity/logs?limit=10" | jq '.logs[] | {
  action: .action,
  supervisor: .supervisor_name,
  time: .created_at,
  details: .details
}'

echo -e "\n✅ Test complete! Check the Display Screen now."
