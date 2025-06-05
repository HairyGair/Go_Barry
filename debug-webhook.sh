#!/bin/bash
# Debug Street Manager webhook connectivity

echo "🔍 Debugging Street Manager Webhook Access..."
echo ""

# Check if production webhook is accessible
echo "📡 Testing production webhook accessibility..."
WEBHOOK_URL="https://go-barry.onrender.com/api/streetmanager/webhook"

echo "Testing GET request to webhook..."
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
     -H "User-Agent: DFT-StreetManager-Test" \
     "$WEBHOOK_URL" || echo "❌ Webhook not accessible"

echo ""
echo "📋 Your registered webhook details should be:"
echo "   URL: $WEBHOOK_URL"
echo "   Method: POST"
echo "   Content-Type: application/json"
echo "   User-Agent: Amazon Simple Notification Service Agent"

echo ""
echo "🧪 Testing POST to webhook with sample AWS SNS format..."
curl -s -X POST "$WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -H "User-Agent: Amazon Simple Notification Service Agent" \
     -d '{
       "Type": "SubscriptionConfirmation",
       "Message": "Test from debug script",
       "TopicArn": "arn:aws:sns:eu-west-2:000000000000:test"
     }' && echo ""

echo ""
echo "💡 If webhook is not accessible:"
echo "   1. Make sure your Render app is deployed"
echo "   2. Check if https://go-barry.onrender.com is responding"
echo "   3. Verify webhook endpoint exists"
