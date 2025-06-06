#!/bin/bash
# Fixed deployment script for Railway/Render with proper Node.js options

echo "🚀 Deploying Go Barry Backend (Node.js Fix Applied)"
echo "=================================================="

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the backend directory"
    echo "💡 Try: cd backend && ./deploy-backend-fixed.sh"
    exit 1
fi

echo "🔧 Configuration:"
echo "   ✅ Node.js memory limit: 2048MB (compatible)"
echo "   ❌ Removed: --optimize-for-size (not supported in Node 22+)"
echo "   ✅ Production environment"
echo ""

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Current Node.js version: $NODE_VERSION"

# Test NODE_OPTIONS locally
echo "🧪 Testing NODE_OPTIONS compatibility..."
if NODE_OPTIONS="--max-old-space-size=2048" node --version >/dev/null 2>&1; then
    echo "✅ NODE_OPTIONS compatible with local Node.js"
else
    echo "⚠️ NODE_OPTIONS may have issues, but continuing..."
fi

echo ""
echo "🎯 Deployment Options:"
echo "====================="
echo ""
echo "Option A: Railway (Recommended)"
echo "------------------------------"
echo "1. Go to: https://railway.app"
echo "2. Connect your GitHub repository"
echo "3. Select the 'backend' directory as build path"
echo "4. Railway will auto-detect Node.js and use package.json"
echo "5. Set these environment variables in Railway dashboard:"
echo "   - TOMTOM_API_KEY=$TOMTOM_API_KEY"
echo "   - MAPQUEST_API_KEY=$MAPQUEST_API_KEY"
echo "   - HERE_API_KEY=$HERE_API_KEY"
echo "   - NATIONAL_HIGHWAYS_API_KEY=$NATIONAL_HIGHWAYS_API_KEY"
echo "   - CORS_ORIGIN=https://gobarry.co.uk"
echo "   - NODE_ENV=production"
echo ""
echo "Option B: Render (Alternative)"
echo "-----------------------------"
echo "1. Push your code to GitHub"
echo "2. Connect repository to Render"
echo "3. Use the fixed render.yaml configuration"
echo "4. Set environment variables in Render dashboard"
echo ""
echo "Option C: Heroku (Classic)"
echo "-------------------------"
echo "1. Install Heroku CLI"
echo "2. Run: heroku create barry-api"
echo "3. Run: git push heroku main"
echo "4. Set environment variables with heroku config:set"
echo ""

# Create a simple start script for testing
echo "🧪 Creating test start script..."
cat > start-local-test.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export PORT=3001
echo "🧪 Testing backend with production NODE_OPTIONS..."
npm start
EOF
chmod +x start-local-test.sh

echo "✅ Created start-local-test.sh for local testing"
echo ""
echo "🧪 To test locally with fixed settings:"
echo "   ./start-local-test.sh"
echo ""
echo "🚀 The --optimize-for-size flag has been removed!"
echo "   Your deployment should now work on Railway/Render/Heroku"
echo ""
echo "📋 Files updated:"
echo "   ✅ render.yaml - Fixed NODE_OPTIONS"
echo "   ✅ railway.json - Added proper config"
echo "   ✅ Procfile - Simple start command"
echo "   ✅ start-local-test.sh - Test script"
