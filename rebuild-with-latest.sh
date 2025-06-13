#!/bin/bash

# Fresh build of Go BARRY with latest DisplayScreen updates
echo "🔨 Building Go BARRY with latest 50/50 display layout..."

cd "/Users/anthony/Go BARRY App/Go_BARRY"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf cpanel-build/

# Install dependencies (if needed)
echo "📦 Ensuring dependencies are up to date..."
npm install

# Build for cPanel with production optimizations
echo "🚀 Building for production (cPanel)..."
NODE_ENV=production npm run build:cpanel

# Check if build was successful
if [ -d "cpanel-build" ]; then
    echo "✅ Build successful!"
    echo "📁 Build directory: cpanel-build/"
    ls -la cpanel-build/
else
    echo "❌ Build failed - cpanel-build directory not found"
    exit 1
fi

echo "🎉 Build complete with latest DisplayScreen updates!"
