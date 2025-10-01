#!/bin/bash

# Complete Automated Deployment Script for ETA System
# This handles everything including ES6 conversion

echo "🚀 ETA Request Pop-up System - Complete Automated Deployment"
echo "============================================================"

# Set directories
PROJECT_ROOT="/Users/anthony/Go BARRY App"
BACKEND_DIR="$PROJECT_ROOT/backend"
PUBLIC_DIR="$PROJECT_ROOT/Go_BARRY/public"
ETA_DIR="$PROJECT_ROOT/eta-popup-implementation"

# Step 1: Copy the ES6 version of the API
echo ""
echo "📦 Step 1: Installing Backend API (ES6 version)..."
cp "$ETA_DIR/etaRequestSystem-ES6.js" "$BACKEND_DIR/routes/etaRequestSystem.js"
echo "✅ Backend API installed"

# Step 2: Copy Engineering Dashboard
echo ""
echo "📦 Step 2: Installing Engineering Dashboard..."
cp "$ETA_DIR/3-engineering-dashboard.html" "$PUBLIC_DIR/engineering-eta-dashboard.html"
echo "✅ Engineering dashboard installed"

# Step 3: Copy test script
echo ""
echo "📦 Step 3: Installing Test Script..."
cp "$ETA_DIR/test-eta-system.sh" "$BACKEND_DIR/test-eta-system.sh"
chmod +x "$BACKEND_DIR/test-eta-system.sh"
echo "✅ Test script installed"

# Step 4: Install dependencies
echo ""
echo "📦 Step 4: Installing Node Dependencies..."
cd "$BACKEND_DIR"
npm install socket.io node-cron --save
echo "✅ Dependencies installed"

# Step 5: Create a backup of index.js
echo ""
echo "📦 Step 5: Creating backup of index.js..."
cp "$BACKEND_DIR/index.js" "$BACKEND_DIR/index.js.backup-$(date +%Y%m%d-%H%M%S)"
echo "✅ Backup created"

# Step 6: Display manual steps
echo ""
echo "============================================================"
echo "✅ AUTOMATED STEPS COMPLETE!"
echo "============================================================"
echo ""
echo "📋 REMAINING MANUAL STEPS:"
echo ""
echo "1️⃣  RUN DATABASE MIGRATION:"
echo "   - Open Supabase SQL Editor"
echo "   - Copy content from: $ETA_DIR/1-database-migration.sql"
echo "   - Paste and run in Supabase"
echo ""
echo "2️⃣  UPDATE backend/index.js:"
echo "   - Open: $BACKEND_DIR/index.js"
echo "   - Add the snippets from: $ETA_DIR/index-js-snippets.js"
echo "   - Key changes:"
echo "     • Add: import http from 'http';"
echo "     • Create: const server = http.createServer(app);"
echo "     • Change: app.listen to server.listen"
echo ""
echo "3️⃣  UPDATE enhanced-breakdown-dashboard.html:"
echo "   - Open: $PUBLIC_DIR/enhanced-breakdown-dashboard.html"
echo "   - Add Socket.IO script in <head>"
echo "   - Add ETA request functionality (see 4-sdc-dashboard-enhancement.html)"
echo ""
echo "4️⃣  TEST THE SYSTEM:"
echo "   cd $BACKEND_DIR"
echo "   npm run dev"
echo "   # In another terminal:"
echo "   bash test-eta-system.sh"
echo ""
echo "5️⃣  ACCESS THE DASHBOARDS:"
echo "   🔧 Engineering: http://localhost:3001/engineering-eta-dashboard.html"
echo "   📞 SDC: http://localhost:3001/enhanced-breakdown-dashboard.html"
echo ""
echo "============================================================"
echo "📁 All files have been deployed to their correct locations!"
echo "📋 Follow the manual steps above to complete the setup."
echo "============================================================"