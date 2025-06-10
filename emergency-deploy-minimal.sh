#!/bin/bash
# emergency-deploy-minimal.sh
# Deploy minimal working backend to get system back online

echo "🚨 EMERGENCY DEPLOY: Minimal Backend"
echo "===================================="

echo "🔄 Backing up current index.js..."
cp backend/index.js backend/index-backup.js

echo "🚑 Switching to emergency minimal backend..."
cp backend/emergency-minimal-index.js backend/index.js

echo "📝 Updating package.json start script..."
cd backend
# Simplify start script for emergency mode
sed -i.backup 's/"start": "node --max-old-space-size=1800 --expose-gc index.js"/"start": "node index.js"/' package.json

cd ..

echo "🚀 Deploying emergency backend..."
git add .
git commit -m "EMERGENCY: Deploy minimal backend - main backend was down"
git push origin main

echo ""
echo "✅ Emergency deployment triggered!"
echo ""
echo "📋 What this does:"
echo "   - Deploys a minimal, guaranteed-working backend"
echo "   - Provides basic /api/health and /api/alerts-enhanced endpoints"
echo "   - Gets the display screen working again"
echo ""
echo "⏱️ Wait 2-3 minutes, then test:"
echo "   node quick-test-data-feeds.js"
echo ""
echo "🔧 After emergency backend is working:"
echo "   1. We can debug why the main backend failed"
echo "   2. Restore full functionality step by step"
