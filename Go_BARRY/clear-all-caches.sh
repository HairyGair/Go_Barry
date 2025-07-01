#!/bin/bash
# Clear all caches and restart Expo

echo "🧹 Clearing all caches for Go BARRY..."

# Stop any running Expo processes
echo "📱 Stopping Expo processes..."
pkill -f expo || true
pkill -f react-native || true
pkill -f metro || true

# Clear various caches
echo "🗑️  Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true

echo "🗑️  Clearing Expo cache..."
rm -rf .expo/web/cache/* 2>/dev/null || true

echo "🗑️  Clearing dist folder..."
rm -rf dist/* 2>/dev/null || true

echo "🗑️  Clearing watchman watches..."
watchman watch-del-all 2>/dev/null || true

echo "✅ All caches cleared!"
echo ""
echo "📱 Starting Expo with clear cache..."
echo "Press Ctrl+C when you see 'Logs for your project will appear below'"
echo ""

# Start Expo with clear cache
npx expo start --clear
