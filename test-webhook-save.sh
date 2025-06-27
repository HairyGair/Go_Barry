#!/bin/bash

echo "🔍 Testing StreetManager webhook saving..."
echo "========================================="

# 1. Send a test webhook
echo -e "\n1️⃣ Sending test webhook..."
RESPONSE=$(curl -s -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Wait a moment for processing
sleep 2

# 2. Check if test data was saved
echo -e "\n2️⃣ Checking if test was saved..."
NOTIFICATIONS=$(curl -s "https://go-barry.onrender.com/api/streetmanager/notifications?limit=5")
echo "$NOTIFICATIONS" | jq '.notifications | length' 2>/dev/null || echo "Failed to parse"

# 3. Try manual poll to fetch from API
echo -e "\n3️⃣ Trying manual poll from StreetManager API..."
POLL_RESPONSE=$(curl -s -X POST https://go-barry.onrender.com/api/streetmanager/poll)
echo "$POLL_RESPONSE" | jq '.success, .message' 2>/dev/null || echo "$POLL_RESPONSE"

# 4. Check roadworks table (where poll saves data)
echo -e "\n4️⃣ Checking if StreetManager data appears in unified roadworks..."
UNIFIED=$(curl -s "https://go-barry.onrender.com/api/roadworks/unified?source=street_manager&limit=5")
echo "StreetManager roadworks found: $(echo "$UNIFIED" | jq '.roadworks | length' 2>/dev/null || echo "0")"

# 5. Send minimal test directly
echo -e "\n5️⃣ Sending minimal test webhook..."
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: Notification" \
  -d '{
    "Type": "Notification",
    "MessageId": "minimal-test-'$(date +%s)'",
    "Message": "{\"event_type\":\"TEST_MINIMAL\",\"object_type\":\"TEST\",\"object_reference\":\"MINIMAL-'$(date +%s)'\",\"object_data\":{\"street_name\":\"Test Street\",\"work_status_ref\":\"in_progress\"}}",
    "Timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'

echo -e "\n\n✅ Test complete. Check backend logs for error details."
