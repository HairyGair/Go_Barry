#!/bin/bash
# force-deploy-optimization.sh
# Actually commit and deploy the HERE API disabling changes

echo "🔧 FORCE DEPLOYING OPTIMIZATION CHANGES"
echo "======================================="

echo "📋 Current git status:"
git status

echo ""
echo "📝 Adding the modified enhancedDataSourceManager.js..."
git add backend/services/enhancedDataSourceManager.js

echo ""
echo "📊 Changes being committed:"
git diff --cached backend/services/enhancedDataSourceManager.js | head -20

echo ""
echo "🚀 Committing changes..."
git commit -m "OPTIMIZE: Disable HERE API (400 errors), optimize for 3 sources - TomTom + MapQuest + National Highways"

echo ""
echo "📤 Pushing to trigger Render deployment..."
git push origin main

echo ""
echo "✅ OPTIMIZATION DEPLOYED!"
echo ""
echo "⏱️ Wait 2-3 minutes for deployment, then test:"
echo "   node detailed-source-test.js"
echo ""
echo "🎯 Expected improvements:"
echo "   - Response time: 175s → <5s (no HERE delays)" 
echo "   - HERE: Clean disable (no more 400 errors)"
echo "   - National Highways: Should work (API key already set)"
echo "   - Total: 3/3 sources working"
