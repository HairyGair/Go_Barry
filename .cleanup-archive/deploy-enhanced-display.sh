#!/bin/bash
# Quick deployment script for enhanced control room display

echo "🚦 Deploying Enhanced BARRY Control Room Display..."

# Add all changes
git add .

# Commit with timestamp
git commit -m "Enhanced control room display - $(date '+%Y-%m-%d %H:%M:%S')"

# Push to Render
echo "🚀 Deploying to Render..."
git push origin main

echo "✅ Deployment initiated!"
echo ""
echo "📱 Your enhanced display will be available at:"
echo "   https://go-barry.onrender.com/control-room-display-enhanced.html"
echo ""
echo "🌐 And on your domain:"
echo "   https://gobarry.co.uk/control-room-display-enhanced.html"
echo ""
echo "⏱️  Deployment typically takes 2-3 minutes..."
