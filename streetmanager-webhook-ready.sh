#!/bin/bash
# StreetManager Webhook Deployment & Testing Guide
# Based on Official Documentation: https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/

echo "🚀 StreetManager Webhook Configuration Complete!"
echo "================================================"
echo ""
echo "📍 WEBHOOK ENDPOINT:"
echo "   https://go-barry.onrender.com/api/streetmanager/webhook"
echo ""
echo "✅ IMPLEMENTATION DETAILS:"
echo "   - Uses bodyParser.text() as per official docs"
echo "   - Parses body with JSON.parse(req.body)"
echo "   - Checks x-amz-sns-message-type header"
echo "   - Validates SNS signatures"
echo "   - Auto-confirms subscriptions"
echo "   - Saves to Supabase streetmanager_notifications table"
echo ""
echo "🔧 KEY CHANGES MADE:"
echo "   1. Created /backend/routes/streetManagerWebhook.js"
echo "   2. Added bodyParser.text() middleware in index.js"
echo "   3. Exact implementation from official example"
echo ""
echo "📋 TESTING ENDPOINTS:"
echo "   GET  /api/streetmanager/webhook/test"
echo "   POST /api/streetmanager/webhook (main webhook)"
echo "   GET  /api/streetmanager/notifications (view saved data)"
echo ""
echo "🧪 LOCAL TESTING:"
echo "   curl http://localhost:3001/api/streetmanager/webhook/test"
echo ""
echo "📨 SUBSCRIPTION CONFIRMATION:"
echo "   When StreetManager sends SubscriptionConfirmation:"
echo "   - Webhook will log the SubscribeURL"
echo "   - Automatically calls the URL to confirm"
echo "   - You'll see: '✅ Subscription confirmed'"
echo ""
echo "📦 EXPECTED SNS MESSAGE FORMAT:"
echo "   {
     'Type': 'SubscriptionConfirmation',
     'MessageId': 'GUID',
     'Token': 'TOKEN',
     'TopicArn': 'arn:aws:sns:eu-west-2:...',
     'Message': 'You have chosen to subscribe...',
     'SubscribeURL': 'https://sns.eu-west-2.amazonaws.com/...',
     'Timestamp': '2020-06-04T10:05:15.215Z',
     'SignatureVersion': '1',
     'Signature': 'MESSAGE SIGNATURE',
     'SigningCertURL': 'https://sns.eu-west-2.amazonaws.com/...'
   }"
echo ""
echo "⚠️ IMPORTANT FOR STREETMANAGER:"
echo "   1. Provide this exact URL (no trailing slash)"
echo "   2. Webhook expects text/plain body with JSON content"
echo "   3. Must have x-amz-sns-message-type header"
echo "   4. Signature validation is implemented"
echo ""
echo "🚀 DEPLOY TO RENDER:"
echo "   git add -A"
echo "   git commit -m 'StreetManager webhook implementation per official docs'"
echo "   git push origin main"
echo ""
echo "✅ READY FOR STREETMANAGER WEBHOOK REGISTRATION!"
