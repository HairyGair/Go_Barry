#!/bin/bash
# Complete cache reset for Go BARRY

echo "🔥 COMPLETE CACHE RESET FOR GO BARRY"
echo "===================================="
echo ""

# Make script executable
chmod +x emergency-cache-clear.sh

# Step 1: Stop everything
echo "1️⃣ Stopping all processes..."
pkill -f expo || true
pkill -f metro || true
pkill -f react-native || true
pkill -f node || true
sleep 2

# Step 2: Clear all possible caches
echo ""
echo "2️⃣ Clearing all caches..."
rm -rf .expo 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf ~/Library/Caches/Metro 2>/dev/null || true

# Step 3: Reset watchman
echo ""
echo "3️⃣ Resetting watchman..."
watchman watch-del-all 2>/dev/null || true
watchman shutdown-server 2>/dev/null || true

# Step 4: Clear npm/yarn cache
echo ""
echo "4️⃣ Clearing package manager cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ COMPLETE RESET DONE!"
echo ""
echo "📋 Now follow these steps:"
echo ""
echo "1. Close ALL browser tabs with the app"
echo "2. Close your terminal"
echo "3. Open a NEW terminal"
echo "4. Navigate to: cd '/Users/anthony/Go BARRY App/Go_BARRY'"
echo "5. Run: npm start -- --clear"
echo "6. Press 'w' to open in web"
echo "7. In browser, immediately do Cmd+Shift+R (hard refresh)"
echo ""
echo "The _operations-centre-disabled error should be gone!"
