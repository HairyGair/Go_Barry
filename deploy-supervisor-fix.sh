#!/bin/bash
# Deploy supervisor tracking fix to Render

echo "🚀 Deploying Supervisor Tracking Fix to Render..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Not in the Go BARRY App directory"
    echo "Please run from the root project directory"
    exit 1
fi

# Check git status
echo -e "\n📋 Git Status:"
git status --short

# Add the supervisor manager changes
echo -e "\n📦 Adding supervisor tracking fix..."
git add backend/services/supervisorManager.js
git add SUPERVISOR_TRACKING_FIX.md

# Show what's being committed
echo -e "\n📝 Changes to be committed:"
git diff --cached --name-only

# Create commit
echo -e "\n💾 Creating commit..."
git commit -m "Fix supervisor tracking for display sync

- Fixed getActiveSupervisors() to prioritize memory cache
- Improved session tracking on login
- Added detailed logging for debugging
- Display screen now shows connected supervisors correctly
- Polling-based sync working properly"

# Push to main branch
echo -e "\n🔄 Pushing to GitHub..."
git push origin main

echo -e "\n✅ Deployment initiated!"
echo "📊 Monitor deployment at: https://dashboard.render.com"
echo ""
echo "⏱️ Deployment usually takes 3-5 minutes"
echo ""
echo "🧪 After deployment, test:"
echo "1. Login to browser-main as any supervisor"
echo "2. Check display screen shows '1 SUPERVISORS'"
echo "3. API endpoint: https://go-barry.onrender.com/api/supervisor/sync-status"
