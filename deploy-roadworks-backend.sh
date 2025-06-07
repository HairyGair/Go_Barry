#!/bin/bash

# Deploy Roadworks Backend to Render.com
# This script commits and pushes the complete roadworks API system

echo "🚀 Deploying BARRY Roadworks Backend System to Render.com..."
echo ""

# Check git status
echo "📋 Current git status:"
git status --short
echo ""

# Add all files
echo "📁 Adding files to git..."
git add .
echo "✅ Files added"
echo ""

# Commit with detailed message
echo "💾 Committing roadworks backend system..."
git commit -m "🚧 Add complete roadworks backend system

✅ Features implemented:
- Complete roadworks API with workflow management
- Communication generation (Blink PDF, Ticket Machine, Driver Briefing)
- Supervisor authentication integration
- GTFS route impact analysis (500m radius)
- Display screen promotion system
- Priority-based task management
- Status lifecycle tracking with audit trails

📁 Files added/modified:
- backend/routes/roadworksAPI.js (NEW)
- backend/services/roadworksServices.js (NEW) 
- backend/index.js (MODIFIED - added roadworks routes)
- ROADWORKS_API_DOCUMENTATION.md (NEW)

🎯 Endpoints now available:
- GET /api/roadworks - All roadworks with filtering
- POST /api/roadworks - Create roadworks task
- PUT /api/roadworks/:id/status - Update status
- POST /api/roadworks/:id/diversion - Create diversion plans
- POST /api/roadworks/:id/promote-to-display - Add to display
- GET /api/roadworks/display - Display screen roadworks
- GET /api/roadworks/stats - Statistics

🔧 Operational workflow:
Reported → Assessing → Planning → Approved → Active → Monitoring → Completed

Ready for supervisor frontend integration!"

if [ $? -eq 0 ]; then
    echo "✅ Commit successful"
    echo ""
else
    echo "❌ Commit failed - check for issues"
    exit 1
fi

# Push to main branch (triggers Render deployment)
echo "🌐 Pushing to GitHub (triggers Render.com deployment)..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment pushed successfully!"
    echo ""
    echo "🎯 Render.com will now deploy the roadworks backend:"
    echo "   📡 API Base: https://go-barry.onrender.com"
    echo "   🚧 Roadworks: https://go-barry.onrender.com/api/roadworks"
    echo "   📊 Stats: https://go-barry.onrender.com/api/roadworks/stats"
    echo "   💚 Health: https://go-barry.onrender.com/api/health"
    echo ""
    echo "⏳ Deployment will take 2-3 minutes..."
    echo "🔍 Check status at: https://dashboard.render.com"
    echo ""
    echo "🧪 Test after deployment:"
    echo "   curl https://go-barry.onrender.com/api/roadworks/stats"
    echo ""
else
    echo "❌ Push failed - check network connection and git credentials"
    exit 1
fi