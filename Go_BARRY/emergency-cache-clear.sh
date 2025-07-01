#!/bin/bash
# Emergency cache clear script

echo "🚨 Emergency Cache Clear for Operations Centre"
echo ""
echo "Stopping all Metro/Expo processes..."
pkill -f expo || true
pkill -f metro || true
pkill -f react-native || true

echo ""
echo "Clearing ALL caches..."
rm -rf .expo/web/cache/* 2>/dev/null || true
rm -rf dist/* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo ""
echo "Clearing watchman..."
watchman watch-del-all 2>/dev/null || true

echo ""
echo "✅ All caches cleared!"
echo ""
echo "Now run:"
echo "  npm start -- --clear"
echo ""
echo "This will start Expo with a completely fresh cache."
echo "When it opens in browser, do a hard refresh (Cmd+Shift+R)"
