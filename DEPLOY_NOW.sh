#!/bin/bash
echo "🚦 Deploying Alert Deduplication Fix to Render..."

# Add all changes
git add .

# Commit with detailed message
git commit -m "Fix alert duplication: Advanced deduplication, age management, and persistent dismissals

🔧 Key Changes:
- Added backend/utils/alertDeduplication.js with smart hash-based deduplication
- Enhanced dismissal system with content-hash tracking for consistency  
- Added automatic cleanup of expired alerts (4h default, 2h for low severity)
- Persistent dismissal storage across server restarts
- Periodic cleanup of expired dismissals (48h retention)
- Improved location similarity detection

🎯 Fixes:
- Resolves 7 duplicate Westerhope incidents persisting for a week
- Prevents dismissed alerts from reappearing after restart
- Automatic expiration of old alerts
- Much better deduplication accuracy

📊 Technical Details:
- Hash-based alert identification for consistency
- Source preference: manual > tomtom > here > national_highways > mapquest
- Time-based alert expiration with severity consideration
- Dual storage: by alert ID and content hash
- 48-hour dismissal retention with automatic cleanup"

# Push to trigger Render deployment
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo "📡 Render will automatically deploy in ~2 minutes"
echo "🌐 Live at: https://go-barry.onrender.com"
echo "📱 Frontend: https://gobarry.co.uk"
echo ""
echo "🎯 Expected results:"
echo "  ❌ No more duplicate Westerhope incidents"
echo "  ⏰ Alerts expire after 2-8 hours based on severity"
echo "  💾 Dismissed alerts persist across restarts"
echo "  🧹 Automatic cleanup of old dismissals"
