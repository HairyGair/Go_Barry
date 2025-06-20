#!/bin/bash
# Comprehensive activity log diagnostic script

API_URL="https://go-barry.onrender.com"

echo "🔍 COMPREHENSIVE ACTIVITY LOG DIAGNOSTIC"
echo "======================================="

# Step 1: Create a fresh activity
echo -e "\n1️⃣ Creating fresh test activity..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{
    "supervisorId": "supervisor001",
    "badge": "AW001"
  }')

SESSION_ID=$(echo $LOGIN_RESPONSE | jq -r '.sessionId')
SUPERVISOR_NAME=$(echo $LOGIN_RESPONSE | jq -r '.supervisor.name')
echo "✅ Logged in as $SUPERVISOR_NAME"

# Step 2: Create multiple activity types
echo -e "\n2️⃣ Creating test activities..."

# Start duty
echo "Starting duty..."
curl -s -X POST $API_URL/api/duty/start \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"dutyNumber\": 100
  }" | jq -r '.message'

# Wait a bit
sleep 2

# Step 3: Check raw database response
echo -e "\n3️⃣ Raw API Response (Full):"
echo "------------------------"
FULL_RESPONSE=$(curl -s "$API_URL/api/activity/logs?limit=5")
echo "$FULL_RESPONSE" | jq

# Step 4: Check if logs exist
echo -e "\n4️⃣ Checking logs structure:"
echo "------------------------"
echo "$FULL_RESPONSE" | jq '{
  success: .success,
  log_count: .logs | length,
  has_logs: (.logs != null),
  first_log: .logs[0]
}'

# Step 5: Check each log's structure
echo -e "\n5️⃣ Individual log structure:"
echo "------------------------"
echo "$FULL_RESPONSE" | jq '.logs[] | {
  action: .action,
  supervisor_name: .supervisor_name,
  details_type: (.details | type),
  details: .details,
  created_at: .created_at
}'

# Step 6: Check alternate endpoint
echo -e "\n6️⃣ Checking alternate endpoint /api/activity-logs:"
echo "------------------------"
curl -s "$API_URL/api/activity-logs?limit=3" | jq '.logs[] | {
  action: .action,
  supervisor: .supervisor_name,
  details: .details
}'

# Step 7: Test direct database query via API
echo -e "\n7️⃣ Checking for recent supervisor_login activities:"
echo "------------------------"
curl -s "$API_URL/api/activity-logs?action=supervisor_login&limit=5" | jq

# Step 8: End duty to create another activity
echo -e "\n8️⃣ Ending duty to create another activity..."
curl -s -X POST $API_URL/api/duty/end \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"notes\": \"Test completed\"
  }" | jq -r '.message'

# Wait for activity to be logged
sleep 2

# Step 9: Final check
echo -e "\n9️⃣ Final activity check (should show both duty start and end):"
echo "------------------------"
curl -s "$API_URL/api/activity/logs?limit=10" | jq '.logs[] | 
  select(.action == "duty_started" or .action == "duty_ended") | {
    action: .action,
    supervisor: .supervisor_name,
    duty_number: .details.duty_number,
    time: .created_at
  }'

echo -e "\n🔟 Display Screen URL Check:"
echo "If activities show in API but not on screen, check browser console for:"
echo "- Network errors"
echo "- JSON parsing errors"
echo "- Missing data in the response"

echo -e "\n✅ Diagnostic complete!"
echo "Check the Display Screen browser console for any errors."
