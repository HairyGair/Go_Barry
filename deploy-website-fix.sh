#!/bin/bash

echo "🚀 Creating Go Barry cPanel deployment package..."

# Create fresh deployment package
cd cpanel-deployment-fresh

# Create the deployment zip
zip -r ../go-barry-website-fix.zip . -x '*.DS_Store' '*.map'

cd ..

echo "✅ Deployment package created: go-barry-website-fix.zip"
echo ""
echo "📦 To fix your website:"
echo "1. Log into your cPanel"
echo "2. Open File Manager → public_html"
echo "3. Upload go-barry-website-fix.zip"
echo "4. Extract the zip file"
echo "5. Overwrite existing files"
echo ""
echo "🌐 Your fixed website will be live at: https://gobarry.co.uk"
