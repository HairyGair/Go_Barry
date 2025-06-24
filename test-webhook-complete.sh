#!/bin/bash

echo "Testing Street Manager Webhook Integration"
echo "========================================="

BASE_URL="https://go-barry.onrender.com"

# Test webhook status
echo -e "\n1. Testing webhook status endpoint:"
echo "   GET $BASE_URL/api/streetmanager/webhook/status"
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/streetmanager/webhook/status")
echo "   Response: $STATUS_RESPONSE"

# Test webhook test endpoint
echo -e "\n2. Testing webhook test endpoint:"
echo "   POST $BASE_URL/api/streetmanager/webhook/test"
TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/streetmanager/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "   Response: $TEST_RESPONSE"

# Test subscription confirmation
echo -e "\n3. Testing SNS subscription confirmation:"
echo "   POST $BASE_URL/api/streetmanager/webhook"
SNS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/streetmanager/webhook" \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: SubscriptionConfirmation" \
  -d '{
    "Type": "SubscriptionConfirmation",
    "MessageId": "test-message-id",
    "Token": "test-token",
    "TopicArn": "arn:aws:sns:eu-west-2:123456789012:streetmanager-test",
    "Message": "Test subscription confirmation",
    "SubscribeURL": "https://example.com/confirm"
  }')
echo "   Response: $SNS_RESPONSE"

# Test notification
echo -e "\n4. Testing SNS notification:"
echo "   POST $BASE_URL/api/streetmanager/webhook"
NOTIFICATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/streetmanager/webhook" \
  -H "Content-Type: application/json" \
  -H "x-amz-sns-message-type: Notification" \
  -d '{
    "Type": "Notification",
    "MessageId": "test-notification-id",
    "TopicArn": "arn:aws:sns:eu-west-2:123456789012:streetmanager-test",
    "Message": "{\"event_type\":\"PERMIT_CREATED\",\"event_time\":\"2025-06-24T10:00:00Z\",\"object_reference\":\"TEST-001\",\"object_data\":{\"permit_reference_number\":\"TEST-PERMIT-001\",\"location_description\":\"A1 Newcastle\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[-1.6178,54.9783]}}}"
  }')
echo "   Response: $NOTIFICATION_RESPONSE"

echo -e "\n5. Summary:"
echo "   - If status endpoint returns webhook configuration: ✅ Routes registered"
echo "   - If test endpoint processes event: ✅ Event processing works"
echo "   - If subscription endpoint returns success: ✅ SNS handling works"
echo "   - If notification endpoint processes: ✅ Full integration works"
echo -e "\n6. Webhook URL for Street Manager registration:"
echo "   $BASE_URL/api/streetmanager/webhook"
