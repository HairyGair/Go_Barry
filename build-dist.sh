#!/bin/bash

echo "📦 Building cPanel-ready files in dist folder..."

# Create dist structure
mkdir -p dist/app
mkdir -p dist/components  
mkdir -p dist/assets
mkdir -p dist/config
mkdir -p dist/constants
mkdir -p dist/services
mkdir -p dist/theme
mkdir -p dist/utils
mkdir -p dist/public

echo "📂 Copying essential files..."

# Copy main app files
cp -r Go_BARRY/app/* dist/app/ 2>/dev/null || true
cp -r Go_BARRY/components/* dist/components/ 2>/dev/null || true
cp -r Go_BARRY/assets/* dist/assets/ 2>/dev/null || true
cp -r Go_BARRY/config/* dist/config/ 2>/dev/null || true
cp -r Go_BARRY/constants/* dist/constants/ 2>/dev/null || true
cp -r Go_BARRY/services/* dist/services/ 2>/dev/null || true
cp -r Go_BARRY/theme/* dist/theme/ 2>/dev/null || true
cp -r Go_BARRY/utils/* dist/utils/ 2>/dev/null || true
cp -r Go_BARRY/public/* dist/public/ 2>/dev/null || true

# Copy root files
cp Go_BARRY/App.tsx dist/ 2>/dev/null || true
cp Go_BARRY/App.web.tsx dist/ 2>/dev/null || true
cp Go_BARRY/index.ts dist/ 2>/dev/null || true
cp Go_BARRY/package.json dist/ 2>/dev/null || true
cp Go_BARRY/app.json dist/ 2>/dev/null || true
cp Go_BARRY/metro.config.js dist/ 2>/dev/null || true
cp Go_BARRY/tsconfig.json dist/ 2>/dev/null || true

# Copy htaccess for SPA routing
cp Go_BARRY/.htaccess dist/ 2>/dev/null || true

echo "✅ cPanel deployment ready in dist/ folder!"
echo ""
echo "📁 Structure created:"
ls -la dist/

echo ""
echo "🚀 READY TO DEPLOY!"
echo "Upload dist/ folder contents to cPanel public_html"
echo "Your enhanced Go BARRY display will be live!"
