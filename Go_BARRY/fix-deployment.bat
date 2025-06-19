@echo off
REM Fix deployment with correct API URLs
REM Run this script to rebuild the app with production configuration

echo 🔧 FIXING GO BARRY DEPLOYMENT - API URL CONFIGURATION
echo =================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
  echo ❌ Error: Please run this script from the Go_BARRY directory
  echo    Current directory: %cd%
  echo    Expected: Go BARRY App\Go_BARRY\
  pause
  exit /b 1
)

if not exist "components" (
  echo ❌ Error: Please run this script from the Go_BARRY directory
  echo    Current directory: %cd%
  echo    Expected: Go BARRY App\Go_BARRY\
  pause
  exit /b 1
)

echo ✅ Found Go BARRY frontend directory
echo.

REM Show current configuration
echo 🔍 CURRENT CONFIGURATION:
findstr "EXPO_PUBLIC_API_BASE_URL" .env 2>nul || echo - No API URL set in .env
echo.

REM Set production environment
echo 🌐 SETTING PRODUCTION CONFIGURATION...
set NODE_ENV=production
set EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com

REM Update .env file to force production
echo 📝 Updating .env file...
echo EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com > .env.new
echo EXPO_PUBLIC_SUPABASE_URL=https://haountnqhecfrsonivbq.supabase.co >> .env.new
echo EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs >> .env.new
echo EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iZ29hOHJsMDB4djJtc2I5c2trbXA3dSJ9.1WxDF7rvXOycZyC5EwNS0A >> .env.new
echo EXPO_PUBLIC_TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp >> .env.new

move .env .env.backup 2>nul
move .env.new .env

echo ✅ Updated .env with production API URL
echo.

REM Clear any cached builds
echo 🧹 CLEARING BUILD CACHE...
if exist ".expo" rmdir /s /q ".expo"
if exist "dist" rmdir /s /q "dist"
if exist "node_modules\.expo" rmdir /s /q "node_modules\.expo"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo ✅ Cleared build cache
echo.

REM Install dependencies
echo 📦 INSTALLING DEPENDENCIES...
call npm install

echo ✅ Dependencies installed
echo.

REM Build for production
echo 🏗️ BUILDING FOR PRODUCTION...
echo This may take a few minutes...

call npx expo export --platform web --output-dir dist

if %errorlevel% equ 0 (
  echo ✅ BUILD SUCCESSFUL!
  echo.
  echo 📁 Built files are in: .\dist
  echo 🌐 API URL configured: https://go-barry.onrender.com
  echo.
  echo 🚀 NEXT STEPS:
  echo 1. Upload the contents of .\dist to your web server
  echo 2. Update your domain ^(gobarry.co.uk^) to point to the new files
  echo 3. Test supervisor login and verify no localhost errors
  echo.
  echo 🔧 If you're using cPanel or file manager:
  echo    - Delete all files in public_html
  echo    - Upload everything from .\dist to public_html
  echo    - Make sure .htaccess is included for proper routing
  echo.
) else (
  echo ❌ BUILD FAILED!
  echo Please check the error messages above
  echo.
  echo 💡 TROUBLESHOOTING:
  echo 1. Make sure you have npm and expo-cli installed
  echo 2. Check that all dependencies are installed correctly
  echo 3. Verify your .env file contains the correct API URL
  echo.
  pause
  exit /b 1
)

echo 🎉 DEPLOYMENT FIX COMPLETE!
echo The app should now use https://go-barry.onrender.com for all API calls
pause