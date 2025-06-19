#!/bin/bash
# Build Go BARRY frontend for cPanel deployment

echo "🚀 Building Go BARRY for cPanel deployment..."

cd "Go_BARRY"

# Clean previous build
rm -rf dist/

# Build for web
echo "📦 Building web app..."
npx expo export:web

# Check if build succeeded
if [ -d "dist" ]; then
    echo "✅ Build successful! Files are in Go_BARRY/dist/"
    echo "📁 Upload the contents of Go_BARRY/dist/ to your cPanel public_html folder"
    echo "🔗 Backend URL: https://go-barry.onrender.com"
else
    echo "❌ Build failed!"
    exit 1
fi
