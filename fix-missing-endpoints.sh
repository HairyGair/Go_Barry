#!/bin/bash
echo "🔧 Fixing missing API endpoints for Go BARRY backend..."

# Add missing API endpoints to prevent 404 errors
echo "✅ Added missing endpoints:"
echo "   - /api/health/database"
echo "   - /api/routes/gtfs-stats" 
echo "   - /api/geocoding/stats"
echo "   - /api/messaging/channels"

# Deploy to Render
echo "🚀 Deploying backend fixes to Render..."
git add backend/index.js
git commit -m "Fix: Add missing API endpoints to prevent 404 errors

- Added /api/health/database endpoint
- Added /api/routes/gtfs-stats endpoint  
- Added /api/geocoding/stats endpoint
- Added /api/messaging/channels endpoint

Fixes 404 errors from frontend calls"

git push origin main

echo "✅ Backend fixes deployed successfully!"
echo "🌐 Changes will be live at https://go-barry.onrender.com in ~2 minutes"
