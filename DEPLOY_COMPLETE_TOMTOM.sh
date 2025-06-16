#!/bin/bash
# DEPLOY_COMPLETE_TOMTOM.sh
# Complete TomTom integration deployment for Go BARRY

echo "🚀 Go BARRY TomTom Integration - Complete Deployment"
echo "===================================================="
echo ""
echo "🗺️ This will deploy TomTom Maps integration to both:"
echo "   📡 Backend: Render.com (automatic via GitHub)"
echo "   📱 Frontend: Built for cPanel deployment"
echo ""

# Set working directory
cd "/Users/anthony/Go BARRY App"

# Make scripts executable
chmod +x DEPLOY_TOMTOM_NOW.sh
chmod +x DEPLOY_FRONTEND_NOW.sh

echo "📋 DEPLOYMENT STEPS:"
echo "1. Deploy backend (triggers Render.com via GitHub)"
echo "2. Build frontend with TomTom integration"
echo "3. Package for cPanel deployment"
echo ""

read -p "🎯 Deploy backend first? (y/n): " deploy_backend

if [ "$deploy_backend" = "y" ] || [ "$deploy_backend" = "Y" ]; then
    echo ""
    echo "🗺️ STEP 1: Deploying Backend..."
    ./DEPLOY_TOMTOM_NOW.sh
    
    echo ""
    echo "⏳ Wait 2-3 minutes for Render.com deployment..."
    echo "   Monitor: https://render.com/dashboard"
    echo ""
    
    read -p "📡 Backend deployed successfully? Continue with frontend? (y/n): " continue_frontend
    
    if [ "$continue_frontend" = "y" ] || [ "$continue_frontend" = "Y" ]; then
        echo ""
        echo "📱 STEP 2: Building Frontend..."
        ./DEPLOY_FRONTEND_NOW.sh
        
        echo ""
        echo "🎉 DEPLOYMENT COMPLETE!"
        echo ""
        echo "🧪 FINAL TESTING:"
        echo "   Backend:  https://go-barry.onrender.com/api/health"
        echo "   Frontend: https://gobarry.co.uk"
        echo "   Display:  https://gobarry.co.uk/display"
        echo ""
        echo "🗺️ TomTom Integration Features:"
        echo "   ✅ Real-time traffic tiles"
        echo "   ✅ Alert markers with auto-zoom"
        echo "   ✅ Traffic overlay toggle"
        echo "   ✅ Production-optimized tile usage"
        echo ""
        echo "📋 Manual cPanel upload still required:"
        echo "   File: Go_BARRY/gobarry-tomtom-deployment.zip"
        echo "   Upload to: public_html/ on cPanel"
    fi
else
    echo ""
    echo "📱 Building Frontend Only..."
    ./DEPLOY_FRONTEND_NOW.sh
fi

echo ""
echo "✨ Go BARRY TomTom Integration Ready!"
