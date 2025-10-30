#!/bin/bash

###############################################################################
# Complete cPanel Backend Deployment Script
# This script automates the entire deployment process
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# cPanel Configuration
CPANEL_USER="gobarryco"
CPANEL_HOST="gobarry.co.uk"
CPANEL_PASSWORD="juvwyh-1nuJdu-gyqrut"
REMOTE_PATH="backend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Go BARRY Backend - cPanel Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks...${NC}"
echo ""

if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found. Are you in the backend directory?${NC}"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend files verified${NC}"
echo ""

# Step 2: Upload files to cPanel
echo -e "${YELLOW}Step 2: Uploading files to cPanel...${NC}"
echo ""
echo -e "${BLUE}ℹ️  Password: ${CPANEL_PASSWORD}${NC}"
echo ""

rsync -avz --delete \
  --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='*.zip' \
  --exclude='.env' \
  --exclude='*.md' \
  --exclude='*.sh' \
  --include='.htaccess' \
  --include='.env.production' \
  --include='app.js' \
  --include='passenger_wsgi.py' \
  -e "ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no" \
  ./ \
  "${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Files uploaded successfully${NC}"
echo ""

# Step 3: Configure and install on cPanel
echo -e "${YELLOW}Step 3: Configuring backend on cPanel...${NC}"
echo ""

ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no "${CPANEL_USER}@${CPANEL_HOST}" << 'ENDSSH'
set -e

cd ~/backend

echo "📋 Current directory: $(pwd)"
echo ""

# Create .env from production template
echo "📝 Creating production .env file..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✓ .env file created from .env.production"
else
    echo "⚠️  Warning: .env.production not found, using existing .env"
fi
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
echo "   Using Node.js: $(/opt/cpanel/ea-nodejs20/bin/node -v)"
echo ""

/opt/cpanel/ea-nodejs20/bin/npm install --production

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Dependency installation failed"
    exit 1
fi
echo ""

# Create tmp directory for Passenger
echo "📁 Setting up Passenger restart capability..."
mkdir -p tmp
echo "✓ tmp directory created"
echo ""

# Verify critical files
echo "🔍 Verifying deployment..."
echo "   server.js: $([ -f server.js ] && echo '✓' || echo '❌')"
echo "   app.js: $([ -f app.js ] && echo '✓' || echo '❌')"
echo "   package.json: $([ -f package.json ] && echo '✓' || echo '❌')"
echo "   .htaccess: $([ -f .htaccess ] && echo '✓' || echo '❌')"
echo "   .env: $([ -f .env ] && echo '✓' || echo '❌')"
echo "   node_modules: $([ -d node_modules ] && echo '✓' || echo '❌')"
echo ""

# Count installed packages
PACKAGE_COUNT=$(ls node_modules | wc -l | tr -d ' ')
echo "   Installed packages: $PACKAGE_COUNT"
echo ""

# Restart the application
echo "🔄 Restarting Node.js application..."
touch tmp/restart.txt
echo "✓ Restart triggered"
echo ""

echo "✅ Backend configuration complete!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Configuration failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Backend configured successfully${NC}"
echo ""

# Step 4: Test deployment
echo -e "${YELLOW}Step 4: Testing deployment...${NC}"
echo ""

sleep 5  # Give Passenger time to restart

echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" https://api.breakdowns.gobarry.co.uk/health || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${YELLOW}⚠️  Health check returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}Note: It may take a few moments for Passenger to start the app${NC}"
fi

echo ""

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Files uploaded to cPanel${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Environment configured${NC}"
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify health: https://api.breakdowns.gobarry.co.uk/health"
echo "2. Test supervisors: https://api.breakdowns.gobarry.co.uk/api/supervisors"
echo "3. Check logs via SSH: tail -f ~/logs/stderr.log"
echo "4. Update frontend to use: https://api.breakdowns.gobarry.co.uk"
echo ""
echo -e "${BLUE}cPanel Access:${NC}"
echo "   URL: https://gobarry.co.uk:2083"
echo "   User: ${CPANEL_USER}"
echo ""
echo -e "${BLUE}SSH Access:${NC}"
echo "   ssh ${CPANEL_USER}@${CPANEL_HOST}"
echo ""
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo ""
