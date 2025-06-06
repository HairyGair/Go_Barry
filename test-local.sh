#!/bin/bash
# Quick Local Test for Go Barry Display

echo "🚦 Testing Go Barry Display Locally"
echo "==================================="

# Check if display.html exists
if [ -f "/Users/anthony/Go BARRY App/display.html" ]; then
    echo "✅ display.html found"
    
    # Open in default browser
    echo "🌐 Opening display in browser..."
    open "/Users/anthony/Go BARRY App/display.html"
    
    echo ""
    echo "🎯 Local Test Instructions:"
    echo "=========================="
    echo "1. Browser should have opened with your display"
    echo "2. Check if the display loads properly"
    echo "3. Watch the console (F12) for any errors"
    echo "4. Verify it connects to: https://go-barry.onrender.com"
    echo ""
    echo "If it works locally, the issue is with uploading to your website."
    echo "If it doesn't work locally, we need to fix the file first."
    
else
    echo "❌ display.html not found"
    echo "Please run this script from the Go BARRY App directory"
fi

echo ""
echo "📊 Backend Status Check:"
echo "======================="
echo "Testing connection to your backend..."

# Test backend connection
curl -s "https://go-barry.onrender.com/api/status" | head -n 5

echo ""
echo "🔍 Next Steps:"
echo "=============="
echo "1. Test the local display first"
echo "2. If it works, we know the file is good"
echo "3. Then we focus on uploading it correctly"
echo "4. Tell me what hosting platform you're using for gobarry.co.uk"
