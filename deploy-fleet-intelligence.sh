#!/bin/bash

# Deploy Fleet Intelligence Phase 1
# This script deploys the Fleet Intelligence API and documentation

echo "🚀 Deploying Fleet Intelligence Phase 1"
echo "========================================"
echo ""

# Navigate to backend directory
cd /Users/anthony/Go\ BARRY\ App/backend || exit

# Check if we're in the right directory
if [ ! -f "index.js" ]; then
    echo "❌ Error: index.js not found. Are you in the backend directory?"
    exit 1
fi

# Check git status
echo "📊 Checking git status..."
git status

# Add the new files
echo ""
echo "📝 Adding Fleet Intelligence files to git..."
git add routes/fleetIntelligenceAPI.js
git add index.js

# Also add the frontend file if it exists
if [ -f "../Go_BARRY/public/fleet-intelligence.html" ]; then
    echo "📝 Adding frontend file..."
    cd ../Go_BARRY || exit
    git add public/fleet-intelligence.html
    cd ../backend || exit
fi

# Commit the changes
echo ""
echo "💾 Committing changes..."
git commit -m "Add Fleet Intelligence Phase 1: Health Scores, Cost Tracking, Problem Vehicles

Features:
- Vehicle health scores (0-100) with color coding
- Real-time breakdown cost tracking
- Top 10 problem vehicles identification
- Auto-refresh every 30 seconds
- API endpoints for analytics and predictions

Endpoints:
- /api/fleet-intelligence/health-scores
- /api/fleet-intelligence/cost-analysis
- /api/fleet-intelligence/problem-vehicles
- /api/fleet-intelligence/predictions
- /api/fleet-intelligence/depot-comparison

Frontend at: /public/fleet-intelligence.html"

# Push to remote
echo ""
echo "⬆️ Pushing to remote repository..."
git push

echo ""
echo "✅ Fleet Intelligence Phase 1 deployed!"
echo ""
echo "📝 Next Steps:"
echo "1. Wait ~5 minutes for Render.com to auto-deploy"
echo "2. Access the dashboard at:"
echo "   https://go-barry.onrender.com/public/fleet-intelligence.html"
echo ""
echo "🔍 To test the API endpoints:"
echo "curl https://go-barry.onrender.com/api/fleet-intelligence/health-scores"
echo "curl https://go-barry.onrender.com/api/fleet-intelligence/cost-analysis"
echo "curl https://go-barry.onrender.com/api/fleet-intelligence/problem-vehicles"
echo ""
echo "📊 Dashboard Features:"
echo "- Vehicle Health Scores (Green/Amber/Red)"
echo "- Today's Breakdown Costs (Live Counter)"
echo "- Top 10 Problem Vehicles"
echo "- 30-second Auto Refresh"
echo "- Filter by Health Status"
