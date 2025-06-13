#!/bin/bash

echo "🚨 EMERGENCY: Deploying supervisor management fixes for 13 duplicate sessions"

# Add all changes
git add .

# Commit with urgent message
git commit -m "URGENT: Deploy supervisor auto-timeout + admin cleanup tools

Current situation: 13 active supervisors (8x Anthony Gair, 2x Claire Fiddler, 2x Barry Perryman)
Need immediate deployment to activate:
- 10-minute auto-timeout for inactive sessions
- Admin 'logout all' button for emergency cleanup
- Add/delete supervisor functions for Anthony Gair and Barry Perryman

Backend changes: supervisorManager.js + supervisorAPI.js
Frontend compatible: no changes needed"

# Push to trigger Render deployment
git push origin main

echo "✅ Deployment triggered! (~2 minutes to activate)"
echo ""
echo "🧹 AFTER DEPLOYMENT COMPLETES:"
echo "1. Login as Anthony Gair or Barry Perryman"
echo "2. Use admin 'logout all' endpoint: POST /api/supervisor/admin/logout-all"
echo "3. Monitor: https://go-barry.onrender.com/api/supervisor/debug/sessions"
echo ""
echo "⏰ Auto-timeout will prevent future duplicates (10min inactivity)"
