#!/bin/bash
# Deploy supervisor authentication fix

echo "🚀 Deploying supervisor authentication fix..."

# Add all changes
git add .

# Commit the authentication fix
git commit -m "Fix: Connect frontend supervisor authentication to backend

Frontend/Backend Authentication Integration:
- ✅ Frontend now authenticates with backend via /api/supervisor/auth/login
- ✅ Updated backend supervisors to match frontend supervisor list
- ✅ Fixed WebSocket authentication by passing backend supervisor ID
- ✅ Added supervisor mapping (frontend ID → backend ID + badge)
- ✅ Increased WebSocket connection limit to prevent rate limiting

Changes:
- backend/services/supervisorManager.js: Updated supervisor list with real names
- Go_BARRY/components/hooks/useSupervisorSession.js: Added backend authentication
- Go_BARRY/app/browser-main.jsx: Pass backend ID to WebSocket
- backend/services/supervisorSync.js: Increased connection limit to 10

This should fix the 'Authentication failed: Invalid or expired session' error
and enable proper supervisor → display screen synchronization."

# Push to trigger deployment
git push origin main

echo "✅ Authentication fix deployed!"
echo "⏳ Check Render dashboard for deployment status..."
echo "🔗 Test at: https://gobarry.co.uk"
echo ""
echo "Expected results:"
echo "✅ Supervisor login should work"
echo "✅ WebSocket authentication should succeed"  
echo "✅ Display screen should show connected supervisors"
echo "✅ Supervisor controls should sync to display"
