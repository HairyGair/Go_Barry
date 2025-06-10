#!/bin/bash
# Deploy Non-Interactive Control Room Display

echo "🚦 Deploying Non-Interactive Control Room Display..."
echo ""

# Show what's being deployed
echo "✅ New Features:"
echo "   • Non-interactive control room display"
echo "   • Supervisor remote control via WebSocket"
echo "   • Live metrics dashboard"
echo "   • Priority message system"
echo "   • Professional 24/7 monitoring layout"
echo "   • Real-time alert display"
echo "   • Supervisor status panel"
echo ""

# Add all changes
git add .

# Commit with detailed message
git commit -m "🚀 Non-Interactive Control Room Display

✅ Major Features:
- Professional control room display layout
- WebSocket-based supervisor remote control
- Live metrics: alerts, supervisors, system status
- Priority message system for supervisor announcements
- Non-interactive design for 24/7 monitoring
- Real-time supervisor status panel
- Enhanced DisplayScreen integration

🔧 Technical Implementation:
- Full control room header with live metrics
- WebSocket sync for remote supervisor control
- Priority message display system
- Professional styling for control room environment
- Real-time connection status indicators
- Automated 15-second refresh cycle"

# Push to trigger deployment
echo "🚀 Pushing to Render for deployment..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📱 Your control room display will be available at:"
echo "   https://gobarry.co.uk/display"
echo "   https://go-barry.onrender.com/display"
echo ""
echo "⏱️  Deployment typically takes 2-3 minutes..."
echo "📋 Key features:"
echo "   • Professional control room layout"
echo "   • Supervisor remote control"
echo "   • Live metrics display"
echo "   • Non-interactive monitoring"
echo "   • Real-time synchronization"