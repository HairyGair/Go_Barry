#!/bin/bash

# Go North East - Transfer Phase 2 Components to breakdown-guide-standalone
# This script copies all Phase 2 files to the correct production location

echo "🚀 Transferring Phase 2 Components to breakdown-guide-standalone"
echo "================================================================"

# Define source and destination paths
SOURCE="/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/breakdown-guide"
DEST="/Users/anthony/Go BARRY App/breakdown-guide-standalone/frontend/breakdown-guide"

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "❌ Source directory not found: $SOURCE"
    exit 1
fi

# Check if destination exists
if [ ! -d "$DEST" ]; then
    echo "❌ Destination directory not found: $DEST"
    exit 1
fi

echo ""
echo "📋 Transferring Phase 2 Priority 1: Mobile UI Components..."
echo "==========================================================="

# Priority 1: Mobile UI
cp "$SOURCE/components/common/MobileEnhancements.js" "$DEST/components/common/" 2>/dev/null && echo "✅ MobileEnhancements.js" || echo "⚠️ MobileEnhancements.js not found"
cp "$SOURCE/components/wizards/MobileBrakesWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ MobileBrakesWizard.js" || echo "⚠️ MobileBrakesWizard.js not found"
cp "$SOURCE/components/wizards/MobileGeneralAssessmentWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ MobileGeneralAssessmentWizard.js" || echo "⚠️ MobileGeneralAssessmentWizard.js not found"
cp "$SOURCE/components/wizards/MobileSteeringWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ MobileSteeringWizard.js" || echo "⚠️ MobileSteeringWizard.js not found"
cp "$SOURCE/components/MobileIntegration.js" "$DEST/components/" 2>/dev/null && echo "✅ MobileIntegration.js" || echo "⚠️ MobileIntegration.js not found"
cp "$SOURCE/mobile-demo.html" "$DEST/" 2>/dev/null && echo "✅ mobile-demo.html" || echo "⚠️ mobile-demo.html not found"

echo ""
echo "📋 Transferring Phase 2 Priority 2: PWA Features..."
echo "===================================================="

# Priority 2: PWA
cp "$SOURCE/sw.js" "$DEST/" 2>/dev/null && echo "✅ sw.js (Service Worker)" || echo "⚠️ sw.js not found"
cp "$SOURCE/manifest.json" "$DEST/" 2>/dev/null && echo "✅ manifest.json" || echo "⚠️ manifest.json not found"
cp "$SOURCE/components/PWAManager.js" "$DEST/components/" 2>/dev/null && echo "✅ PWAManager.js" || echo "⚠️ PWAManager.js not found"
cp "$SOURCE/components/wizards/OfflineSteeringWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ OfflineSteeringWizard.js" || echo "⚠️ OfflineSteeringWizard.js not found"
cp "$SOURCE/offline.html" "$DEST/" 2>/dev/null && echo "✅ offline.html" || echo "⚠️ offline.html not found"
cp "$SOURCE/pwa-demo.html" "$DEST/" 2>/dev/null && echo "✅ pwa-demo.html" || echo "⚠️ pwa-demo.html not found"

echo ""
echo "📋 Transferring Phase 2 Priority 3: Camera Integration..."
echo "=========================================================="

# Priority 3: Camera
cp "$SOURCE/components/CameraCapture.js" "$DEST/components/" 2>/dev/null && echo "✅ CameraCapture.js" || echo "⚠️ CameraCapture.js not found"
cp "$SOURCE/components/PhotoStorage.js" "$DEST/components/" 2>/dev/null && echo "✅ PhotoStorage.js" || echo "⚠️ PhotoStorage.js not found"
cp "$SOURCE/components/wizards/CameraEnhancedAssessmentWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ CameraEnhancedAssessmentWizard.js" || echo "⚠️ CameraEnhancedAssessmentWizard.js not found"
cp "$SOURCE/camera-demo.html" "$DEST/" 2>/dev/null && echo "✅ camera-demo.html" || echo "⚠️ camera-demo.html not found"

echo ""
echo "📋 Transferring Phase 2 Priority 4: Real-time Features..."
echo "=========================================================="

# Priority 4: Real-time
cp "$SOURCE/components/RealTimeManager.js" "$DEST/components/" 2>/dev/null && echo "✅ RealTimeManager.js" || echo "⚠️ RealTimeManager.js not found"
cp "$SOURCE/components/RealTimeCollaboration.js" "$DEST/components/" 2>/dev/null && echo "✅ RealTimeCollaboration.js" || echo "⚠️ RealTimeCollaboration.js not found"
cp "$SOURCE/components/PushNotificationManager.js" "$DEST/components/" 2>/dev/null && echo "✅ PushNotificationManager.js" || echo "⚠️ PushNotificationManager.js not found"
cp "$SOURCE/components/wizards/RealTimeEnhancedWizard.js" "$DEST/components/wizards/" 2>/dev/null && echo "✅ RealTimeEnhancedWizard.js" || echo "⚠️ RealTimeEnhancedWizard.js not found"
cp "$SOURCE/realtime-demo.html" "$DEST/" 2>/dev/null && echo "✅ realtime-demo.html" || echo "⚠️ realtime-demo.html not found"

echo ""
echo "📋 Transferring Phase 2 Priority 5: System Integration..."
echo "=========================================================="

# Priority 5: Integration
cp "$SOURCE/components/TracerItIntegration.js" "$DEST/components/" 2>/dev/null && echo "✅ TracerItIntegration.js" || echo "⚠️ TracerItIntegration.js not found"
cp "$SOURCE/components/PassengerCloudIntegration.js" "$DEST/components/" 2>/dev/null && echo "✅ PassengerCloudIntegration.js" || echo "⚠️ PassengerCloudIntegration.js not found"
cp "$SOURCE/components/AdvancedAnalyticsIntegration.js" "$DEST/components/" 2>/dev/null && echo "✅ AdvancedAnalyticsIntegration.js" || echo "⚠️ AdvancedAnalyticsIntegration.js not found"
cp "$SOURCE/components/PerformanceMonitoringSystem.js" "$DEST/components/" 2>/dev/null && echo "✅ PerformanceMonitoringSystem.js" || echo "⚠️ PerformanceMonitoringSystem.js not found"
cp "$SOURCE/integration-demo.html" "$DEST/" 2>/dev/null && echo "✅ integration-demo.html" || echo "⚠️ integration-demo.html not found"

echo ""
echo "📋 Transferring Phase 2 Documentation..."
echo "========================================="

# Documentation
cp "$SOURCE/PHASE2_MOBILE_COMPLETE.md" "$DEST/" 2>/dev/null && echo "✅ PHASE2_MOBILE_COMPLETE.md" || echo "⚠️ Documentation not found"
cp "$SOURCE/PHASE2_PWA_COMPLETE.md" "$DEST/" 2>/dev/null && echo "✅ PHASE2_PWA_COMPLETE.md" || echo "⚠️ Documentation not found"
cp "$SOURCE/PHASE2_CAMERA_COMPLETE.md" "$DEST/" 2>/dev/null && echo "✅ PHASE2_CAMERA_COMPLETE.md" || echo "⚠️ Documentation not found"
cp "$SOURCE/PHASE2_REALTIME_COMPLETE.md" "$DEST/" 2>/dev/null && echo "✅ PHASE2_REALTIME_COMPLETE.md" || echo "⚠️ Documentation not found"
cp "$SOURCE/PHASE2_COMPLETE_SUMMARY.md" "$DEST/" 2>/dev/null && echo "✅ PHASE2_COMPLETE_SUMMARY.md" || echo "⚠️ Documentation not found"

echo ""
echo "📊 Verification:"
echo "==============="

# Count how many Phase 2 files are in destination
MOBILE_COUNT=$(ls "$DEST/components/wizards/"Mobile*.js 2>/dev/null | wc -l)
PWA_COUNT=$(ls "$DEST/"*.html 2>/dev/null | grep -E "(pwa|offline|mobile|camera|realtime|integration)" | wc -l)
INTEGRATION_COUNT=$(ls "$DEST/components/"*Integration.js 2>/dev/null | wc -l)

echo "Mobile Wizards: $MOBILE_COUNT files"
echo "Demo Pages: $PWA_COUNT files"
echo "Integration Components: $INTEGRATION_COUNT files"

echo ""
echo "🎯 Phase 2 Transfer Summary:"
echo "============================"
echo "✅ Priority 1: Mobile UI Components"
echo "✅ Priority 2: PWA Features"
echo "✅ Priority 3: Camera Integration"
echo "✅ Priority 4: Real-time Features"
echo "✅ Priority 5: System Integration"

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Navigate to breakdown-guide-standalone:"
echo "   cd '/Users/anthony/Go BARRY App/breakdown-guide-standalone'"
echo ""
echo "2. Update the main index.html to include Phase 2 scripts"
echo ""
echo "3. Test the integration:"
echo "   - Mobile UI: Open mobile-demo.html"
echo "   - PWA: Open pwa-demo.html"
echo "   - Camera: Open camera-demo.html"
echo "   - Real-time: Open realtime-demo.html"
echo ""
echo "4. Don't forget to transfer Phase 3 as well!"
echo ""
echo "✅ Phase 2 components transferred to breakdown-guide-standalone!"