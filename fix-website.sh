#!/bin/bash

echo "🚀 Fixing Go Barry website deployment..."

# Copy the built React app files from cpanel-deployment-fresh to root
echo "Copying JavaScript bundle..."
cp -r cpanel-deployment-fresh/_expo .

echo "Copying assets..."
cp cpanel-deployment-fresh/gobarry-logo.png .
cp cpanel-deployment-fresh/metadata.json .

# Copy .htaccess for proper routing
if [ -f "cpanel-deployment-fresh/.htaccess" ]; then
    echo "Copying .htaccess for routing..."
    cp cpanel-deployment-fresh/.htaccess .
fi

echo "✅ Website files copied to root directory"
echo "🌐 Your website should now load at https://gobarry.co.uk"
