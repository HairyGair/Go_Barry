#!/bin/bash

echo "📦 Building cPanel deployment to dist folder..."

# Clean and create dist directory
rm -rf dist/*
mkdir -p dist

echo "📂 Copying Go BARRY frontend files to dist..."

# Copy all frontend files except excluded directories
rsync -av Go_BARRY/ dist/ \
  --exclude node_modules \
  --exclude .expo \
  --exclude .git \
  --exclude "*.log" \
  --exclude .DS_Store \
  --exclude dist

echo "📄 Adding necessary config files..."

# Copy root config files needed for cPanel
cp .htaccess dist/ 2>/dev/null || cp .htaccess-gobarry dist/.htaccess 2>/dev/null || true
cp index.html dist/ 2>/dev/null || true

echo "✅ cPanel deployment ready in dist/ folder!"
echo ""
echo "📁 Contents:"
ls -la dist/

echo ""
echo "🚀 DEPLOY TO CPANEL:"
echo "1. Upload entire dist/ folder contents to cPanel"
echo "2. Extract to public_html at gobarry.co.uk" 
echo "3. Your enhanced display screen will be live!"
echo ""
echo "🎯 Enhanced features included:"
echo "   ✅ Fixed alert card text layout"
echo "   ✅ Professional control room design"
echo "   ✅ Geographic route filtering"
echo "   ✅ Better visibility and information display"
