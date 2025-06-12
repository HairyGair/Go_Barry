#!/bin/bash
# quick-deploy-polling.sh
# Quick deployment of the optimized polling system

echo "🚀 Quick Deploy: Optimized Polling System"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Go BARRY App root directory"
    exit 1
fi

echo "📝 Committing optimized polling changes..."
git add .
git commit -m "🔄 Implement optimized polling system

- Add supervisorPollingService.js with 2-second polling intervals
- Add useSupervisorPolling.js React hook for WebSocket replacement  
- Extend supervisorAPI.js with polling endpoints
- Update DisplayScreen.jsx and SupervisorControl.jsx to use polling
- Replace WebSocket communication with reliable HTTP polling"

echo "🚀 Deploying to Render.com..."
git push origin main

echo "✅ Deployment initiated!"
echo "⏳ Backend will redeploy automatically on Render.com"
echo "🔗 Monitor: https://dashboard.render.com"
echo
echo "📋 Test endpoints in 2-3 minutes:"
echo "   • https://go-barry.onrender.com/api/supervisor/sync-status"
echo "   • https://go-barry.onrender.com/api/health"
echo
echo "🧪 Test command: node test-polling-system.js"