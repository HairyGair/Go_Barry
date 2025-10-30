#!/bin/bash

# Create Deployment Zip for cPanel Upload
# This script creates a clean zip file ready for cPanel deployment

echo "📦 Creating deployment package for cPanel..."

# Set deployment directory name
DEPLOY_DIR="gobarry-backend-deploy"
ZIP_NAME="gobarry-backend.zip"

# Remove old deployment directory if it exists
rm -rf "$DEPLOY_DIR"
rm -f "$ZIP_NAME"

# Create fresh deployment directory
mkdir -p "$DEPLOY_DIR"

echo "📋 Copying essential files..."

# Copy essential files
cp server.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/.env"

# Copy directories
echo "📁 Copying directories..."
cp -r config "$DEPLOY_DIR/"
cp -r routes "$DEPLOY_DIR/"
cp -r services "$DEPLOY_DIR/"
cp -r middleware "$DEPLOY_DIR/"
cp -r utils "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/"

# Copy data directory (if exists)
if [ -d "data" ]; then
  cp -r data "$DEPLOY_DIR/"
fi

# Create README for deployment
cat > "$DEPLOY_DIR/DEPLOYMENT_README.txt" << 'EOF'
Go BARRY Backend - cPanel Deployment Package
=============================================

INSTALLATION INSTRUCTIONS:

1. Upload this entire folder to your cPanel home directory
2. In cPanel, go to "Setup Node.js App"
3. Create new application:
   - Application root: gobarry-backend-deploy
   - Application startup file: server.js
   - Node.js version: 18.x or higher
4. Click "Run NPM Install"
5. Update .env file with your settings (already configured)
6. Click "Start App"
7. Test at: https://your-domain.com/health

MySQL Configuration:
- Database: gobarryco_breakdown
- Host: localhost (on cPanel)
- User: gobarryco_Gair

For detailed instructions, see CPANEL_DEPLOYMENT_GUIDE.md

Created: $(date)
EOF

# Create zip file
echo "🗜️ Creating zip archive..."
cd "$DEPLOY_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

# Clean up deployment directory
rm -rf "$DEPLOY_DIR"

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📦 File: $ZIP_NAME"
echo "📏 Size: $(du -h "$ZIP_NAME" | cut -f1)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload $ZIP_NAME to cPanel File Manager"
echo "   2. Extract the zip file"
echo "   3. Follow instructions in CPANEL_DEPLOYMENT_GUIDE.md"
echo ""
