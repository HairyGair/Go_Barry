#!/bin/bash
# Fix deployment with correct API URLs
# Run this script to rebuild the app with production configuration

echo "🔧 FIXING GO BARRY DEPLOYMENT - API URL CONFIGURATION"
echo "================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "components" ]; then
  echo "❌ Error: Please run this script from the Go_BARRY directory"
  echo "   Current directory: $(pwd)"
  echo "   Expected: Go BARRY App/Go_BARRY/"
  exit 1
fi

echo "✅ Found Go BARRY frontend directory"
echo ""

# Show current configuration
echo "🔍 CURRENT CONFIGURATION:"
echo "- Environment: $(cat .env | grep EXPO_PUBLIC_API_BASE_URL || echo 'No API URL set')"
echo "- Node environment: ${NODE_ENV:-'not set'}"
echo ""

# Set production environment
echo "🌐 SETTING PRODUCTION CONFIGURATION..."
export NODE_ENV=production
export EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com

# Update .env file to force production
echo "📝 Updating .env file..."
if grep -q "EXPO_PUBLIC_API_BASE_URL" .env; then
  # Replace existing line
  sed -i.bak 's|EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com|' .env
else
  # Add new line
  echo "EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com" >> .env
fi

echo "✅ Updated .env with production API URL"
echo ""

# Clear any cached builds
echo "🧹 CLEARING BUILD CACHE..."
rm -rf .expo
rm -rf dist
rm -rf node_modules/.expo
rm -rf node_modules/.cache

echo "✅ Cleared build cache"
echo ""

# Install dependencies
echo "📦 INSTALLING DEPENDENCIES..."
npm install

echo "✅ Dependencies installed"
echo ""

# Build for production
echo "🏗️ BUILDING FOR PRODUCTION..."
echo "This may take a few minutes..."

# Use expo build web for production
npx expo export --platform web --output-dir dist

if [ $? -eq 0 ]; then
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  echo "📁 Built files are in: ./dist"
  echo "🌐 API URL configured: https://go-barry.onrender.com"
  echo ""
  echo "🚀 NEXT STEPS:"
  echo "1. Upload the contents of ./dist to your web server"
  echo "2. Update your domain (gobarry.co.uk) to point to the new files"
  echo "3. Test supervisor login and verify no localhost errors"
  echo ""
  echo "🔧 If you're using cPanel or file manager:"
  echo "   - Delete all files in public_html"
  echo "   - Upload everything from ./dist to public_html"
  echo "   - Make sure .htaccess is included for proper routing"
  echo ""
else
  echo "❌ BUILD FAILED!"
  echo "Please check the error messages above"
  echo ""
  echo "💡 TROUBLESHOOTING:"
  echo "1. Make sure you have npm and expo-cli installed"
  echo "2. Check that all dependencies are installed correctly"
  echo "3. Verify your .env file contains the correct API URL"
  echo ""
  exit 1
fi

echo "🎉 DEPLOYMENT FIX COMPLETE!"
echo "The app should now use https://go-barry.onrender.com for all API calls"