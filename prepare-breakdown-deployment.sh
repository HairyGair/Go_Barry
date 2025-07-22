#!/bin/bash
# Go BARRY Breakdown Guide - Quick Fix Script
# This script prepares the breakdown guide files for immediate deployment

echo "🚀 Go BARRY Breakdown Guide - Quick Deployment Fix"
echo "================================================"
echo ""

# Check if source directory exists
SOURCE_DIR="/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide"
DEPLOY_DIR="/Users/anthony/Go BARRY App/breakdown-guide-react-deploy"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory not found at $SOURCE_DIR"
    exit 1
fi

echo "✅ Source directory found"
echo "📁 Copying files from: $SOURCE_DIR"
echo "📁 To deployment directory: $DEPLOY_DIR"
echo ""

# Create deployment directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"

# Copy all files maintaining structure
echo "📋 Copying core files..."
cp -f "$SOURCE_DIR/index.html" "$DEPLOY_DIR/"
cp -f "$SOURCE_DIR/App.js" "$DEPLOY_DIR/"

# Copy .htaccess if it exists in source, otherwise use the one in deploy
if [ -f "$SOURCE_DIR/.htaccess" ]; then
    cp -f "$SOURCE_DIR/.htaccess" "$DEPLOY_DIR/"
fi

# Copy directories
echo "📁 Copying component directories..."
cp -rf "$SOURCE_DIR/components" "$DEPLOY_DIR/"
cp -rf "$SOURCE_DIR/styles" "$DEPLOY_DIR/"

# Count wizard files
WIZARD_COUNT=$(ls -1 "$DEPLOY_DIR/components/wizards/"*.js 2>/dev/null | wc -l)
echo ""
echo "✅ Deployment package ready!"
echo "📊 Total wizards included: $WIZARD_COUNT"
echo ""

echo "🔧 CYBERDUCK UPLOAD INSTRUCTIONS:"
echo "================================="
echo "1. Open CyberDuck and connect to your server"
echo "2. Navigate to /public_html/breakdown-guide/"
echo "3. Delete all existing files in that directory"
echo "4. Upload ALL files from: $DEPLOY_DIR"
echo "5. Ensure .htaccess file is uploaded (may be hidden)"
echo "6. Set permissions: Files=644, Directories=755"
echo ""
echo "📋 Files to upload:"
echo "- index.html"
echo "- App.js"
echo "- .htaccess (CRITICAL - enables routing)"
echo "- components/ (entire directory)"
echo "- styles/ (entire directory)"
echo ""
echo "🌐 After upload, test at:"
echo "https://www.gobarry.co.uk/breakdown-guide/"
echo ""
echo "✨ The page should show:"
echo "- 'Go NorthEast' loading screen (briefly)"
echo "- Then 'Go BARRY' dark themed interface"
echo "- Progress: 24 of 31 Wizards Complete (77%)"
echo ""
echo "Ready for deployment via CyberDuck!"
