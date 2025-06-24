#!/bin/bash

echo "Fixing Street Manager webhook routing issue..."
echo "============================================="

# Commit the fix
echo -e "\n1. Committing the routing fix..."
git add backend/render-startup.js
git commit -m "Fix: Remove catch-all route blocking Street Manager webhooks"

# Push to deploy
echo -e "\n2. Pushing to deploy..."
git push

echo -e "\n3. Done! Wait 2-3 minutes for Render to deploy"
echo -e "\n4. Then test the webhook endpoints:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
echo "   curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test -H 'Content-Type: application/json' -d '{}'"
echo -e "\n5. The status endpoint should now show webhook configuration"
echo "   instead of the generic health response"
