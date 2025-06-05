#!/bin/bash

echo "🚦 BARRY Mobile App Setup"
echo "========================"

# Check if we're in the right directory
cd "/Users/anthony/Go BARRY App/Go_BARRY"

echo "📦 Step 1: Installing EAS CLI..."
# Try multiple installation methods
if npm install -g eas-cli; then
    echo "✅ EAS CLI installed via npm!"
elif npm install -g @expo/cli; then
    echo "✅ Expo CLI installed (includes EAS)!"
    alias eas="npx eas"
else
    echo "⚠️ Global install failed, using npx method..."
    alias eas="npx eas-cli"
fi

echo ""

echo "🔑 Step 2: Checking Expo authentication..."
if eas whoami > /dev/null 2>&1; then
    echo "✅ Already logged in to Expo as: $(eas whoami)"
else
    echo "Please login to Expo (create account at expo.dev if needed):"
    eas login
fi

echo ""
echo "🏗️ Step 3: Configuring EAS..."
eas build:configure

echo ""
echo "🎯 Choose what to build:"
echo "1. Internal Preview (Staff access via TestFlight/Internal Testing)"
echo "2. Production Build (For App Store submission)" 
echo "3. Development APK (Direct Android installation)"
echo "4. All platforms for internal testing"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🏢 Building internal preview for all platforms..."
        eas build --platform all --profile preview
        ;;
    2)
        echo "🏪 Building production version for all platforms..."
        eas build --platform all --profile production
        ;;
    3)
        echo "🤖 Building development APK for Android..."
        eas build --platform android --profile development
        ;;
    4)
        echo "📱 Building internal preview for all platforms..."
        eas build --platform all --profile preview
        ;;
    *)
        echo "❌ Invalid choice. Building internal preview..."
        eas build --platform all --profile preview
        ;;
esac

echo ""
echo "🎉 Build started successfully!"
echo ""
echo "📋 What happens next:"
echo "• Build will take 10-20 minutes"
echo "• You'll get email notifications when complete"
echo "• Check progress at: https://expo.dev/"
echo "• iOS build will be available via TestFlight"
echo "• Android build will be available for internal testing"
echo ""
echo "📱 Distribution options:"
echo "• TestFlight: Add testers via App Store Connect"
echo "• Google Play: Add testers via Google Play Console"
echo "• Direct APK: Download and share the .apk file"
echo ""
echo "🔗 Useful links:"
echo "• Expo Dashboard: https://expo.dev/"
echo "• TestFlight: https://appstoreconnect.apple.com/"
echo "• Google Play Console: https://play.google.com/console/"
