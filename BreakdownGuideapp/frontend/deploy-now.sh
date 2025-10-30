#!/bin/bash
# Deploy Frontend to cPanel - breakdowns subdomain
set -e

echo "🚀 Deploying to breakdowns.gobarry.co.uk..."
echo ""

# cPanel details
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
REMOTE_PATH="public_html/breakdowns/"  # Subdomain directory

echo "📤 Uploading dist/ to ${REMOTE_PATH}..."
echo ""

# Use rsync to upload
rsync -avz --delete \
  --progress \
  --exclude='.DS_Store' \
  --exclude='*.map' \
  dist/ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Live at: https://breakdowns.gobarry.co.uk"
