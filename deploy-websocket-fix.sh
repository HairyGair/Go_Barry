#!/bin/bash
# Quick deploy to fix WebSocket connection limits

echo "🚀 Deploying WebSocket connection limit fix..."

# Add the changes
git add backend/services/supervisorSync.js

# Commit the fix
git commit -m "Fix: Increase WebSocket connection limit from 2 to 10 per IP

- Resolves supervisor → display WebSocket connection issues
- Allows multiple supervisor interfaces + display screens from same IP
- Connection limit was too restrictive for testing/development"

# Push to trigger Render deployment
git push origin main

echo "✅ Deployment triggered!"
echo "⏳ Check Render dashboard for deployment progress..."
echo "🔗 Your service: https://dashboard.render.com"
