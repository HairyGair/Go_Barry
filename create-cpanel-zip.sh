#!/bin/bash

echo "📦 Creating cPanel deployment ZIP..."

cd "/Users/anthony/Go BARRY App/Go_BARRY"

# Remove any existing deployment zip
rm -f gobarry-cpanel-deployment-fresh.zip

# Create fresh zip from cpanel-build contents
cd cpanel-build
zip -r ../gobarry-cpanel-deployment-fresh.zip . -x '*.DS_Store' '*.map'

cd ..
echo "✅ Created: gobarry-cpanel-deployment-fresh.zip"
echo ""
echo "📋 Contents:"
unzip -l gobarry-cpanel-deployment-fresh.zip

echo ""
echo "🎯 Upload this file to your cPanel File Manager!"
