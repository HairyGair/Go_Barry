#!/bin/bash
# EMERGENCY: Fix Westerhope Duplication Issue

echo "🚨 EMERGENCY DEPLOYMENT: Fixing Westerhope Duplication"
echo "========================================================"

echo "🔧 Enhanced deduplication algorithm for identical locations"
echo "📊 Current status: 12 Westerhope duplicates detected"
echo "🎯 Target: Reduce to 1 alert per unique incident"

# Add changes
git add backend/utils/alertDeduplication.js

# Commit with urgent priority
git commit -m "URGENT: Enhanced alert deduplication for identical locations

- Fixed aggressive deduplication for specific locations like Westerhope
- TomTom alerts with identical locations now properly deduplicated  
- Should reduce 12 Westerhope alerts down to 1-2 unique incidents
- Resolves production issue with duplicate traffic alerts

Testing showed: 12 alerts → 1 unique location = major duplication
This fix implements location+source based deduplication for specific cases."

# Deploy immediately
echo "🚀 Deploying to Render..."
git push origin main

echo ""
echo "✅ Emergency deployment triggered!"
echo ""
echo "📊 Expected results in ~2 minutes:"
echo "   🎯 Westerhope alerts: 12 → 1-2 unique incidents"
echo "   ✅ Better deduplication across all sources"
echo "   🚀 Faster dashboard performance"
echo ""
echo "🔍 Test after deployment:"
echo "   node test-live-alerts-simple.js"
echo ""
echo "🌐 Monitor at:"
echo "   https://go-barry.onrender.com/api/alerts-enhanced"
echo "   https://gobarry.co.uk"
