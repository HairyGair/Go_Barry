#!/bin/bash

echo "🚀 Deploying Go BARRY Fixes..."
echo "================================"

# Start from project root
cd /Users/anthony/Go\ BARRY\ App

# Git status check
echo "📊 Checking git status..."
git status --short

# Add and commit changes
echo "📝 Committing fixes..."
git add backend/render-startup.js backend/services/coordinateCacheService.js Go_BARRY/app/disruption-centre/index.jsx
git commit -m "Fix: CORS for gobarry.co.uk, disable coordinate DB caching, reduce API call frequency"

# Push to GitHub (auto-deploys to Render)
echo "🚀 Pushing to GitHub (auto-deploy to Render)..."
git push

echo "✅ Backend fixes deployed!"
echo ""
echo "⏱️  Render will auto-deploy backend in ~2-3 minutes"
echo ""
echo "🌐 Frontend deployment:"
echo "1. cd Go_BARRY"
echo "2. expo export:web"
echo "3. Upload web-build to www.gobarry.co.uk"
echo ""
echo "🧪 Test URLs after deployment:"
echo "1. https://go-barry.onrender.com/api/roadworks/unified"
echo "2. http://www.gobarry.co.uk (CORS should work)"
echo ""
echo "📋 What was fixed:"
echo "✅ Added http://gobarry.co.uk and http://www.gobarry.co.uk to CORS"
echo "✅ Disabled Supabase coordinate caching (prevents 400 errors)"
echo "✅ Increased stats refresh from 60s to 120s (reduces duplicate calls)"
echo "✅ Coordinates still processed, using memory cache only"
echo ""
echo "🔍 Monitor logs at: https://dashboard.render.com"
