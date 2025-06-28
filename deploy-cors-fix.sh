#!/bin/bash
# Make executable: chmod +x deploy-cors-fix.sh

# Deploy CORS fix for www.gobarry.co.uk
echo "🚀 Deploying CORS fix to allow www.gobarry.co.uk..."

# Check if we're in the right directory
if [ ! -f "backend/render-startup.js" ]; then
    echo "❌ Error: Must run from Go BARRY App root directory"
    exit 1
fi

echo "📦 Creating deployment commit..."
git add backend/render-startup.js backend/index.js
git commit -m "Fix CORS: Allow www.gobarry.co.uk in render-startup.js

- Added www.gobarry.co.uk to allowed origins in render-startup.js
- This was missing and causing CORS errors
- Also added localhost origins for development
- Enhanced CORS logging for debugging
- Made CORS more permissive in production"

echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ CORS fix deployed!"
echo ""
echo "🔄 Render.com will auto-deploy in ~2-3 minutes"
echo "📊 Monitor deployment at: https://dashboard.render.com"
echo ""
echo "🧪 Test after deployment:"
echo "1. Visit https://www.gobarry.co.uk"
echo "2. Check browser console - CORS errors should be gone"
echo "3. Backend logs will show: ✅ CORS: Allowed origin: https://www.gobarry.co.uk"
