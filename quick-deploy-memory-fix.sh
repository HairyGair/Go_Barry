#!/bin/bash
# quick-deploy-memory-fix.sh
# Quick deployment of memory optimization fix

echo "🚦 Quick Deploy: Memory Optimization Fix"
echo "======================================="

# 1. Commit the current fixed index.js file
echo "📝 Committing memory optimization fix..."
git add backend/index.js
git commit -m "🔧 Deploy memory optimization fix

- Single GTFS initialization (fixes dual loader memory conflict)
- Built-in route matching function (fixes broken imports)
- Request throttling (prevents memory spikes)
- Garbage collection triggers
- Memory limit optimized for 1.8GB

Fixes:
- Backend crashes from memory exhaustion
- Route matching showing (0 routes) 
- No alerts reaching supervisors/display screens
- System being killed by Render every few minutes"

# 2. Deploy to Render
echo "🚀 Deploying to Render.com..."
git push origin main

echo ""
echo "✅ Quick Deploy Complete!"
echo ""
echo "🎯 This should fix:"
echo "   ✅ Memory crashes (system being killed)"
echo "   ✅ Route matching (0 routes → actual routes)"
echo "   ✅ Alerts reaching supervisor screens"
echo ""
echo "📊 Monitor logs for:"
echo "   '🎯 Route Match: Found X routes near lat, lng'"
echo "   '✨ Enhanced incident: location (X routes)'"
echo "   '♻️ Garbage collection triggered'"
echo ""
echo "⏱️ Deployment will be live in ~2-3 minutes"
echo "🌐 Check: https://go-barry.onrender.com/api/health"