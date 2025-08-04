#!/bin/bash

echo "🚀 Deploying Go BARRY Coordinate Caching Implementation..."
echo "=================================================="

# Navigate to project root
cd /Users/anthony/Go\ BARRY\ App

# Git status check
echo "📊 Checking git status..."
git status --short

echo ""
echo "📝 Files to be committed:"
echo "- backend/render-startup.js (CORS fixes)"
echo "- backend/services/coordinateCacheService.js (Caching implementation)"
echo "- backend/routes/roadworksUnifiedSimple.js (Include cached fields)"
echo "- backend/routes/coordinateCacheTest.js (New test endpoints)"
echo "- backend/index.js (Register test route)"
echo "- backend/migrations/add-coordinate-caching.sql (SQL migration)"
echo "- Go_BARRY/app/disruption-centre/index.jsx (Reduce API calls)"
echo ""

# Add and commit changes
echo "💾 Committing all changes..."
git add -A
git commit -m "Implement coordinate caching with Supabase columns + CORS fixes

- Add cached_lat/lng columns to streetworks table
- Update coordinateCacheService to use new columns
- Include cached fields in roadworks unified query
- Add test endpoints for verification
- Fix CORS for http://gobarry.co.uk
- Reduce API call frequency to 120s
- Add migration script for Supabase"

# Push to GitHub (auto-deploys to Render)
echo "🚀 Pushing to GitHub (auto-deploy to Render)..."
git push

echo ""
echo "✅ Code deployed! Backend will update in ~2-3 minutes"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "============================"
echo ""
echo "1. 🗄️  RUN SUPABASE MIGRATION:"
echo "   a) Go to: https://app.supabase.com/project/[your-project-id]/sql"
echo "   b) Open: backend/migrations/add-coordinate-caching.sql"
echo "   c) Copy the entire SQL script"
echo "   d) Paste into SQL editor and click 'Run'"
echo "   e) Verify output shows columns were added"
echo ""
echo "2. 🧪 TEST THE IMPLEMENTATION (after Render deploys):"
echo "   a) Verify columns: https://go-barry.onrender.com/api/coordinate-cache/verify-columns"
echo "   b) Test caching: https://go-barry.onrender.com/api/coordinate-cache/test"
echo "   c) Check stats: https://go-barry.onrender.com/api/coordinate-cache/stats"
echo ""
echo "3. 🌐 BUILD & DEPLOY FRONTEND:"
echo "   cd Go_BARRY"
echo "   expo export:web"
echo "   # Upload web-build folder to www.gobarry.co.uk"
echo ""
echo "4. 🔍 MONITOR LOGS:"
echo "   - Watch for '✅ Cached coordinates' messages"
echo "   - Check cache hit rates improve over time"
echo "   - Verify no more 400 errors"
echo ""
echo "📋 Full guide: COORDINATE-CACHING-GUIDE.md"
echo ""
echo "🎉 Deployment script complete!"
