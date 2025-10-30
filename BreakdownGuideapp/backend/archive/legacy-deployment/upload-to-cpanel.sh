#!/bin/bash

# Upload Script for Passenger Deployment
# Uploads modified app.js and server.js to cPanel

echo "🚀 Uploading Backend Files to cPanel..."
echo ""

# Configuration
SERVER="gobarryco@yourdomain.com"  # Replace with your actual domain
REMOTE_DIR="/home/gobarryco/api"
LOCAL_DIR="/Users/anthony/Go BARRY App/BreakdownGuideapp/backend"

# Upload app.js
echo "📦 Uploading app.js..."
scp "$LOCAL_DIR/app.js" "$SERVER:$REMOTE_DIR/"

# Upload server.js
echo "📦 Uploading server.js..."
scp "$LOCAL_DIR/server.js" "$SERVER:$REMOTE_DIR/"

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "Next steps:"
echo "1. SSH into server: ssh $SERVER"
echo "2. Restart Passenger: touch /home/gobarryco/api/tmp/restart.txt"
echo "3. Test: curl https://api.breakdowns.gobarry.co.uk/health"

