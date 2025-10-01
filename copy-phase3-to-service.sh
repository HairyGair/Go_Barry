#!/bin/bash

# Go North East - Copy Phase 3 Analytics to Breakdown Guide Service
# This script copies all Phase 3 components to the production service

echo "🚀 Copying Phase 3 Analytics to Breakdown Guide Service"
echo "========================================================"

# Define source and destination paths
SOURCE_DIR="/Users/anthony/Go BARRY App/Go_BARRY/public/phase3-analytics"
DEST_DIR="/Users/anthony/Go BARRY App/breakdown-guide-service/public/phase3-analytics"

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Create destination if it doesn't exist
if [ ! -d "$DEST_DIR" ]; then
    echo "📁 Creating destination directory..."
    mkdir -p "$DEST_DIR"
fi

echo ""
echo "📋 Copying Phase 3 components..."

# Copy all Phase 3 files
for file in "executive-dashboard.html" "predictive-analytics-engine.js" "automated-reporting-suite.js" "demo.html" "README.md"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        cp "$SOURCE_DIR/$file" "$DEST_DIR/"
        if [ $? -eq 0 ]; then
            echo "✅ Copied: $file"
        else
            echo "❌ Failed to copy: $file"
        fi
    else
        echo "⚠️ Not found in source: $file"
    fi
done

# The navigation-integration.js was already updated for the service
echo "✅ Navigation integration already updated for service context"

echo ""
echo "📊 Verification:"
echo "==============="

# Verify all files are in place
REQUIRED_FILES=(
    "executive-dashboard.html"
    "predictive-analytics-engine.js" 
    "automated-reporting-suite.js"
    "navigation-integration.js"
    "demo.html"
    "README.md"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$DEST_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        ALL_PRESENT=false
    fi
done

echo ""
if [ "$ALL_PRESENT" = true ]; then
    echo "🎉 SUCCESS! Phase 3 Analytics fully integrated into breakdown-guide-service"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start the breakdown-guide-service:"
    echo "   cd /Users/anthony/Go BARRY App/breakdown-guide-service"
    echo "   npm start"
    echo ""
    echo "2. Access Phase 3 features:"
    echo "   - Executive Dashboard: http://localhost:3001/phase3-analytics/executive-dashboard.html"
    echo "   - Demo Environment: http://localhost:3001/phase3-analytics/demo.html"
    echo ""
    echo "3. Integration points:"
    echo "   - The navigation-integration.js will add Phase 3 menu items to guide.html"
    echo "   - API endpoints are available at /api/phase3-analytics/*"
    echo ""
    echo "✅ Phase 3 is now part of the production breakdown-guide-service!"
else
    echo "⚠️ Some files are missing. Please check and copy manually if needed."
fi