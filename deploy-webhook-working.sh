#!/bin/bash

echo "Deploying Street Manager webhook FIX..."
echo "======================================"

# Commit the fix
echo -e "\n1. Committing the fix..."
git add backend/index.js backend/services/streetManagerEvents.js backend/render-startup.js
git commit -m "Fix: Move Street Manager webhook routes before catch-all to ensure they work"

# Push to deploy
echo -e "\n2. Pushing to deploy..."
git push

echo -e "\n3. Done! Wait 2-3 minutes for Render to deploy"
echo -e "\n4. Key fix applied:"
echo "   - Moved webhook routes BEFORE the catch-all route"
echo "   - Routes are now inline to avoid import issues"
echo "   - Should now respond properly to all webhook endpoints"
echo -e "\n5. Test the webhook endpoints:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
echo "   curl -X POST https://go-barry.onrender.com/api/streetmanager/webhook/test -H 'Content-Type: application/json' -d '{}'"
echo -e "\n6. The webhook URL for Street Manager registration is:"
echo "   https://go-barry.onrender.com/api/streetmanager/webhook"
