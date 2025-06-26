#!/bin/bash
# Deploy StreetManager webhook fix

echo "🚀 Deploying StreetManager Webhook Fix"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/render-startup.js" ]; then
  echo "❌ Error: Must run from Go BARRY App root directory"
  exit 1
fi

echo "📦 Files to update:"
echo "  - backend/render-startup.js (skip JSON parsing for webhook)"
echo "  - backend/routes/streetManagerWebhook.js (handle raw body manually)"
echo ""

# Backup current files
echo "💾 Creating backups..."
cp backend/render-startup.js backend/render-startup.js.backup
cp backend/routes/streetManagerWebhook.js backend/routes/streetManagerWebhook.js.backup
echo "✅ Backups created"
echo ""

# Test the fix locally first
echo "🧪 Testing fix locally..."
cd backend
npm start &
SERVER_PID=$!
sleep 5

# Run test
cd ..
node test-webhook-fix.js
TEST_RESULT=$?

# Stop test server
kill $SERVER_PID 2>/dev/null

if [ $TEST_RESULT -eq 0 ]; then
  echo ""
  echo "✅ Local test passed!"
else
  echo ""
  echo "❌ Local test failed - aborting deployment"
  exit 1
fi

echo ""
echo "📤 Ready to deploy to production"
echo ""
echo "Next steps:"
echo "1. Commit the changes:"
echo "   git add backend/render-startup.js backend/routes/streetManagerWebhook.js"
echo "   git commit -m 'Fix StreetManager webhook to properly handle SNS messages'"
echo ""
echo "2. Push to deploy:"
echo "   git push origin main"
echo ""
echo "3. Monitor Render.com logs to ensure webhook works in production"
echo ""
echo "4. Reply to Jason that the issue is fixed and the webhook now correctly"
echo "   handles SNS messages with fields at root level (Type, SubscribeURL, etc)"
