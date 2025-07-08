#!/bin/bash
# Nuclear reset - completely reset the project state

echo "🔥 NUCLEAR RESET - COMPLETE PROJECT STATE RESET"
echo "==============================================="
echo ""
echo "⚠️  This will completely reset your project state!"
echo ""

# Step 1: Kill everything
echo "1️⃣ Killing all processes..."
killall node 2>/dev/null || true
killall expo 2>/dev/null || true
killall watchman 2>/dev/null || true
sleep 3

# Step 2: Remove ALL cache directories
echo ""
echo "2️⃣ Removing ALL cache directories..."
rm -rf .expo
rm -rf dist
rm -rf node_modules/.cache
rm -rf .parcel-cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/expo-*
rm -rf ~/Library/Caches/Metro

# Step 3: Clear iOS Simulator cache (if on Mac)
echo ""
echo "3️⃣ Clearing simulator caches..."
xcrun simctl shutdown all 2>/dev/null || true

# Step 4: Reset Watchman
echo ""
echo "4️⃣ Resetting Watchman completely..."
watchman watch-del-all
watchman shutdown-server

# Step 5: Clear npm cache
echo ""
echo "5️⃣ Clearing npm cache..."
npm cache clean --force

# Step 6: Create a new .expo folder
echo ""
echo "6️⃣ Creating fresh .expo folder..."
mkdir -p .expo/web/cache

echo ""
echo "✅ NUCLEAR RESET COMPLETE!"
echo ""
echo "🚀 NOW DO THIS:"
echo ""
echo "1. Close this terminal completely"
echo "2. Close ALL browser tabs"
echo "3. Quit and restart your browser"
echo "4. Open a BRAND NEW terminal"
echo "5. Navigate to: cd '/Users/anthony/Go BARRY App/Go_BARRY'"
echo "6. Run: npm start --reset-cache"
echo "7. When it opens, use an INCOGNITO/PRIVATE browser window"
echo "8. The operations centre should work!"
echo ""
echo "If you STILL see the error after this nuclear reset,"
echo "the issue is in your browser's service worker cache."
echo "In that case, go to Chrome DevTools > Application > Storage > Clear Site Data"
