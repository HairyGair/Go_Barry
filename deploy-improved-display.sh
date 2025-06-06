#!/bin/bash
# Deploy improved BARRY Control Room Display - Quick Deploy

echo "🚦 Deploying Improved BARRY Control Room Display..."
echo ""

# Show what's being deployed
echo "✅ Improvements Made:"
echo "   • Better 70/30 layout (map/alerts) for improved spatial awareness"
echo "   • Reduced oversized font sizes (3.4em → 1.8em)"
echo "   • Reduced excessive padding (48px → 24px)" 
echo "   • Live supervisor login status display (no badge numbers)"
echo "   • More reasonable alert card sizing"
echo "   • Better information density"
echo ""

# Add all changes
git add .

# Commit with detailed message
git commit -m "🎯 Improved Control Room Display Layout

✅ Key Improvements:
- Better 70/30 layout (map/alerts) for spatial awareness
- Reduced oversized alert card fonts from 3.4em to 1.8em
- Reduced excessive padding from 48px to 24px
- More readable alert details (22px → 16px fonts)
- Smaller route badges (22px → 14px fonts)
- Live supervisor login status display
- Removed badge numbers as requested
- Much better information density

🎨 Visual Improvements:
- Professional control room styling
- Better proportions for viewing
- Improved readability at distance
- Clean supervisor status indicator"

# Push to trigger deployment
echo "🚀 Pushing to Render for deployment..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📱 Your improved display will be available at:"
echo "   https://go-barry.onrender.com/control-room-display-screen.html"
echo ""
echo "🌐 And on your domain:"
echo "   https://gobarry.co.uk/control-room-display-screen.html"
echo ""
echo "⏱️  Deployment typically takes 2-3 minutes..."
echo "📋 You should now see:"
echo "   • Larger map area (70% of screen)"
echo "   • Much smaller, readable text in alerts"
echo "   • Live supervisor status in top right"
echo "   • Better overall proportions"