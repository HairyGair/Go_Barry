#!/bin/bash
# Make this script executable: chmod +x setup-git-config.sh

# Set up git config
echo "🔧 Setting up git configuration..."

git config --global user.name "Anthony Gair"
git config --global user.email "anthonygair@icloud.com"

echo "✅ Git config updated!"
echo ""
git config --global --list | grep user

echo ""
echo "✅ Future commits will use your correct identity"
