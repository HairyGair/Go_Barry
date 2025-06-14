#!/bin/bash

echo "🚀 Creating FRESH Go Barry deployment with latest build..."

# Remove old deployment and create fresh one
rm -rf cpanel-deployment-latest
mkdir cpanel-deployment-latest

echo "📦 Copying latest build from Go_BARRY/dist..."

# Copy the latest build files
cp -r Go_BARRY/dist/* cpanel-deployment-latest/

# Copy the proper .htaccess
cp cpanel-deployment-fresh/.htaccess cpanel-deployment-latest/

# Copy the upload guide
cp cpanel-deployment-fresh/CPANEL_UPLOAD_GUIDE.md cpanel-deployment-latest/

echo "📊 Build file sizes:"
echo "JavaScript bundle: $(du -sh cpanel-deployment-latest/_expo/static/js/web/*.js | cut -f1)"
echo "Total deployment: $(du -sh cpanel-deployment-latest | cut -f1)"

cd cpanel-deployment-latest

# Create the fresh deployment zip
zip -r ../go-barry-fresh-deployment.zip . -x '*.DS_Store' '*.map'

cd ..

ZIP_SIZE=$(du -sh go-barry-fresh-deployment.zip | cut -f1)

echo ""
echo "✅ Fresh deployment package created!"
echo "📦 File: go-barry-fresh-deployment.zip"
echo "📊 Size: $ZIP_SIZE"
echo ""
echo "🌐 Upload this to cPanel to fix your website"
