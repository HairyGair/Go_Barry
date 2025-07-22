#!/bin/bash

# Breakdown Guide - React-Based Wizard System Deployment Script
# Deploys complete React-based modular wizard system to production

set -e  # Exit on any error

echo "🎆 Deploying React-Based Breakdown Guide System"
echo "==============================================="

# Check if we're in the right directory
if [ ! -d "Go_BARRY/public/breakdown-guide" ]; then
    echo "❌ Error: React breakdown guide directory not found"
    echo "Please run this script from the Go BARRY App root directory"
    exit 1
fi

# Verify all required files exist
echo "📋 Verifying React deployment files..."

REQUIRED_FILES=(
    "Go_BARRY/public/breakdown-guide/index.html"
    "Go_BARRY/public/breakdown-guide/App.js"
    "Go_BARRY/public/breakdown-guide/components/common/constants.js"
    "Go_BARRY/public/breakdown-guide/components/common/icons.js"
    "Go_BARRY/public/breakdown-guide/styles/main.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ $file"
    fi
done

# Count completed wizards
echo "🔍 Verifying wizard implementations..."

WIZARD_COUNT=$(find "Go_BARRY/public/breakdown-guide/components/wizards" -name "*.js" | wc -l | tr -d ' ')
if [ "$WIZARD_COUNT" -lt 20 ]; then
    echo "⚠️  Warning: Only $WIZARD_COUNT wizards found (expected 24+)"
else
    echo "✅ $WIZARD_COUNT wizard implementations found"
fi

# Check for React and modern dependencies
if ! grep -q "react@18" "Go_BARRY/public/breakdown-guide/index.html"; then
    echo "❌ Error: React 18 not found in index.html"
    exit 1
else
    echo "✅ React 18 dependency verified"
fi

# Create deployment directory
echo "📦 Preparing React deployment package..."
DEPLOY_DIR="breakdown-guide-react-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy all necessary files maintaining structure
cp -r "Go_BARRY/public/breakdown-guide/"* "$DEPLOY_DIR/"

# Create .htaccess for proper routing (if needed)
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
# Breakdown Guide - React App Configuration
RewriteEngine On

# Handle React Router
RewriteBase /breakdown-guide/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /breakdown-guide/index.html [L]

# Enable CORS for React development
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Compress text files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF

# Create package.json for deployment platform compatibility
cat > "$DEPLOY_DIR/package.json" << EOF
{
  "name": "breakdown-guide-react-system",
  "version": "4.0.0",
  "description": "Go North East React-based Breakdown Guide - 24/31 Wizards Complete",
  "main": "index.html",
  "scripts": {
    "start": "echo 'React-based static site - no build required'",
    "build": "echo 'No build step needed - using CDN React'"
  },
  "keywords": [
    "breakdown-guide",
    "go-north-east",
    "react-wizards",
    "modular-system",
    "sdc-compliance"
  ],
  "author": "Go North East",
  "license": "ISC",
  "engines": {
    "node": ">=14.0.0"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
EOF

# Create README for deployment
cat > "$DEPLOY_DIR/README.md" << 'EOF'
# Go North East - React Breakdown Guide System

## Overview
Modern React-based modular wizard system for bus breakdown assistance.

## Current Status
- **Progress**: 24/31 wizards complete (77%)
- **Framework**: React 18 with Babel standalone
- **Styling**: Tailwind CSS via CDN
- **Pattern**: Modular wizard components

## Deployment Notes
- No build step required (uses CDN React)
- All wizards are self-contained components
- Dark theme with glassmorphism design
- Mobile-responsive interface

## Completed Wizards
- 6 Safety Critical wizards
- 3 High Priority wizards  
- 15 Operational System wizards

## Live URL
Should be accessible at: https://www.gobarry.co.uk/breakdown-guide/
EOF

echo "🎉 React Deployment package ready!"
echo "=================================="
echo ""
echo "📂 Deployment directory: $DEPLOY_DIR/"
echo "⚛️  React-based system with 24/31 wizards"
echo "🌐 Target: https://www.gobarry.co.uk/breakdown-guide/"
echo "📊 System status: Modern React modular architecture"
echo ""
echo "🚀 Next steps:"
echo "1. Upload contents of $DEPLOY_DIR/ to your web server"
echo "2. Ensure the breakdown-guide directory is accessible"
echo "3. Test React app loads correctly"
echo "4. Verify all 24 wizards are functional"