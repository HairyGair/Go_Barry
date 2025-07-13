#!/bin/bash

# Quick Fix Implementation Script for Breakdown Guide
# This script applies all the necessary fixes

echo "🔧 Applying Breakdown Guide Fixes..."
echo "=================================="

# Backup original files
echo "📁 Creating backups..."
if [ -f "src/data/diagnostic-flows.js" ]; then
    cp "src/data/diagnostic-flows.js" "src/data/diagnostic-flows.js.backup"
    echo "✅ Backed up diagnostic-flows.js"
fi

if [ -f "src/index.html" ]; then
    cp "src/index.html" "src/index.html.backup"
    echo "✅ Backed up index.html"
fi

# Update index.html to load fixed files
echo "🔄 Updating index.html..."
if [ -f "src/index.html" ]; then
    # Replace the diagnostic-flows.js reference
    sed -i.tmp 's/data\/diagnostic-flows\.js?v=3\.0/data\/diagnostic-flows-fixed.js?v=4.1/g' src/index.html
    
    # Add the integration fix script after wizard-engine.js
    sed -i.tmp '/wizard-engine\.js/a\
    <script src="app-integration-fix.js?v=1.0"></script>' src/index.html
    
    # Clean up temporary file
    rm src/index.html.tmp
    echo "✅ Updated index.html"
else
    echo "❌ index.html not found"
fi

# Verify fixed files exist
echo "🔍 Verifying fixed files..."
if [ -f "src/data/diagnostic-flows-fixed.js" ]; then
    echo "✅ diagnostic-flows-fixed.js exists"
else
    echo "❌ diagnostic-flows-fixed.js missing - please copy the fixed flows file"
fi

if [ -f "src/app-integration-fix.js" ]; then
    echo "✅ app-integration-fix.js exists"
else
    echo "❌ app-integration-fix.js missing - please copy the integration fix file"
fi

echo ""
echo "🎉 Fix Implementation Complete!"
echo "================================"
echo ""
echo "Next Steps:"
echo "1. Open src/index.html in your browser"
echo "2. Check console for 'Fixed Diagnostic Flows loaded' message"
echo "3. Test the breakdown guide functionality"
echo ""
echo "If you encounter issues:"
echo "- Check browser console for errors"
echo "- Clear browser cache (Ctrl+F5)"
echo "- Verify all files are in correct locations"
echo ""
echo "Backup files created:"
echo "- src/data/diagnostic-flows.js.backup"
echo "- src/index.html.backup"
