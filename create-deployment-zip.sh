#!/bin/bash

echo "📦 Creating clean Go BARRY deployment package..."

# Create a clean zip without the problematic large files
cd "Go_BARRY"

# Create deployment zip
zip -r "../go-barry-enhanced-display.zip" . \
  -x "*.DS_Store" \
  -x "node_modules/*" \
  -x ".expo/*" \
  -x "*.log"

cd ..

echo "✅ Created: go-barry-enhanced-display.zip"
echo ""
echo "🚀 DEPLOY NOW:"
echo "1. Upload go-barry-enhanced-display.zip to cPanel"
echo "2. Extract to public_html at gobarry.co.uk"
echo "3. Your enhanced display will be live!"
echo ""
echo "🎯 What's included:"
echo "   ✅ Fixed alert card layout"
echo "   ✅ No more text overlapping"  
echo "   ✅ Professional control room design"
echo "   ✅ Geographic route filtering"
echo ""
echo "File ready: $(ls -lh go-barry-enhanced-display.zip)"
