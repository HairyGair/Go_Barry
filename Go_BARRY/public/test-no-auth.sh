#!/bin/bash

echo "🚀 Testing No-Authentication Breakdown Guide"
echo
echo "✅ What was changed:"
echo "   • Removed all authentication logic from index.html"
echo "   • Modified App.js to start with isAuthenticated = true"
echo "   • Added mock supervisor session (Anthony Gair - Admin)"
echo "   • Cleaned up duplicate HTML files"
echo
echo "🌐 Test URL:"
echo "   → http://localhost:8000/breakdown-guide/index.html"
echo
echo "💡 Expected behavior:"
echo "   • Page loads directly to wizard menu (no login screen)"
echo "   • All diagnostic wizards should work"
echo "   • Fleet database search should work"
echo "   • No authentication prompts"
echo
echo "🔧 If there are any issues, check browser console for errors"
echo
echo "⚡ Starting HTTP server..."
echo "   Press Ctrl+C to stop"
echo

# Check if we're in the right directory
if [ ! -f "breakdown-guide/index.html" ]; then
    echo "❌ Error: Please run this script from the Go_BARRY/public directory"
    exit 1
fi

# Start Python HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "❌ Python not found. Please use another HTTP server."
    exit 1
fi