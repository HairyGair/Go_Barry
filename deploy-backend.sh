#!/bin/bash
# Deploy backend to Render

echo "🚀 Deploying Go BARRY Backend to Render..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Not in the Go BARRY App directory"
    echo "Please run from the root project directory"
    exit 1
fi

# Check git status
echo -e "\n📋 Git Status:"
git status --short

# Add all changes
echo -e "\n📦 Adding all changes..."
git add .

# Create commit
echo -e "\n💾 Creating commit..."
git commit -m "Add activity logging fixes and duty management

- Fixed supervisorActivityLogger to use correct activity_logs table
- Added duty management API (/api/duty/*)
- Updated duty numbers to match specification
- Fixed DisplayScreen to parse string details from database
- Added logging for debugging
- Fixed email activity logging"

# Push to main branch
echo -e "\n🔄 Pushing to GitHub..."
git push origin main

echo -e "\n✅ Deployment initiated!"
echo "📊 Monitor deployment at: https://dashboard.render.com"
echo ""
echo "⏱️ Deployment usually takes 3-5 minutes"
echo "🔍 Once complete, run: ./check-deployment-status.sh"
