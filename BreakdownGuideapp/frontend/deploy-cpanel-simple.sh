#!/bin/bash
# Simple Deploy Frontend to cPanel (uses password)
# Usage: npm run deploy:simple

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
echo "ℹ️  Enter your cPanel/SSH password when prompted"
echo ""

# cPanel details
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
REMOTE_PATH="public_html/"

# Use rsync with password prompt
rsync -avz --delete \
  --progress \
  --exclude='.DS_Store' \
  --exclude='*.map' \
  dist/ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is now live at: https://breakdowns.gobarry.co.uk"
echo ""
