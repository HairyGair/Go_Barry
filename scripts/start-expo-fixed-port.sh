#!/bin/bash
# Make this file executable with: chmod +x scripts/start-expo-fixed-port.sh

echo "🚀 Starting Go BARRY with explicit port configuration"
echo "=================================================="
echo ""

PORT=${1:-8081}

echo "Starting Expo on port $PORT..."
echo ""

cd Go_BARRY

# Kill any existing Expo processes
echo "Stopping any existing Expo instances..."
pkill -f expo || true
pkill -f react-native || true

# Clear cache and start fresh
echo "Starting fresh Expo server..."
npx expo start --web --port $PORT --clear

echo ""
echo "Once Expo is running, update your tests:"
echo "  node ../scripts/update-test-port.js $PORT"
