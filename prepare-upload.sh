#!/bin/bash
# Go Barry Control Room Display - Upload Preparation Script

echo "🚦 Go Barry Control Room Display - Upload Preparation"
echo "=================================================="

# Create upload directory
UPLOAD_DIR="/Users/anthony/Go BARRY App/upload-ready"
mkdir -p "$UPLOAD_DIR"

echo "📁 Preparing files for upload..."

# Copy the display file
if [ -f "/Users/anthony/Go BARRY App/display.html" ]; then
    cp "/Users/anthony/Go BARRY App/display.html" "$UPLOAD_DIR/"
    echo "✅ display.html copied"
else
    echo "❌ display.html not found"
fi

# Copy the logo file
if [ -f "/Users/anthony/Go BARRY App/gobarry-logo.png" ]; then
    cp "/Users/anthony/Go BARRY App/gobarry-logo.png" "$UPLOAD_DIR/"
    echo "✅ gobarry-logo.png copied"
else
    echo "❌ gobarry-logo.png not found"
fi

# Copy deployment guide
if [ -f "/Users/anthony/Go BARRY App/DEPLOYMENT_GUIDE.md" ]; then
    cp "/Users/anthony/Go BARRY App/DEPLOYMENT_GUIDE.md" "$UPLOAD_DIR/"
    echo "✅ DEPLOYMENT_GUIDE.md copied"
fi

echo ""
echo "🎯 Upload Ready Files:"
echo "======================"
ls -la "$UPLOAD_DIR"

echo ""
echo "📤 Upload Instructions:"
echo "======================"
echo "1. Upload these 2 files to your website root (public_html):"
echo "   - display.html"
echo "   - gobarry-logo.png"
echo ""
echo "2. Access your display at:"
echo "   https://gobarry.co.uk/display.html"
echo ""
echo "3. The display will automatically connect to:"
echo "   https://go-barry.onrender.com (your backend)"
echo ""
echo "📁 Files ready in: $UPLOAD_DIR"
echo "🚀 Your Go Barry Control Room Display is ready for deployment!"
