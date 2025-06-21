#!/bin/bash
# Make this script executable with: chmod +x deploy-convex-sync-fix.sh
# deploy-convex-sync-fix.sh
# Deploy the Convex supervisor sync fixes

echo "🚀 Deploying Convex Supervisor Sync Fix..."

# Step 1: Copy updated files
echo "📁 Step 1: Copying updated files..."

# Copy DisplayScreen fix
cp DisplayScreen_FIXED.jsx ../../Go_BARRY/components/DisplayScreen.jsx
echo "✅ Updated DisplayScreen.jsx with Convex hooks"

# Copy backend Convex sync fix
cp convexSync_FIXED.js ../../backend/services/convexSync.js
echo "✅ Updated convexSync.js with supervisor action logging"

# Copy Convex functions
cp sync_CONVEX.ts ../../Go_BARRY/convex/sync.ts
echo "✅ Updated convex/sync.ts with logSupervisorAction"

cp supervisors_CONVEX.ts ../../Go_BARRY/convex/supervisors.ts
echo "✅ Updated convex/supervisors.ts with session management"

# Copy integration helper
cp convexIntegration.js ../../Go_BARRY/services/convexIntegration.js
echo "✅ Added convexIntegration.js helper"

# Step 2: Deploy Convex functions
echo -e "\n📡 Step 2: Deploying Convex functions..."
cd ../../Go_BARRY
npx convex deploy
cd ../CONVEX_SUPERVISOR_SYNC_FIX

# Step 3: Deploy backend
echo -e "\n🖥️ Step 3: Deploy backend to Render..."
echo "Run these commands:"
echo "  cd ../../backend"
echo "  git add ."
echo "  git commit -m 'Fix: Add Convex supervisor sync and CORS cache-control header'"
echo "  git push"

# Step 4: Deploy frontend
echo -e "\n🌐 Step 4: Deploy frontend..."
echo "Run these commands:"
echo "  cd ../../Go_BARRY"
echo "  npm run build:web"
echo "  # Upload the web-build folder to cPanel"

echo -e "\n✅ Fix deployment complete!"
echo "Test at:"
echo "  - Dashboard: https://www.gobarry.co.uk/"
echo "  - Display: https://www.gobarry.co.uk/display"
echo "  - Convex: https://dashboard.convex.dev/d/standing-octopus-908"
