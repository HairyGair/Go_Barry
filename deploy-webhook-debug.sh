#!/bin/bash

echo "Deploying Street Manager webhook with debugging..."
echo "================================================"

# Commit the debugging changes
echo -e "\n1. Committing debugging changes..."
git add backend/index.js
git commit -m "Debug: Add logging for Street Manager webhook import"

# Push to deploy
echo -e "\n2. Pushing to deploy..."
git push

echo -e "\n3. Done! Wait 2-3 minutes for Render to deploy"
echo -e "\n4. Check the Render logs for:"
echo "   - '✅ streetManagerWebhooks service imported'"
echo "   - '✅ streetManagerWebhookRouter imported'"
echo "   - '📨 Registering Street Manager webhook routes'"
echo -e "\n5. If you see import errors, we'll know what to fix"
echo -e "\n6. Then test the webhook:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
