#!/bin/bash
# Build and deploy TomTom timing fix

echo "📱 Building Go BARRY with TomTom Map Fix"
echo "======================================="

# Navigate to frontend directory
cd "/Users/anthony/Go BARRY App/Go_BARRY"
echo "📍 Current directory: $(pwd)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for web
echo "🔨 Building for web deployment..."
npm run build:web

# Check build success
if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📂 Contents of dist/:"
    ls -la dist/
    
    # Create deployment zip
    echo "📦 Creating deployment package..."
    cd dist
    zip -r "../gobarry-tomtom-fix-deployment.zip" . -x "*.DS_Store" "*.map"
    cd ..
    
    echo "✅ Created: gobarry-tomtom-fix-deployment.zip"
    echo ""
    echo "🚀 DEPLOYMENT READY!"
    echo "The TomTom container timing fix is now built and packaged."
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi
