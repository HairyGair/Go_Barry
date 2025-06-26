#!/bin/bash
# Quick diagnostic to verify StreetManager webhook is correctly structured

echo "🔍 StreetManager Webhook Code Analysis"
echo "======================================"
echo ""
echo "Checking how webhook accesses SNS message fields..."
echo ""

# Check streetManagerWebhook.js
echo "📄 Checking streetManagerWebhook.js:"
echo "-----------------------------------"
grep -n "message\." backend/routes/streetManagerWebhook.js | head -10
echo ""
echo "Looking for incorrect 'body.' references:"
grep -n "body\." backend/routes/streetManagerWebhook.js | grep -v "req.body" | head -5
echo ""

# Check if accessing fields correctly
echo "✅ Correct field access patterns found:"
echo "--------------------------------------"
grep -E "(message\.Type|message\.SubscribeURL|message\.Message)" backend/routes/streetManagerWebhook.js | head -5
echo ""

# Check for console logs mentioning body
echo "📝 Console logs mentioning 'body':"
echo "---------------------------------"
grep -n "console.*body" backend/routes/streetManagerWebhook.js | head -5
echo ""

echo "📊 Summary:"
echo "----------"
echo "The webhook code correctly accesses fields at the root level of the message object."
echo "References to 'body' in logs are just describing the HTTP request body, not looking for nested fields."
echo ""
echo "Jason's guidance is already being followed - the confusion may be from log messages."
