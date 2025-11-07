#!/bin/bash

# Production Deployment Script
# Deploys engineering display system to production

set -e  # Exit on error

echo "🚀 Starting Production Deployment"
echo "=================================="

# Configuration
PRODUCTION_HOST="85.234.151.224"
PRODUCTION_USER="anthony"
BACKEND_DIR="~/api"
FRONTEND_DIR="~/public_html/breakdowns.gobarry.co.uk"

echo ""
echo "📦 Step 1: Deploying Backend Files"
echo "-----------------------------------"

# Upload displays.js (new file)
echo "Uploading displays.js..."
scp "backend/routes/displays.js" "${PRODUCTION_USER}@${PRODUCTION_HOST}:${BACKEND_DIR}/routes/"

# Upload updated webSocketHandler.js
echo "Uploading webSocketHandler.js..."
scp "backend/routes/webSocketHandler.js" "${PRODUCTION_USER}@${PRODUCTION_HOST}:${BACKEND_DIR}/routes/"

# Upload updated server.js (if it was modified)
echo "Uploading server.js..."
scp "backend/server.js" "${PRODUCTION_USER}@${PRODUCTION_HOST}:${BACKEND_DIR}/"

echo "✅ Backend files uploaded"

echo ""
echo "🔄 Step 2: Restarting PM2"
echo "-------------------------"
ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" << 'SSH_COMMANDS'
cd ~/api
pm2 restart breakdown-backend
sleep 2
pm2 logs breakdown-backend --lines 20
SSH_COMMANDS

echo "✅ Backend restarted"

echo ""
echo "🌐 Step 3: Testing Backend API"
echo "-------------------------------"
echo "Testing health endpoint..."
curl -s https://api.breakdowns.gobarry.co.uk/api/health | python3 -m json.tool

echo ""
echo "📱 Step 4: Building Frontend"
echo "-----------------------------"
cd frontend
npm run build

echo "✅ Frontend built"

echo ""
echo "📤 Step 5: Deploying Frontend"
echo "------------------------------"
echo "Clearing remote frontend directory..."
ssh "${PRODUCTION_USER}@${PRODUCTION_HOST}" "rm -rf ${FRONTEND_DIR}/*"

echo "Uploading frontend files..."
scp -r dist/* "${PRODUCTION_USER}@${PRODUCTION_HOST}:${FRONTEND_DIR}/"

echo "✅ Frontend deployed"

echo ""
echo "✨ Deployment Complete!"
echo "======================="
echo ""
echo "🔗 URLs:"
echo "  Frontend: https://breakdowns.gobarry.co.uk"
echo "  Engineering Display: https://breakdowns.gobarry.co.uk/dashboards/engineering/display?displayId=yard-1&depot=SDC"
echo "  Backend API: https://api.breakdowns.gobarry.co.uk/api/health"
echo ""
echo "📋 Next Steps:"
echo "  1. Test the engineering display in production"
echo "  2. Test the display control panel from SDC dashboard"
echo "  3. Set up physical displays in depot yards"
echo ""

