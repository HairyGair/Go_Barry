#!/bin/bash

# BARRY Mobile App Distribution Setup
echo "🚦 BARRY Mobile App Distribution Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "Go_BARRY/app.json" ]; then
    echo "❌ Please run this script from the root directory (Go BARRY App)"
    exit 1
fi

cd Go_BARRY

echo "📱 Setting up mobile app distribution..."

# Install EAS CLI if not installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Check if logged in to Expo
echo "🔑 Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "Please login to Expo:"
    eas login
fi

echo ""
echo "🎯 Choose distribution method:"
echo "1. Internal Distribution (TestFlight/Internal Testing)"
echo "2. Production Build (App Stores)"
echo "3. Development Build (Direct APK)"
echo "4. Web PWA (Already configured)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🏢 Building for internal distribution..."
        echo "📱 Building iOS for TestFlight..."
        eas build --platform ios --profile preview --non-interactive
        echo ""
        echo "🤖 Building Android for Internal Testing..."
        eas build --platform android --profile preview --non-interactive
        echo ""
        echo "✅ Internal builds complete!"
        echo "📧 Check your email for build notifications"
        echo "🔗 TestFlight and Google Play Console links will be provided"
        ;;
    2)
        echo "🏪 Building for App Store distribution..."
        echo "📱 Building iOS for App Store..."
        eas build --platform ios --profile production --non-interactive
        echo ""
        echo "🤖 Building Android for Google Play..."
        eas build --platform android --profile production --non-interactive
        echo ""
        echo "✅ Production builds complete!"
        echo "📧 Check your email for build notifications"
        echo "📋 Next steps:"
        echo "   1. Download builds from Expo dashboard"
        echo "   2. Upload to App Store Connect / Google Play Console"
        echo "   3. Submit for review"
        ;;
    3)
        echo "🔧 Building development APK..."
        eas build --platform android --profile development --non-interactive
        echo ""
        echo "✅ Development APK complete!"
        echo "📧 Check your email for download link"
        echo "📱 Share APK file for direct installation"
        ;;
    4)
        echo "🌐 Web PWA is already configured!"
        echo "📋 To deploy web version:"
        echo "   1. npm run build:web"
        echo "   2. Deploy dist/ folder to Render"
        echo "   3. Users can access at: https://barry-frontend.onrender.com"
        echo "   4. Users can 'Add to Home Screen' for app-like experience"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Distribution setup complete!"
echo ""
echo "📋 Access Methods Summary:"
echo "────────────────────────────"
echo "🌐 Web: https://barry-frontend.onrender.com (PWA)"
echo "📱 iOS: TestFlight → App Store"
echo "🤖 Android: Internal Testing → Google Play"
echo "📦 Direct: APK download for Android"
echo ""
echo "📊 Monitor builds at: https://expo.dev/"
echo "📱 Manage app at: https://expo.dev/accounts/[your-account]/projects/barry-traffic"
