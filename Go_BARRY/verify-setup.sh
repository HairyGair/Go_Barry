#!/bin/bash

echo "🔍 BARRY Frontend Setup Verification"
echo "=================================="

# Check current directory
echo "📁 Current directory:"
pwd

# Check if we're in the right place
if [[ $(basename $(pwd)) == "Go_BARRY" ]]; then
    echo "✅ Correct directory: Go_BARRY"
else
    echo "❌ Wrong directory! Should be in Go_BARRY/"
    echo "Run: cd 'Go BARRY App/Go_BARRY'"
    exit 1
fi

# Check for package.json
if [[ -f "package.json" ]]; then
    echo "✅ package.json exists"
    # Check if it contains React Native deps
    if grep -q "react-native" package.json; then
        echo "✅ Contains React Native dependencies"
    else
        echo "❌ Missing React Native dependencies"
    fi
else
    echo "❌ No package.json found"
fi

# Check for App.tsx
if [[ -f "App.tsx" ]]; then
    echo "✅ App.tsx exists"
else
    echo "❌ No App.tsx found"
fi

# Check for metro.config.js
if [[ -f "metro.config.js" ]]; then
    echo "✅ metro.config.js exists"
else
    echo "⚠️  No metro.config.js (should create one)"
fi

# Check for problematic backend files
echo ""
echo "🔍 Checking for backend files in frontend:"
backend_files=$(find . -name "*.js" -path "*/backend/*" 2>/dev/null || true)
if [[ -z "$backend_files" ]]; then
    echo "✅ No backend files found in frontend"
else
    echo "❌ Found backend files:"
    echo "$backend_files"
fi

# Check node_modules
if [[ -d "node_modules" ]]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  No node_modules (run: npm install)"
fi

echo ""
echo "🚀 Next steps:"
echo "1. If any ❌ errors above, fix them first"
echo "2. Run: npm install"
echo "3. Run: npx expo start --clear"