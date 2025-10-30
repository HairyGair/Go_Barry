#!/bin/bash
# Deploy Backend to cPanel - One Command Deployment
# Usage: npm run deploy

set -e  # Exit on error

echo "🚀 Starting backend deployment to cPanel..."
echo ""

# cPanel details
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
REMOTE_PATH="backend/"  # Path where backend is hosted on cPanel

echo "📤 Uploading backend files to cPanel..."
echo ""
echo "ℹ️  Enter your cPanel SSH password when prompted: juvwyh-1nuJdu-gyqrut"
echo ""

# Use rsync to upload (excludes unnecessary files)
# Force password authentication instead of SSH keys
rsync -avz --delete \
  --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='*.zip' \
  --exclude='.env' \
  --exclude='*.md' \
  -e "ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no" \
  ./ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}"

echo ""
echo "📦 Installing dependencies on cPanel..."
echo ""

# Install dependencies and restart on cPanel
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no "${CPANEL_USER}@${CPANEL_HOST}" << 'ENDSSH'
cd ~/backend
echo "Running npm install..."
npm install --production
echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🔄 Restarting Node.js application..."
# Try to restart via cPanel Node.js app manager
# Note: Actual restart method depends on how you set up the app
# You might need to use PM2 or the cPanel interface
echo "⚠️  Please restart the app in cPanel Setup Node.js App"
ENDSSH

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to cPanel > Setup Node.js App"
echo "   2. Click 'Restart App' for your backend"
echo "   3. Test: https://api.breakdowns.gobarry.co.uk/health"
echo ""
echo "🔍 Verify endpoints:"
echo "   - Health: https://api.breakdowns.gobarry.co.uk/health"
echo "   - Supervisors: https://api.breakdowns.gobarry.co.uk/api/supervisors"
echo ""
