#!/bin/bash
# Make executable: chmod +x deploy-alert-deduplication-fix.sh

# deploy-alert-deduplication-fix.sh
# Deploy the comprehensive alert deduplication and age management fix

echo "🚦 Deploying Alert Deduplication Fix..."

# Commit changes
git add .
git commit -m "Fix alert duplication: Add advanced deduplication, age management, and persistent dismissals

- Added backend/utils/alertDeduplication.js with smart hash-based deduplication
- Enhanced dismissal system with content-hash tracking for consistency  
- Added automatic cleanup of expired alerts (4h default, 2h for low severity)
- Persistent dismissal storage across server restarts
- Periodic cleanup of expired dismissals (48h retention)
- Improved location similarity detection
- Fixed issue with 7 duplicate Westerhope incidents persisting for a week

This should resolve the duplicate alert issue reported by the user."

# Deploy to Render
echo "📡 Pushing to Render deployment..."
git push origin main

echo "✅ Alert deduplication fix deployed!"
echo ""
echo "🔧 Changes made:"
echo "   ✅ Advanced hash-based alert deduplication"
echo "   ✅ Time-based alert expiration (4h general, 2h low severity)"
echo "   ✅ Persistent dismissal storage with cleanup"
echo "   ✅ Content-hash tracking for consistent dismissals"
echo "   ✅ Automatic cleanup of expired dismissals"
echo ""
echo "📊 This should fix:"
echo "   🎯 Duplicate alerts from same incident"
echo "   ⏰ Old alerts persisting for weeks"
echo "   🔄 Dismissed alerts reappearing after restart"
echo "   📍 Location-based duplication issues"
echo ""
echo "⏳ Deployment will be live in ~2 minutes on:"
echo "   🌐 https://go-barry.onrender.com"
echo "   📱 https://gobarry.co.uk"
