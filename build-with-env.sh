#!/bin/bash
# build-with-env.sh - Build script that ensures environment variables are included

echo "🚀 Building Go BARRY with environment variables..."

# Load environment variables
if [ -f .env ]; then
  echo "📋 Loading .env file..."
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "⚠️ No .env file found"
fi

# Show loaded environment variables (masked)
echo "🔍 Environment check:"
echo "   EXPO_PUBLIC_API_BASE_URL: ${EXPO_PUBLIC_API_BASE_URL:-not set}"
echo "   EXPO_PUBLIC_TOMTOM_API_KEY: ${EXPO_PUBLIC_TOMTOM_API_KEY:0:8}..."
echo "   NODE_ENV: ${NODE_ENV:-development}"

# Clean cache
echo "🧹 Clearing Expo cache..."
npx expo start -c &
EXPO_PID=$!
sleep 5
kill $EXPO_PID 2>/dev/null

# Build for web
echo "🏗️ Building for web..."
NODE_ENV=production npx expo export --platform web --output-dir dist

# Verify build
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful!"
  echo "📁 Output in: dist/"
  
  # Check if environment variables made it into the build
  if grep -q "EXPO_PUBLIC_TOMTOM_API_KEY" dist/*.js 2>/dev/null; then
    echo "✅ Environment variables included in build"
  else
    echo "⚠️ Warning: Environment variables may not be in build"
  fi
else
  echo "❌ Build failed!"
  exit 1
fi

echo "🎉 Done! Deploy the 'dist' folder to your web server."
