#!/bin/bash

# GTFS Backend Deployment Script
# Deploys GTFS routes to production server
# Usage: ./GTFS_DEPLOY_TO_PRODUCTION.sh

set -e

echo "🚀 GTFS Backend Deployment Script"
echo "=================================="

# Configuration
SERVER="85.234.151.224"
USER="gobarryco"
REMOTE_DIR="/home/gobarryco/api"
LOCAL_BACKEND="/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"

echo ""
echo "📍 Configuration:"
echo "   Server: $SERVER"
echo "   User: $USER"
echo "   Remote Directory: $REMOTE_DIR"
echo ""

# Step 1: Verify local files exist
echo "✓ Step 1: Verifying local files..."
if [ ! -f "$LOCAL_BACKEND/routes/adminGTFS.js" ]; then
    echo "❌ ERROR: adminGTFS.js not found at $LOCAL_BACKEND/routes/adminGTFS.js"
    exit 1
fi

if [ ! -f "$LOCAL_BACKEND/server.js" ]; then
    echo "❌ ERROR: server.js not found at $LOCAL_BACKEND/server.js"
    exit 1
fi

echo "   ✅ adminGTFS.js found"
echo "   ✅ server.js found"
echo ""

# Step 2: Connect to server and deploy
echo "✓ Step 2: Connecting to server and deploying files..."
echo ""

# Upload adminGTFS.js
echo "   📤 Uploading adminGTFS.js..."
scp "$LOCAL_BACKEND/routes/adminGTFS.js" "$USER@$SERVER:$REMOTE_DIR/routes/" 2>/dev/null || {
    echo "   ❌ Failed to upload adminGTFS.js"
    echo "   💡 Make sure you have SSH access and the remote directory exists"
    exit 1
}

# Upload server.js
echo "   📤 Uploading server.js..."
scp "$LOCAL_BACKEND/server.js" "$USER@$SERVER:$REMOTE_DIR/" 2>/dev/null || {
    echo "   ❌ Failed to upload server.js"
    exit 1
}

echo "   ✅ Files uploaded successfully"
echo ""

# Step 3: Restart PM2
echo "✓ Step 3: Restarting backend on production..."
ssh "$USER@$SERVER" << 'REMOTE_COMMANDS'
    cd /home/gobarryco/api
    
    # Restart PM2
    pm2 restart breakdown-backend 2>/dev/null || {
        echo "   ℹ️  PM2 restart may take a moment..."
        sleep 2
        pm2 restart breakdown-backend
    }
    
    # Wait for restart
    sleep 3
    
    # Check status
    echo "   ✅ Backend restarted"
    pm2 status | grep breakdown-backend
REMOTE_COMMANDS

echo ""

# Step 4: Verify deployment
echo "✓ Step 4: Verifying deployment..."
sleep 2

RESULT=$(curl -s https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats 2>&1)

if echo "$RESULT" | grep -q '"success":true'; then
    echo "   ✅ GTFS endpoint is responding!"
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📊 Current GTFS Statistics:"
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    echo ""
else
    if echo "$RESULT" | grep -q "Route not found"; then
        echo "   ⚠️  Endpoint still returning 404"
        echo "   💡 This may mean:"
        echo "      - Backend hasn't fully restarted yet (wait 30 seconds and try again)"
        echo "      - Files weren't uploaded correctly"
        echo "      - server.js wasn't updated"
        echo ""
        echo "Response: $RESULT"
    else
        echo "   ✅ Backend is responding (but check manually)"
        echo "Response: $RESULT"
    fi
fi

echo ""
echo "🔍 Manual verification:"
echo "   curl https://api.breakdowns.gobarry.co.uk/api/admin/gtfs/stats"
echo ""

