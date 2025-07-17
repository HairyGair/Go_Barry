#!/bin/bash

echo "🚀 Starting Breakdown Guide Test Server..."
echo "🌡️ Testing Demisters/Heaters Wizard Integration"

# Navigate to the source directory
cd "$(dirname "$0")/src"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2"
    python -m SimpleHTTPServer 8080
else
    echo "❌ Python not found. Please install Python to run the test server."
    echo "📝 Manual testing:"
    echo "   1. Open src/index.html in your browser"
    echo "   2. Look for 'Demisters/Heaters Not Working' in the categories"
    echo "   3. Click to test the wizard"
    exit 1
fi
