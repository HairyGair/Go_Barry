#!/bin/bash
# Deploy Backend to cPanel using SSH Key
# Usage: npm run deploy:key

set -e  # Exit on error

echo "🚀 Starting backend deployment to cPanel..."
echo ""

# cPanel details
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
REMOTE_PATH="backend/"
SSH_KEY="$HOME/.ssh/gobarry_cpanel"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at: $SSH_KEY"
    echo ""
    echo "Please download the private key from cPanel:"
    echo "1. Go to cPanel > SSH Access"
    echo "2. Click 'View/Download' on Go_Barry_Backend key"
    echo "3. Save to: $SSH_KEY"
    echo "4. Run: chmod 600 $SSH_KEY"
    exit 1
fi

echo "📤 Uploading backend files to cPanel..."
echo ""

# Use rsync with SSH key
rsync -avz --delete \
  --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='*.zip' \
  --exclude='.env' \
  --exclude='*.md' \
  -e "ssh -i $SSH_KEY" \
  ./ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}"

echo ""
echo "📦 Installing dependencies on cPanel..."
echo ""

# Install dependencies on cPanel
ssh -i "$SSH_KEY" "${CPANEL_USER}@${CPANEL_HOST}" << 'ENDSSH'
cd ~/backend
echo "Running npm install..."
npm install --production
echo ""
echo "✅ Dependencies installed!"
ENDSSH

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to cPanel > Setup Node.js App"
echo "   2. Click 'Restart App' for your backend"
echo "   3. Test: https://api.breakdowns.gobarry.co.uk/health"
echo ""
