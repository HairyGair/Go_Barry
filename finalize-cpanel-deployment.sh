#!/bin/bash

# Go BARRY cPanel Deployment Finalizer
echo "🚀 Go BARRY cPanel Deployment Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Must be run from the Go Barry project root directory"
    exit 1
fi

echo ""
echo "📦 Step 1: Build the complete frontend"
echo "======================================"
cd Go_BARRY
echo "Building for cPanel production..."
npm run build:cpanel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check for errors and try again."
    exit 1
fi

cd ..

echo ""
echo "📁 Step 2: Copy build files to deployment package"
echo "================================================="

# Copy the real build files
if [ -d "Go_BARRY/cpanel-build/_expo" ]; then
    echo "Copying _expo directory..."
    cp -r Go_BARRY/cpanel-build/_expo/* cpanel-deployment-fresh/_expo/
    echo "✅ Static assets copied"
fi

if [ -f "Go_BARRY/cpanel-build/gobarry-logo.png" ]; then
    echo "Copying logo..."
    cp Go_BARRY/cpanel-build/gobarry-logo.png cpanel-deployment-fresh/
    echo "✅ Logo copied"
fi

if [ -f "Go_BARRY/cpanel-build/metadata.json" ]; then
    echo "Copying metadata..."
    cp Go_BARRY/cpanel-build/metadata.json cpanel-deployment-fresh/
    echo "✅ Metadata copied"
fi

# Update index.html with real entry point
if [ -f "Go_BARRY/cpanel-build/index.html" ]; then
    echo "Using production index.html..."
    cp Go_BARRY/cpanel-build/index.html cpanel-deployment-fresh/index.html
    echo "✅ Production index.html installed"
fi

echo ""
echo "📦 Step 3: Create deployment package"
echo "===================================="

cd cpanel-deployment-fresh
zip -r ../go-barry-cpanel-ready.zip . -x '*.DS_Store' '*.map'
cd ..

# Get deployment statistics
FILE_COUNT=$(find cpanel-deployment-fresh -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-cpanel-ready.zip 2>/dev/null | cut -f1 || echo "Unknown")
FOLDER_SIZE=$(du -sh cpanel-deployment-fresh 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "✅ Go BARRY cPanel Deployment Complete!"
echo "======================================="
echo ""
echo "📦 Package Details:"
echo "   📁 Folder: cpanel-deployment-fresh/"
echo "   📦 ZIP File: go-barry-cpanel-ready.zip"  
echo "   📊 ZIP Size: $ZIP_SIZE"
echo "   📄 Total Files: $FILE_COUNT"
echo "   💾 Folder Size: $FOLDER_SIZE"
echo ""
echo "🎯 Deployment Contents:"
echo "   ✅ Complete React build (index.html + static assets)"
echo "   ✅ Optimized .htaccess (SPA routing + performance)"
echo "   ✅ Upload instructions and troubleshooting guide"
echo "   ✅ Production-ready configuration"
echo "   ✅ Logo and metadata files"
echo ""
echo "🚀 Ready to Upload!"
echo "=================="
echo "1. Upload 'go-barry-cpanel-ready.zip' to cPanel File Manager"
echo "2. Extract to public_html directory"  
echo "3. Visit https://gobarry.co.uk"
echo ""
echo "📖 See: cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md"
echo ""
echo "🌐 Your URLs will be:"
echo "   • Main App: https://gobarry.co.uk"
echo "   • Display: https://gobarry.co.uk/display"  
echo "   • Supervisor: https://gobarry.co.uk/browser-main"
echo ""
echo "🔗 Backend API: https://go-barry.onrender.com"
echo ""
