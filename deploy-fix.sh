#!/bin/bash

# Backup and Deploy React Breakdown Guide
# This script helps deploy the React-based breakdown guide safely

echo "🚨 URGENT: Breakdown Guide Deployment Fix"
echo "=========================================="

# Check if deployment package exists
if [ ! -d "breakdown-guide-react-deploy" ]; then
    echo "❌ Error: breakdown-guide-react-deploy directory not found"
    echo "Please run this script from the Go BARRY App root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "✅ React deployment package found"
echo "✅ Contains ${#$(find breakdown-guide-react-deploy -type f)} files"

echo ""
echo "📦 Files ready for deployment:"
find breakdown-guide-react-deploy -type f | sed 's/breakdown-guide-react-deploy\///' | sort

echo ""
echo "🚀 Next Steps:"
echo "1. Access your web server (FTP/cPanel/File Manager)"
echo "2. Navigate to the breakdown-guide directory"
echo "3. Backup existing files (rename to breakdown-guide-old)"
echo "4. Upload all files from breakdown-guide-react-deploy/"
echo "5. Maintain exact directory structure"
echo "6. Test: https://www.gobarry.co.uk/breakdown-guide/"

echo ""
echo "🎯 Expected Result:"
echo "- Dark React interface with Go BARRY branding"
echo "- Progress: 24/31 Wizards Complete (77%)"
echo "- No more 'Unmatched Route' error"

echo ""
echo "⚠️  CRITICAL: The current 'Unmatched Route' error blocks access"
echo "    to the breakdown guide system that drivers need."

# Create a compressed archive for easy upload
echo ""
echo "📄 Creating deployment archive..."
cd breakdown-guide-react-deploy
tar -czf ../breakdown-guide-deployment.tar.gz .
cd ..

echo "✅ Created: breakdown-guide-deployment.tar.gz"
echo "   You can upload and extract this on your server"

echo ""
echo "🔧 Server Commands (if you have SSH access):"
echo "   cd /path/to/your/website/breakdown-guide/"
echo "   mv * ../breakdown-guide-backup/ (backup existing files)"
echo "   tar -xzf breakdown-guide-deployment.tar.gz"
echo "   chmod 644 .htaccess"

echo ""
echo "✨ Deployment package ready for upload!"