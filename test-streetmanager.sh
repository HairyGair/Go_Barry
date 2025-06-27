#!/bin/bash

# Test StreetManager webhook setup and Supabase connection

echo "🔍 Testing StreetManager Webhook Setup..."
echo "=========================================="

# 1. Check webhook status
echo -e "\n1️⃣ Checking webhook status..."
curl -s https://go-barry.onrender.com/api/streetmanager/webhook/status | jq '.' || echo "Failed to get status"

# 2. Check if we can fetch notifications (this tests Supabase read)
echo -e "\n2️⃣ Testing Supabase read access..."
curl -s "https://go-barry.onrender.com/api/streetmanager/notifications?limit=1" | jq '.success, .error' || echo "Failed to fetch notifications"

# 3. Test webhook with minimal data (this will show Supabase write errors)
echo -e "\n3️⃣ Testing webhook with minimal SNS message..."
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: Notification" \
  -d '{
    "Type": "Notification",
    "MessageId": "test-'$(date +%s)'",
    "Message": "{\"event_type\":\"TEST\",\"object_type\":\"TEST\",\"object_reference\":\"TEST-'$(date +%s)'\",\"object_data\":{}}",
    "Timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }' 2>/dev/null | jq '.' || echo "Webhook test failed"

# 4. Test the simplified webhook test endpoint
echo -e "\n4️⃣ Testing webhook test endpoint..."
curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test 2>/dev/null | jq '.success, .message' || echo "Test endpoint failed"

# 5. Check unified roadworks API (to see if StreetManager data is flowing through)
echo -e "\n5️⃣ Checking if StreetManager data appears in unified API..."
curl -s "https://go-barry.onrender.com/api/roadworks/unified?source=street_manager&limit=1" | jq '.success, .metadata.sources.streetManager' || echo "Unified API failed"

# 6. Manual poll endpoint
echo -e "\n6️⃣ Testing manual poll endpoint..."
curl -X POST https://go-barry.onrender.com/api/streetmanager/poll -s | jq '.success, .message' || echo "Poll endpoint not available"

echo -e "\n✅ Tests complete. Check the output above for errors."
echo "If you see 'Failed to save notification' errors, the Supabase table needs updating."
