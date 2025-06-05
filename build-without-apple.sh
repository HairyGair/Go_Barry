#!/bin/bash

echo "🚦 BARRY Distribution (No Apple Account Needed)"
echo "==============================================="

cd "/Users/anthony/Go BARRY App/Go_BARRY"

echo "🤖 Building Android app..."
npx eas-cli build --platform android --profile preview

echo ""
echo "🌐 Building web PWA..."
npm run build:web

echo ""
echo "🎉 Build complete!"
echo ""
echo "📱 Distribution methods:"
echo "• Android: Download APK from Expo dashboard"
echo "• iOS: Deploy web version, users 'Add to Home Screen'"
echo "• Desktop: Web dashboard access"
echo ""
echo "🔗 Next steps:"
echo "1. Check Expo dashboard for Android APK download"
echo "2. Deploy web version to Render"
echo "3. Share links with users"
echo ""
echo "📋 Access URLs:"
echo "• Android APK: Check your email for download link"
echo "• Web PWA: https://barry-frontend.onrender.com (after deployment)"
echo "• Backend API: https://go-barry.onrender.com"
echo ""
echo "💡 iOS users can use the web version - it works just like a native app!"
