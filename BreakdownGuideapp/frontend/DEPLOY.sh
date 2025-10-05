#!/bin/bash

# Breakdown Guide - cPanel Deployment Script
# This script builds the frontend and prepares it for cPanel upload

set -e  # Exit on error

echo "========================================"
echo "Breakdown Guide - cPanel Deployment"
echo "========================================"
echo ""

# Step 1: Clean previous build
echo "Step 1: Cleaning previous build..."
rm -rf dist/
echo "✓ Cleaned dist/ folder"
echo ""

# Step 2: Build the application
echo "Step 2: Building application..."
npm run build
echo "✓ Build completed"
echo ""

# Step 3: Verify build output
echo "Step 3: Verifying build output..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "✗ Error: dist/ folder not created!"
  exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
  echo "✗ Error: dist/index.html not found!"
  exit 1
fi

# Check if assets folder exists
if [ ! -d "dist/assets" ]; then
  echo "✗ Error: dist/assets/ folder not found!"
  exit 1
fi

# Count asset files
ASSET_COUNT=$(find dist/assets -type f | wc -l | tr -d ' ')
echo "✓ Found $ASSET_COUNT asset files"

# Check for relative paths in index.html
if grep -q 'src="./assets/' dist/index.html; then
  echo "✓ Using relative paths (./assets/)"
else
  echo "✗ Warning: Not using relative paths - check vite.config.js"
fi

# Check dist size
DIST_SIZE=$(du -sh dist/ | cut -f1)
echo "✓ Build size: $DIST_SIZE"
echo ""

# Step 4: Create deployment package
echo "Step 4: Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="breakdown-guide-${TIMESTAMP}.zip"

cd dist
zip -r "../${PACKAGE_NAME}" . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo "✓ Created deployment package: ${PACKAGE_NAME}"
echo ""

# Step 5: Display next steps
echo "========================================"
echo "Build Complete! Next Steps:"
echo "========================================"
echo ""
echo "1. Upload dist/ contents to cPanel:"
echo "   - Location: public_html/ or public_html/breakdowns/"
echo "   - Or upload: ${PACKAGE_NAME}"
echo ""
echo "2. Verify deployment at:"
echo "   https://breakdowns.gobarry.co.uk"
echo ""
echo "3. Check for errors:"
echo "   - Open DevTools (F12)"
echo "   - Look for 404 errors in Console"
echo "   - Verify all assets load in Network tab"
echo ""
echo "Files ready for upload in: dist/"
echo "Deployment package: ${PACKAGE_NAME}"
echo ""
echo "For detailed instructions, see:"
echo "   CPANEL_DEPLOYMENT.md"
echo ""
