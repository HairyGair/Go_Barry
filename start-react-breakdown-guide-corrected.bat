@echo off
echo 🚀 Starting React Breakdown Guide Development Server...
echo.

REM Navigate to the correct directory
cd /d "C:\Users\anthony\Go BARRY App\breakdown-guide" 2>nul
if not exist package.json (
    cd /d "%~dp0breakdown-guide" 2>nul
)

if not exist package.json (
    echo ❌ Error: Cannot find breakdown-guide directory with package.json
    echo Please ensure you're running this from the correct location
    pause
    exit /b 1
)

echo 📍 Located breakdown-guide directory

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🔄 Starting React development server...
echo 📖 The breakdown guide will be available at: http://localhost:3000
echo.
echo 🎯 Look for 'Repeat Defects' in the category list!
echo    - It should appear with a 🔄 icon
echo    - Listed as 'warning' severity (amber/orange color)
echo    - Will have 4-step wizard for escalation procedures
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Start the development server
npm start
