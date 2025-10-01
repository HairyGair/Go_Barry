#!/bin/bash

# Go North East - Transfer Phase 3 Analytics to breakdown-guide-standalone
# This script copies all Phase 3 files to the correct production location

echo "🚀 Transferring Phase 3 Analytics to breakdown-guide-standalone"
echo "================================================================"

# Define source and destination paths
SOURCE="/Users/anthony/Go BARRY App/Go_BARRY/public/phase3-analytics"
DEST="/Users/anthony/Go BARRY App/breakdown-guide-standalone/frontend/phase3-analytics"

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "❌ Source directory not found: $SOURCE"
    exit 1
fi

# Create destination if it doesn't exist
if [ ! -d "$DEST" ]; then
    echo "📁 Creating destination directory..."
    mkdir -p "$DEST"
fi

echo ""
echo "📋 Transferring Phase 3 Analytics Components..."
echo "==============================================="

# Copy all Phase 3 files
cp "$SOURCE/executive-dashboard.html" "$DEST/" 2>/dev/null && echo "✅ Executive Dashboard" || echo "⚠️ Executive Dashboard not found"
cp "$SOURCE/predictive-analytics-engine.js" "$DEST/" 2>/dev/null && echo "✅ Predictive Analytics Engine" || echo "⚠️ Predictive Analytics Engine not found"
cp "$SOURCE/automated-reporting-suite.js" "$DEST/" 2>/dev/null && echo "✅ Automated Reporting Suite" || echo "⚠️ Automated Reporting Suite not found"
cp "$SOURCE/navigation-integration.js" "$DEST/" 2>/dev/null && echo "✅ Navigation Integration" || echo "⚠️ Navigation Integration not found"
cp "$SOURCE/demo.html" "$DEST/" 2>/dev/null && echo "✅ Demo Environment" || echo "⚠️ Demo Environment not found"
cp "$SOURCE/README.md" "$DEST/" 2>/dev/null && echo "✅ Documentation" || echo "⚠️ Documentation not found"

echo ""
echo "📊 Creating Phase 3 Integration Script..."
echo "========================================="

# Create integration script for standalone
cat > "$DEST/../phase3-standalone-integration.js" << 'EOF'
// Phase 3 Analytics Integration for breakdown-guide-standalone
(function() {
    'use strict';

    function initPhase3Standalone() {
        console.log('🚀 Initializing Phase 3 Analytics for Standalone');
        
        // Add navigation menu
        const navHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
                <button onclick="window.open('/frontend/phase3-analytics/executive-dashboard.html', '_blank')"
                        style="background: linear-gradient(135deg, #003d79 0%, #ce0e2d 100%); 
                               color: white; padding: 10px 20px; border: none; 
                               border-radius: 8px; font-weight: bold; cursor: pointer;">
                    📊 Analytics Dashboard
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', navHTML);
        console.log('✅ Phase 3 Analytics integrated');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhase3Standalone);
    } else {
        setTimeout(initPhase3Standalone, 1000);
    }
})();
EOF

echo "✅ Integration script created"

echo ""
echo "📊 Verification:"
echo "==============="

# Verify all files are in place
if [ -f "$DEST/executive-dashboard.html" ] && 
   [ -f "$DEST/predictive-analytics-engine.js" ] && 
   [ -f "$DEST/automated-reporting-suite.js" ] && 
   [ -f "$DEST/navigation-integration.js" ] && 
   [ -f "$DEST/demo.html" ] && 
   [ -f "$DEST/README.md" ]; then
    echo "✅ All Phase 3 components verified"
else
    echo "⚠️ Some Phase 3 components missing"
fi

echo ""
echo "🎯 Phase 3 Transfer Complete!"
echo "============================="
echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Update the main index.html in breakdown-guide-standalone to include:"
echo "   <script src='/frontend/phase3-standalone-integration.js'></script>"
echo ""
echo "2. Access Phase 3 features at:"
echo "   - Executive Dashboard: /frontend/phase3-analytics/executive-dashboard.html"
echo "   - Demo: /frontend/phase3-analytics/demo.html"
echo ""
echo "✅ Phase 3 Analytics transferred to breakdown-guide-standalone!"