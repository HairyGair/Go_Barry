#!/bin/bash
# emergency-redeploy.sh
# Force redeploy the backend to fix crashed deployment

echo "🚨 EMERGENCY REDEPLOY: Backend appears to be DOWN"
echo "================================================"

echo "🔍 Current status:"
echo "   - Render shows 'No open HTTP ports detected'"
echo "   - This means the backend crashed or failed to start"
echo "   - We need to force a redeploy"

echo ""
echo "🚀 Force redeploying backend..."

# Add a timestamp to force new deployment
echo "// Deployment timestamp: $(date)" >> backend/index.js

git add .
git commit -m "EMERGENCY: Force redeploy backend - was down"
git push origin main

echo ""
echo "✅ Redeploy triggered!"
echo ""
echo "📋 Next steps:"
echo "   1. Wait 3-4 minutes for deployment to complete"
echo "   2. Check https://dashboard.render.com for deployment status"
echo "   3. Once deployed, run: node quick-test-data-feeds.js"
echo ""
echo "🔗 Monitor deployment at: https://dashboard.render.com"
echo "🔗 Check logs at: https://dashboard.render.com > go-barry > Logs"
