#!/bin/bash

echo "Clearing metro bundler cache and restarting..."

# Kill any running metro processes
pkill -f "react-native start" || true
pkill -f "expo start" || true

# Clear Metro bundler cache
cd /Users/anthony/Go\ BARRY\ App/Go_BARRY
rm -rf .expo/web/cache/*
rm -rf node_modules/.cache/*
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Clear watchman if available
watchman watch-del-all 2>/dev/null || true

echo "Cache cleared. Starting app..."
npm start

