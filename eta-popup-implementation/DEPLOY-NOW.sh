#!/bin/bash

# ETA Request Pop-up System - EXACT Deployment Script
# This script copies all files to their correct locations

echo "🚀 Deploying ETA Request Pop-up System..."
echo "========================================="

# Navigate to the project root
cd "/Users/anthony/Go BARRY App"

# Step 1: Copy Backend API file to routes directory
echo "📦 Step 1: Installing Backend API..."
cp eta-popup-implementation/2-backend-api.js backend/routes/etaRequestSystem.js
echo "✅ Backend API installed to: backend/routes/etaRequestSystem.js"

# Step 2: Copy HTML files to public directory
echo "📦 Step 2: Installing Frontend Dashboards..."
cp eta-popup-implementation/3-engineering-dashboard.html Go_BARRY/public/engineering-eta-dashboard.html
echo "✅ Engineering dashboard installed to: Go_BARRY/public/engineering-eta-dashboard.html"

# We don't need to copy the SDC enhancement separately as it should be integrated into the existing dashboard
echo "📝 Note: Integrate code from 4-sdc-dashboard-enhancement.html into:"
echo "   Go_BARRY/public/enhanced-breakdown-dashboard.html"

# Step 3: Copy test script to backend
echo "📦 Step 3: Installing Test Script..."
cp eta-popup-implementation/test-eta-system.sh backend/test-eta-system.sh
chmod +x backend/test-eta-system.sh
echo "✅ Test script installed to: backend/test-eta-system.sh"

# Step 4: Show the database migration location
echo ""
echo "📦 Step 4: Database Migration"
echo "----------------------------------------"
echo "📋 Copy the SQL from: eta-popup-implementation/1-database-migration.sql"
echo "📋 Run it in your Supabase SQL Editor"
echo ""

# Step 5: Update backend dependencies
echo "📦 Step 5: Installing Dependencies..."
cd backend
npm install socket.io node-cron --save
echo "✅ Dependencies installed"

echo ""
echo "========================================="
echo "✅ Files deployed to correct locations!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Run the database migration in Supabase"
echo "2. Update backend/index.js to include the ETA routes"
echo "3. Add WebSocket initialization to backend/index.js"
echo "4. Integrate SDC enhancement into enhanced-breakdown-dashboard.html"
echo "5. Test the system: cd backend && bash test-eta-system.sh"
echo ""
echo "Access URLs:"
echo "🔧 Engineering: http://localhost:3000/engineering-eta-dashboard.html"
echo "📞 SDC: http://localhost:3000/enhanced-breakdown-dashboard.html"