#!/bin/bash

# Simple launcher for location capture test
echo "🚀 Opening Location Capture Test Page..."
echo ""

# Check if file exists
if [ -f "test-location-capture.html" ]; then
    echo "✅ Test file found"
    echo "📍 Opening in browser..."
    
    # Try different methods to open
    if command -v open &> /dev/null; then
        open test-location-capture.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open test-location-capture.html
    elif command -v start &> /dev/null; then
        start test-location-capture.html
    else
        echo "Please open manually: test-location-capture.html"
    fi
    
    echo ""
    echo "📝 Test Instructions:"
    echo "1. Enter fleet number (e.g., 6301)"
    echo "2. Click 'Start Breakdown Report'"
    echo "3. Try What3Words: cafe.pulse.risky"
    echo "4. Or select Gateshead depot"
    echo "5. Or choose Newcastle Central Station"
    echo ""
    echo "✨ The captured location data will appear below the form"
else
    echo "❌ File not found!"
    echo "Expected location: $(pwd)/test-location-capture.html"
    echo ""
    echo "Try running from the Go BARRY App directory:"
    echo "  cd '/Users/anthony/Go BARRY App'"
    echo "  ./open-location-test.sh"
fi