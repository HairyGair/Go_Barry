#!/bin/bash
# DEPLOY_FRONTEND_NOW.sh
# Frontend deployment with TomTom integration

echo "📱 Go BARRY Frontend Deployment"
echo "==============================="
echo ""

# Check current directory
cd "/Users/anthony/Go BARRY App"
echo "📍 Working directory: $(pwd)"
echo ""

# Build frontend
echo "🔨 Building frontend with TomTom integration..."
cd Go_BARRY
echo "📍 Now in: $(pwd)"

# Install dependencies if needed
echo "📦 Installing/updating dependencies..."
npm install

# Build for web deployment
echo "🌐 Building for web deployment..."
npm run build:web

# Check build success
if [ -d "dist" ]; then
    echo "✅ Build successful! Output in Go_BARRY/dist/"
    echo ""
    echo "📂 Build contents:"
    ls -la dist/
    echo ""
else
    echo "❌ Build failed! No dist directory found."
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r "../gobarry-tomtom-deployment.zip" .
cd ..
echo "✅ Created: gobarry-tomtom-deployment.zip"
echo ""

# Move to project root
cd ..
echo "📍 Back to project root: $(pwd)"

echo ""
echo "✅ Frontend Build Complete!"
echo ""
echo "📋 MANUAL DEPLOYMENT TO CPANEL:"
echo "1. Log into cPanel: https://your-cpanel-url.com"
echo "2. Go to File Manager"
echo "3. Navigate to public_html/"
echo "4. Upload: Go_BARRY/gobarry-tomtom-deployment.zip"
echo "5. Extract the zip file"
echo "6. Set correct permissions"
echo "7. Test: https://gobarry.co.uk"
echo ""
echo "🧪 Post-deployment tests:"
echo "• Open https://gobarry.co.uk"
echo "• Check TomTom map loads on display screen"
echo "• Verify traffic overlay toggle works"
echo "• Test alert marker placement and zoom"
echo "• Check browser console for any errors"
echo ""
echo "🗺️ TomTom features to verify:"
echo "• Map renders with TomTom tiles"
echo "• Traffic flow overlay appears"
echo "• Alert markers show with correct colors"
echo "• Auto-zoom to alerts works"
echo "• Traffic toggle button functional"
