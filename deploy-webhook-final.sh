#!/bin/bash

echo "Deploying Street Manager webhook with fixes..."
echo "============================================="

# Commit all the changes
echo -e "\n1. Committing all fixes..."
git add backend/index.js backend/services/streetManagerEvents.js backend/render-startup.js
git commit -m "Fix: Street Manager webhook integration - remove catch-all route, fix Convex sync, add debugging"

# Push to deploy
echo -e "\n2. Pushing to deploy..."
git push

echo -e "\n3. Done! Wait 2-3 minutes for Render to deploy"
echo -e "\n4. Watch the logs for:"
echo "   - '✅ streetManagerWebhooks service imported'"
echo "   - '✅ streetManagerWebhookRouter imported'"
echo "   - '📨 Registering Street Manager webhook routes'"
echo "   - '✅ Street Manager webhook routes registered'"
echo -e "\n5. Then test the webhook endpoints:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
echo "   curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test -H 'Content-Type: application/json' -d '{}'"
