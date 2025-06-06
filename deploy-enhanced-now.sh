#!/bin/bash
# Enhanced BARRY Control Room Display - Quick Deploy

echo "🚦 Deploying Enhanced BARRY Control Room Display..."
echo ""

# Show what's being deployed
echo "✅ Enhanced Features:"
echo "   • 30/70 layout (alerts/map) for better spatial awareness"
echo "   • Compact alert list showing multiple incidents"
echo "   • Interactive alert selection with map focus"
echo "   • Live supervisor login status display"
echo "   • Improved information density"
echo "   • No badge numbers (as requested)"
echo ""

# Add all changes
git add .

# Commit with detailed message
git commit -m "🚀 Enhanced Control Room Display

✅ Major Improvements:
- Better 30/70 layout (alerts/map) for spatial awareness
- Compact alert list replaces oversized cards  
- Interactive alert selection with map focus
- Live supervisor login status (no badge numbers)
- Much improved information density
- Keyboard navigation (arrow keys)
- Professional control room styling

🔧 Technical Changes:
- Replaced massive alert cards with compact list
- Added click-to-focus map functionality  
- Enhanced supervisor status indicator
- Improved responsive design
- Better color coding and readability"

# Push to trigger deployment
echo "🚀 Pushing to Render for deployment..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📱 Your enhanced display will be available at:"
echo "   https://go-barry.onrender.com/control-room-display-screen.html"
echo ""
echo "🌐 And on your domain:"
echo "   https://gobarry.co.uk/control-room-display-screen.html"
echo ""
echo "⏱️  Deployment typically takes 2-3 minutes..."
echo "📋 Key improvements:"
echo "   • Click any alert to focus map"
echo "   • Use arrow keys to navigate alerts"
echo "   • See all supervisors logged in (top right)"
echo "   • Much better information density"
echo "   • 70% larger map for spatial awareness"