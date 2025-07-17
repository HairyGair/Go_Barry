#!/bin/bash

echo "🚀 Starting React Breakdown Guide Development Server..."
echo ""

# Navigate to the correct directory
cd "/Users/anthony/Go BARRY App/breakdown-guide"

# Check if we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "Expected to find package.json in breakdown-guide directory"
    exit 1
fi

echo "📍 Located breakdown-guide directory"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🔄 Starting React development server..."
echo "📖 The breakdown guide will be available at: http://localhost:3000"
echo ""
echo "🎯 Look for 'Repeat Defects' in the category list!"
echo "   - It should appear with a 🔄 icon"
echo "   - Listed as 'warning' severity (amber/orange color)"
echo "   - Will have 4-step wizard for escalation procedures"
echo ""
echo "Press Ctrl+C to stop the server when done."
echo ""

# Start the development server
npm start
