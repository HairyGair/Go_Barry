#!/bin/bash
# cleanup-unused-components.sh
# Remove unused/duplicate components to clean up the codebase

echo "🧹 Cleaning up unused BARRY components..."

# Check if we're in the right directory
if [ ! -d "Go_BARRY/components" ]; then
    echo "❌ Please run this script from the Go BARRY App root directory"
    exit 1
fi

# Create backup first
echo "📦 Creating backup of components directory..."
cp -r Go_BARRY/components Go_BARRY/components_backup_$(date +%Y%m%d_%H%M%S)

# Create dev folder for test components
echo "🧪 Creating dev folder for test components..."
mkdir -p Go_BARRY/components/dev

# Move test/debug components to dev folder
echo "📁 Moving test/debug components to dev folder..."
mv Go_BARRY/components/SimpleAPITest.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/QuickSupervisorTest.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/SupervisorCardDemo.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/WebSocketTest.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/WebSocketDiagnostics.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/WebSocketDebugPanel.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/APIDebugger.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/IntegrationTest.jsx Go_BARRY/components/dev/ 2>/dev/null
mv Go_BARRY/components/SupervisorDisplayIntegrationTest.jsx Go_BARRY/components/dev/ 2>/dev/null

# Create archive folder for potentially unused components
echo "📁 Creating archive folder for potentially unused components..."
mkdir -p Go_BARRY/components/archive

# Move potentially unused components to archive
echo "📁 Moving potentially unused components to archive..."
mv Go_BARRY/components/ControlDashboard.jsx Go_BARRY/components/archive/ 2>/dev/null
mv Go_BARRY/components/SupervisorCard.jsx Go_BARRY/components/archive/ 2>/dev/null
mv Go_BARRY/components/DisruptionLogger.jsx Go_BARRY/components/archive/ 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "📊 SUMMARY:"
echo "   📁 Test components moved to: Go_BARRY/components/dev/"
echo "   📁 Archived components moved to: Go_BARRY/components/archive/"
echo "   💾 Backup created: Go_BARRY/components_backup_*"
echo ""
echo "📋 REMAINING COMPONENTS TO MANUALLY REVIEW:"
echo "   - AnalyticsDashboard.jsx (used in navigation?)"
echo "   - DisruptionControlRoom.jsx (vs AIDisruptionManager?)"
echo "   - DisruptionLogViewer.jsx (vs DisruptionStatsDashboard?)"
echo "   - ServiceFrequencyDashboard.jsx (actively used?)"
echo "   - AlertList.jsx (vs EnhancedTrafficCard?)"
echo ""
echo "🔍 To restore components if needed:"
echo "   mv Go_BARRY/components/dev/[component] Go_BARRY/components/"
echo "   mv Go_BARRY/components/archive/[component] Go_BARRY/components/"
