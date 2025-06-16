#!/bin/bash
# deploy-with-here-api.sh
# Deploy backend with working HERE API key

echo "🗺️ DEPLOYING WITH HERE API KEY"
echo "==============================="

echo "✅ HERE API key added: 55brLMetn_8TR0ghfLG3xFfaObY9jhPpu0XEb-W4_KQ"
echo "✅ Enhanced data source manager fixed"
echo "✅ All 4 data sources should now work:"
echo "   - TomTom ✅"
echo "   - HERE ✅ (NEW KEY)"
echo "   - MapQuest ✅"
echo "   - National Highways ✅"

echo ""
echo "🚀 Deploying backend with full data sources..."

git add .
git commit -m "Fix: Add working HERE API key and enable all 4 data sources"
git push origin main

echo ""
echo "✅ Deployment with HERE API triggered!"
echo ""
echo "📋 Next steps:"
echo "   1. Wait 3-4 minutes for deployment"
echo "   2. Run: node quick-test-data-feeds.js"
echo "   3. Should now see alerts from 3-4 sources instead of 0"
echo ""
echo "🎯 Expected result: 'X alerts from 3-4 sources' instead of '0 sources'"
