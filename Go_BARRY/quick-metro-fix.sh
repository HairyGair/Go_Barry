#!/bin/bash
# Quick fix - Force Metro to see new files

echo "🔧 Quick Fix - Force Metro Cache Reset"
echo "====================================="
echo ""

# Step 1: Stop everything
echo "Stopping all processes..."
pkill -f expo || true
pkill -f metro || true
pkill -f node || true

# Step 2: Remove Metro cache only
echo "Clearing Metro cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Step 3: Touch all files to update timestamps
echo "Updating file timestamps..."
find app/operations-centre -name "*.jsx" -exec touch {} \;
find app/operations-centre -name "*.js" -exec touch {} \;

# Step 4: Start with specific cache clear
echo ""
echo "✅ Quick fix applied!"
echo ""
echo "Now run:"
echo "  npx react-native start --reset-cache"
echo ""
echo "Or if using Expo:"
echo "  npx expo start -c"
echo ""
echo "The -c flag forces a cache clear."
