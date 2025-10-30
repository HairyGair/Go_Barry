#!/bin/bash
# Deploy Frontend to cPanel - One Command Deployment
# Usage: npm run deploy

set -e  # Exit on error

echo "🚀 Starting deployment to cPanel..."
echo ""

# Step 1: Build frontend
echo "📦 Building frontend..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Step 2: Upload to cPanel
echo "📤 Uploading to cPanel..."
echo ""
echo "ℹ️  You'll need to enter your cPanel password when prompted"
echo ""

# cPanel details (edit these if needed)
CPANEL_USER="gobarryco"  # Your cPanel username
CPANEL_HOST="gobarry.co.uk"  # Your domain
REMOTE_PATH="public_html/"  # Path on cPanel

# Use rsync to upload (preserves file permissions, only uploads changed files)
rsync -avz --delete \
  --progress \
  --exclude='.DS_Store' \
  --exclude='*.map' \
  -e "ssh -i ~/.ssh/gobarry_cpanel" \
  dist/ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is now live at: https://breakdowns.gobarry.co.uk"
echo ""
echo "🔍 Test it by:"
echo "   1. Opening https://breakdowns.gobarry.co.uk"
echo "   2. Press F12 to open console"
echo "   3. Check for API calls to api.breakdowns.gobarry.co.uk"
echo ""
echo "💰 Next step: Suspend Render to save $7/month!"
echo ""
