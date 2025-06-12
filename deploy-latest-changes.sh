#!/bin/bash

# Deploy Latest BARRY Changes - Display Layout Updates
echo "🚦 Deploying BARRY with Latest Display Layout Updates..."
echo ""

echo "📋 DEPLOYMENT SUMMARY:"
echo "  ✅ Display Layout: Updated to 60/40 vertical split (Alerts/Map)"
echo "  ✅ Removed Priority Indicators: Cleaner display interface"
echo "  ✅ Vertical Stacking: Alerts take 60% top, Map takes 40% bottom"
echo "  ✅ Both Components: display.jsx and DisplayScreen.jsx updated"
echo "  ✅ Consistent Layout: Same changes applied to both display components"
echo ""

echo "🔄 Starting deployment..."

# Add all changes
git add .

# Commit with comprehensive message
git commit -m "🖥️ DISPLAY LAYOUT UPDATES - 60/40 VERTICAL SPLIT

✅ Major Display Changes:
- Updated both display.jsx and DisplayScreen.jsx
- Changed from horizontal to vertical layout
- Alerts section: 60% of screen (top)
- Map section: 40% of screen (bottom)
- Removed priority summary indicators
- Cleaner, more focused display interface

✅ Technical Updates:
- mainContent: Changed flexDirection to 'column'
- alertsSection: flex 0.6 (60% of vertical space)
- mapSection: flex 0.4 (40% of vertical space)
- Removed CRITICAL/URGENT/MONITOR status boxes
- Updated border styling for vertical stacking
- Consistent styling across both display components

✅ Control Room Benefits:
- Alerts get primary visual focus (60%)
- Map maintains good visibility (40%)
- No distracting status indicators
- Better information hierarchy
- Cleaner professional appearance"

# Build frontend first
echo "🏗️  Building frontend..."
cd Go_BARRY
npm install
npm run build:web
cd ..

# Deploy to production
echo "🚀 Pushing to production..."
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Production URLs:"
echo "   Backend: https://go-barry.onrender.com"
echo "   Frontend: https://gobarry.co.uk" 
echo "   Display: https://gobarry.co.uk/display"
echo ""
echo "📊 Updated Display Layout:"
echo "   📈 Alerts: 60% of screen (top section)"
echo "   🗺️  Map: 40% of screen (bottom section)"
echo "   🎯 Vertical stacking for better focus"
echo ""
echo "🔧 TESTING:"
echo "   curl https://go-barry.onrender.com/api/health"
echo "   Visit: https://gobarry.co.uk/display"
echo ""
echo "⚡ Display improvements:"
echo "   • Alerts get primary visual attention (60%)"
echo "   • Map maintains good visibility (40%)"
echo "   • Cleaner interface without status indicators"
echo "   • Better information hierarchy"
echo "   • Professional control room appearance"
