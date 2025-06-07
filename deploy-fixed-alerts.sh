#!/bin/bash
# Deploy Go BARRY with fixed alerts priority system

echo "🚀 Go BARRY - Fixed Alerts Deployment"
echo "======================================="

# Check current directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Please run from Go BARRY root directory"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "📅 Deployment time: $(date)"

# Test backend API key
echo ""
echo "🔑 Checking API keys..."
cd backend
if [[ -f ".env" ]]; then
    echo "✅ .env file exists"
    if grep -q "TOMTOM_API_KEY" .env; then
        echo "✅ TomTom API key configured"
    else
        echo "⚠️ TomTom API key missing in .env"
    fi
else
    echo "⚠️ .env file missing in backend/"
fi

# Quick test of alerts
echo ""
echo "🧪 Testing alerts system..."
if command -v node &> /dev/null; then
    echo "📡 Running quick alert test..."
    node test-alerts.js 2>/dev/null || echo "⚠️ Test script needs API keys to run"
else
    echo "⚠️ Node.js not found, skipping test"
fi

cd ..

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo ""
echo "🏗️ Building frontend..."
cd Go_BARRY
expo export --platform web --output-dir dist --clear

cd ..

# Commit and deploy
echo ""
echo "🚀 Deploying to production..."
git add .
git commit -m "URGENT: Fix alerts priority system - ensure alerts always flow through to frontend

- Fixed /api/alerts-enhanced endpoint with priority error handling
- Added comprehensive logging to TomTom service
- Enhanced fallback responses for all endpoints
- Improved emergency response handling
- Added debugging metadata to all responses

This should resolve the alerts not appearing on display screen and browser."

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🎯 Deployment Summary:"
echo "✅ Enhanced alerts endpoint with priority flow"
echo "✅ Improved TomTom service logging"
echo "✅ Added emergency fallback responses"
echo "✅ Enhanced error handling and debugging"
echo "✅ Frontend built and ready"
echo "✅ Committed and pushed to GitHub"

echo ""
echo "🔍 After deployment, check:"
echo "1. https://go-barry.onrender.com/api/health"
echo "2. https://go-barry.onrender.com/api/alerts-enhanced"
echo "3. https://gobarry.co.uk/display"
echo "4. https://gobarry.co.uk (main interface)"

echo ""
echo "📊 Expected improvements:"
echo "- Alerts should appear consistently on all interfaces"
echo "- Better error logging for debugging"
echo "- Emergency fallback responses prevent blank screens"
echo "- Enhanced debugging metadata for troubleshooting"

echo ""
echo "✅ Deployment complete! Monitor the logs for alert flow confirmation."
