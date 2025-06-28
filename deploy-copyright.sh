#!/bin/bash
# Make this script executable: chmod +x deploy-copyright.sh

# Set up git config
echo "🔧 Setting up git configuration..."
git config --global user.name "Anthony Gair"
git config --global user.email "anthonygair@icloud.com"

echo "✅ Git config updated!"

# Deploy copyright updates
echo "📝 Deploying copyright updates..."

# Check if we're in the right directory
if [ ! -f "Go_BARRY/package.json" ]; then
    echo "❌ Error: Must run from Go BARRY App root directory"
    exit 1
fi

echo "📦 Creating deployment commit..."
git add -A
git commit -m "Update copyright to Anthony Gair ownership

- Removed 'Go North East' from all copyright notices
- Updated to '© 2024-2025 Anthony Gair. All rights reserved.'
- Updated LICENSE file to reflect sole ownership
- Updated README.md with personal copyright
- Updated all package.json files
- Updated source code headers"

echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Copyright updates deployed!"
echo ""
echo "🔄 Changes will be live after Render.com auto-deploy (~2-3 minutes)"
echo ""
echo "📋 Copyright now shows:"
echo "  © 2024-2025 Anthony Gair. All rights reserved."
echo ""
echo "Your intellectual property rights are now properly reflected throughout the application."
