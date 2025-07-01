#!/bin/bash
# Quick fix for operations navigation issue

echo "🔧 Fixing operations navigation issue..."

# Make cache clear script executable
chmod +x clear-all-caches.sh

echo "✅ Fix applied!"
echo ""
echo "👉 Please run the following commands to fix the issue:"
echo ""
echo "1. First, clear all caches:"
echo "   ./clear-all-caches.sh"
echo ""
echo "2. When Expo starts, press 'w' to open in web browser"
echo ""
echo "3. The operations page should now work correctly!"
echo ""
echo "If you still see errors, try:"
echo "- Hard refresh the browser (Cmd+Shift+R on Mac)"
echo "- Clear browser cache"
echo "- Open in an incognito/private window"
