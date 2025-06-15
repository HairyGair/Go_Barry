#!/bin/bash

echo "🚀 Creating Fresh cPanel Deployment Package for Go BARRY"
echo "=================================================="

cd "/Users/anthony/Go BARRY App/Go_BARRY"

# Clean any existing build
echo "🧹 Cleaning previous builds..."
rm -rf cpanel-build
rm -f gobarry-cpanel-deployment.zip

# Build for production web
echo "🔨 Building for web production..."
NODE_ENV=production npx expo export --platform web --output-dir cpanel-build --clear

# Check if build was successful
if [ ! -d "cpanel-build" ]; then
    echo "❌ Build failed - cpanel-build directory not created"
    exit 1
fi

echo "✅ Build completed successfully"

# Copy important files
echo "📋 Copying essential files..."

# Copy .htaccess for SPA routing
cp .htaccess cpanel-build/

# Copy logo if it exists
if [ -f "gobarry-logo.png" ]; then
    cp gobarry-logo.png cpanel-build/
fi

# Create deployment zip
echo "📦 Creating deployment zip..."
cd cpanel-build
zip -r ../gobarry-cpanel-deployment.zip . -x '*.DS_Store' '*.map'

cd ..

echo "✅ Fresh deployment package created: gobarry-cpanel-deployment.zip"
echo ""
echo "📁 Package contents:"
unzip -l gobarry-cpanel-deployment.zip | head -20

echo ""
echo "🎯 Next steps:"
echo "1. Upload gobarry-cpanel-deployment.zip to your cPanel File Manager"
echo "2. Extract it in the public_html directory"
echo "3. Visit https://gobarry.co.uk to verify deployment"
echo ""
echo "🔥 Package ready for deployment!"
