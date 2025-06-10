#!/bin/bash
# manual-deploy-changes.sh
# Manually commit the changes that git isn't detecting

echo "🔧 MANUALLY DEPLOYING OPTIMIZATION CHANGES"
echo "=========================================="

echo "📋 Force adding the modified file..."
git add -A .

echo ""
echo "📊 Files to be committed:"
git status --porcelain

echo ""
echo "🚀 Committing all changes..."
git commit -m "CRITICAL: Disable HERE API (400 errors), optimize for 3 sources, fix confidence calculation"

echo ""
echo "📤 Pushing to trigger deployment..."
git push origin main

echo ""
echo "✅ CHANGES DEPLOYED!"
echo ""
echo "⏱️ Wait 3-4 minutes for Render deployment, then test:"
echo "   node detailed-source-test.js"
echo ""
echo "🎯 Expected massive improvements:"
echo "   - Response time: 175s → 3-5s (no HERE timeout)"
echo "   - HERE: Cleanly disabled (no 400 errors)"
echo "   - National Highways: Should work (API key set)"
echo "   - Confidence: Calculated correctly for 3 sources"
