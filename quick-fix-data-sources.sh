#!/bin/bash
# Quick fix for data source API key issues

echo "🔧 QUICK FIX: Data Source Manager API Key Handling"
echo "================================================="

# Deploy to Render
echo "🚀 Deploying data source fixes to Render..."
git add backend/services/enhancedDataSourceManager.js
git commit -m "Quick fix: Better API key handling for data sources"
git push origin main

echo "✅ Fix deployed!"
echo ""
echo "📋 What was fixed:"
echo "   - HERE API properly disabled when key is missing/invalid"
echo "   - MapQuest API check for missing keys"
echo "   - Better error reporting for source failures"
echo ""
echo "⏱️ Wait 2-3 minutes for deployment, then re-run:"
echo "   node quick-test-data-feeds.js"
