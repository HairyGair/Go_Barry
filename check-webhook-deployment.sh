#!/bin/bash

echo "Checking webhook file status and deployment..."
echo "============================================="

# Check git status
echo -e "\n1. Git status of webhook files:"
git status backend/routes/streetManagerWebhook.js backend/services/streetManagerEvents.js

# Check if files are committed
echo -e "\n2. Checking if files are in the last commit:"
git log -1 --name-only | grep -E "(streetManagerWebhook|streetManagerEvents)"

# Check current branch
echo -e "\n3. Current branch:"
git branch --show-current

# Instructions
echo -e "\n4. If files are not committed, run:"
echo "   git add backend/routes/streetManagerWebhook.js backend/services/streetManagerEvents.js"
echo "   git commit -m 'Add Street Manager webhook integration for real-time roadwork updates'"
echo "   git push"

echo -e "\n5. After pushing, wait 2-3 minutes for Render to deploy"

echo -e "\n6. Test deployment with:"
echo "   curl https://go-barry.onrender.com/api/streetmanager/webhook/status"
