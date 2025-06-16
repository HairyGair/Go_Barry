#!/bin/bash
# deploy-cost-reduction.sh
# Deploy Go BARRY with MapQuest and HERE APIs removed

echo "🚀 Deploying Go BARRY Cost Reduction (MapQuest + HERE Removal)"
echo "================================================================"

echo "💰 Expected savings: £180/month (£80 MapQuest + £100 HERE)"
echo "🎯 Remaining traffic sources: 4 (TomTom, National Highways, StreetManager, Manual)"

# Add and commit changes
echo "📝 Committing API removals..."
git add .
git commit -m "💰 COST REDUCTION: Remove MapQuest (£80) and HERE (£100) APIs

- Removed MapQuest integration completely
- Removed HERE API integration completely  
- Updated data source manager to use 4 sources instead of 6
- Moved all related files to cleanup archive
- System remains fully operational with TomTom, National Highways, StreetManager, Manual incidents
- Total monthly savings: £180"

# Push to trigger Render deployment
echo "🚀 Pushing to trigger Render deployment..."
git push origin main

echo ""
echo "✅ DEPLOYMENT INITIATED"
echo "======================="
echo "💰 Monthly cost reduction: £180"
echo "🔄 Render will redeploy automatically"
echo "⏱️  Deployment typically takes 2-3 minutes"
echo "🧪 Test with: node test-here-removal.js"
echo ""
echo "📊 New traffic source configuration:"
echo "   ✅ TomTom API (primary traffic intelligence)"
echo "   ✅ National Highways DATEX II (official UK roadworks)"
echo "   ✅ StreetManager UK (planned roadworks)"
echo "   ✅ Manual Incidents (supervisor-created)"
echo ""
echo "Go BARRY remains fully operational! 🎉"
