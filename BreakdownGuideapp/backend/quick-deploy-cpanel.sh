#!/bin/bash

# Quick Deploy & Restart Script for cPanel
# This script uploads the backend and restarts the Node.js app

set -e  # Exit on error

echo "🚀 Go BARRY Backend - Quick Deploy & Restart"
echo "=============================================="
echo ""

# Configuration
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
APP_DIR="gobarry-backend-deploy"
ZIP_FILE="gobarry-backend.zip"

# Step 1: Create deployment package
echo "📦 Step 1: Building deployment package..."
bash create-deployment-zip.sh

if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: $ZIP_FILE not found!"
    exit 1
fi

echo ""
echo "✅ Package created: $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"
echo ""

# Step 2: Upload to cPanel
echo "📤 Step 2: Uploading to cPanel..."
echo "   You may be prompted for your SSH password"
echo ""

# Upload via SCP
scp "$ZIP_FILE" "${CPANEL_USER}@${CPANEL_HOST}:~/"

if [ $? -eq 0 ]; then
    echo "✅ Upload successful"
else
    echo "❌ Upload failed - check SSH credentials"
    exit 1
fi

echo ""

# Step 3: Extract and restart via SSH
echo "📂 Step 3: Extracting and restarting app..."
echo ""

ssh "${CPANEL_USER}@${CPANEL_HOST}" << 'ENDSSH'
#!/bin/bash

# Configuration
ZIP_FILE="gobarry-backend.zip"
APP_DIR="gobarry-backend-deploy"
BACKUP_DIR="gobarry-backend-backup-$(date +%Y%m%d-%H%M%S)"

echo "   → Backing up current deployment..."
if [ -d "$APP_DIR" ]; then
    mv "$APP_DIR" "$BACKUP_DIR"
    echo "   ✓ Backup created: $BACKUP_DIR"
fi

echo "   → Extracting new deployment..."
unzip -q "$ZIP_FILE" -d "$APP_DIR"

if [ $? -eq 0 ]; then
    echo "   ✓ Extraction successful"
    rm "$ZIP_FILE"
    echo "   ✓ Cleanup complete"
else
    echo "   ✗ Extraction failed!"
    exit 1
fi

echo "   → Restarting Node.js application..."

# Try multiple restart methods
RESTART_SUCCESS=false

# Method 1: CloudLinux selector
if command -v cloudlinux-selector &> /dev/null; then
    cloudlinux-selector restart-webapp --interpreter nodejs --app-root "$APP_DIR" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "   ✓ App restarted via CloudLinux"
        RESTART_SUCCESS=true
    fi
fi

# Method 2: Passenger restart
if [ "$RESTART_SUCCESS" = false ]; then
    cd "$APP_DIR"
    mkdir -p tmp
    touch tmp/restart.txt
    echo "   ✓ App restart triggered via Passenger"
    RESTART_SUCCESS=true
fi

# Method 3: Kill node process (last resort)
if [ "$RESTART_SUCCESS" = false ]; then
    pkill -f "$APP_DIR" || true
    echo "   ✓ Node process killed (cPanel will auto-restart)"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test: https://api.breakdowns.gobarry.co.uk/api/health"
echo "2. Check logs if needed: tail -f ~/logs/*.log"
echo ""

ENDSSH

echo ""
echo "=============================================="
echo "✅ Deployment and restart completed!"
echo ""
echo "🧪 Testing backend..."
echo ""

# Wait a moment for app to start
sleep 3

# Test the health endpoint
HEALTH_CHECK=$(curl -s https://api.breakdowns.gobarry.co.uk/api/health | grep -o '"status":"healthy"' || echo "failed")

if [ "$HEALTH_CHECK" = '"status":"healthy"' ]; then
    echo "✅ Backend is healthy!"
    echo ""
    echo "🌐 URLs:"
    echo "   API: https://api.breakdowns.gobarry.co.uk"
    echo "   Health: https://api.breakdowns.gobarry.co.uk/api/health"
    echo ""
else
    echo "⚠️  Backend may not be running properly"
    echo "   Check logs: ssh ${CPANEL_USER}@${CPANEL_HOST} 'tail ~/logs/*.log'"
    echo ""
fi

echo "✨ Done!"
