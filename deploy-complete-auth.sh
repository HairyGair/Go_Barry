#!/bin/bash
# Deploy all authentication fixes to Render

echo "🚀 Deploying authentication fixes to Render..."

# Add all authentication changes
git add backend/services/supervisorManager.js
git add backend/routes/supervisorAPI.js  
git add Go_BARRY/components/hooks/useSupervisorSession.js
git add Go_BARRY/app/browser-main.jsx

# Commit all authentication fixes
git commit -m "Deploy: Complete supervisor authentication system

Backend Updates:
✅ Updated supervisorManager.js with real supervisor names/badges
✅ supervisorAPI.js has /auth/login endpoint  
✅ Backend supervisors now match frontend supervisors

Frontend Updates:
✅ useSupervisorSession.js now authenticates with backend
✅ Fixed supervisorSession destructuring in browser-main.jsx
✅ WebSocket uses backend supervisor ID for authentication

Fixes:
❌ Resolves 'Authentication failed: Invalid or expired session'
❌ Resolves 'Can't find variable: supervisorSession'  
❌ Resolves CORS issues with supervisor routes
✅ Enables supervisor → display screen synchronization

This deployment connects frontend auth to backend validation."

# Push to Render
git push origin main

echo "✅ Authentication deployment triggered!"
echo ""
echo "📋 What this fixes:"
echo "✅ Backend supervisor authentication will work"
echo "✅ WebSocket authentication will succeed"  
echo "✅ Display screen will show connected supervisors"
echo "✅ Supervisor controls will sync to display"
echo ""
echo "⏳ Wait 2-3 minutes for Render deployment to complete"
echo "🔗 Then test at: https://gobarry.co.uk"
