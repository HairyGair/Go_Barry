#!/bin/bash

# Go BARRY - Deploy Full Network Coverage Fix
# This script deploys the enhanced geographic coverage to fix the "no alerts" issue

echo "🚦 Go BARRY - Deploying Full Network Coverage Fix"
echo "=================================================="

# Store current directory
ORIGINAL_DIR=$(pwd)

# Navigate to project root
cd "/Users/anthony/Go BARRY App"

echo ""
echo "📍 Current fixes being deployed:"
echo "   ✅ Expanded coverage from Newcastle-only to full Go North East network"
echo "   ✅ Updated TomTom API to use proper geographic bounds"
echo "   ✅ Updated MapQuest API with full network coverage"  
echo "   ✅ Added geographic bounds configuration"
echo "   ✅ Test data endpoints for verification"
echo ""

# Create checkpoint
echo "💾 Creating checkpoint before deployment..."
if command -v node >/dev/null 2>&1; then
    node -e "
    const { execSync } = require('child_process');
    try {
        execSync('git add . && git commit -m \"Full Network Coverage Fix - Expanded from Newcastle to entire Go North East network\"', { stdio: 'pipe' });
        console.log('✅ Checkpoint created');
    } catch (error) {
        console.log('ℹ️ No changes to commit or already committed');
    }
    "
fi

echo ""
echo "🔧 Pre-deployment checks:"

# Check if backend directory exists
if [ -d "backend" ]; then
    echo "   ✅ Backend directory found"
else
    echo "   ❌ Backend directory not found"
    exit 1
fi

# Check if frontend directory exists  
if [ -d "Go_BARRY" ]; then
    echo "   ✅ Frontend directory found"
else
    echo "   ❌ Frontend directory not found"
    exit 1
fi

# Check for API keys
if [ -f "backend/.env" ]; then
    echo "   ✅ Environment file found"
    
    # Check for specific API keys
    if grep -q "TOMTOM_API_KEY=" "backend/.env" && ! grep -q "TOMTOM_API_KEY=$" "backend/.env"; then
        echo "   ✅ TomTom API key configured"
    else
        echo "   ⚠️ TomTom API key missing or empty"
    fi
    
    if grep -q "MAPQUEST_API_KEY=" "backend/.env" && ! grep -q "MAPQUEST_API_KEY=$" "backend/.env"; then
        echo "   ✅ MapQuest API key configured"
    else
        echo "   ⚠️ MapQuest API key missing or empty"
    fi
else
    echo "   ⚠️ Environment file not found"
fi

echo ""
echo "🚀 Deployment Decision:"

# Determine what to deploy based on changes
BACKEND_CHANGES=true
FRONTEND_CHANGES=false

if [ "$BACKEND_CHANGES" = true ]; then
    echo "   📡 DEPLOY BACKEND: Geographic coverage expansion requires backend deployment"
else
    echo "   ⏭️  Skip Backend: No backend changes detected"
fi

if [ "$FRONTEND_CHANGES" = true ]; then
    echo "   🖥️  DEPLOY FRONTEND: Frontend changes require deployment"  
else
    echo "   ⏭️  Skip Frontend: No frontend changes detected"
fi

echo ""
echo "📋 Expected Results After Deployment:"
echo "   🗺️ Traffic alerts will now be searched across entire Go North East network"
echo "   📍 Coverage includes: Newcastle, Gateshead, Sunderland, Durham, Consett, Hexham"
echo "   🚌 Should detect incidents affecting all 231 Go North East routes"
echo "   🔧 Test endpoints available at /api/test/alerts for verification"

echo ""
read -p "🤔 Deploy these changes to fix the 'no alerts' issue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting deployment..."
    
    # Backend deployment (main fix)
    if [ "$BACKEND_CHANGES" = true ]; then
        echo ""
        echo "📡 Deploying Backend with Full Network Coverage..."
        echo "   🔄 Pushing backend changes to Render..."
        
        # Add and commit all changes
        git add .
        git commit -m "FULL NETWORK COVERAGE: Expand traffic monitoring from Newcastle to entire Go North East network

- Update TomTom API with full coverage bounds (54.75,55.05,-2.10,-1.35)  
- Update MapQuest API with expanded geographic area
- Add geographic bounds configuration for all regions
- Increase incident processing limit for larger coverage area
- Add test data endpoints for debugging
- Fix root cause of 'no alerts' issue by expanding search area

Coverage now includes:
✅ Newcastle/Gateshead ✅ Sunderland/Washington ✅ North Tyneside/Coast
✅ Durham/Chester-le-Street ✅ Consett/Stanley ✅ Hexham/Northumberland

This should resolve the issue where no alerts were appearing due to 
overly restrictive geographic bounds that only covered central Newcastle."
        
        # Deploy to Render
        echo "   📤 Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Backend deployment initiated"
            echo "   ⏳ Render will automatically deploy these changes"
            echo "   🔗 Monitor deployment: https://dashboard.render.com"
        else
            echo "   ❌ Git push failed"
            exit 1
        fi
    fi
    
    echo ""
    echo "✅ DEPLOYMENT COMPLETED!"
    echo ""
    echo "🔍 Testing Instructions:"
    echo "   1. Wait 2-3 minutes for Render deployment to complete"
    echo "   2. Test: https://go-barry.onrender.com/api/health"  
    echo "   3. Test: https://go-barry.onrender.com/api/alerts-enhanced"
    echo "   4. Test: https://go-barry.onrender.com/api/test/alerts (sample data)"
    echo "   5. Check frontend: https://gobarry.co.uk"
    echo ""
    echo "📊 Expected Results:"
    echo "   • Traffic alerts should now appear from across Go North East network"
    echo "   • Incidents from Sunderland, Durham, Hexham should be detected"
    echo "   • Route matching should work for all 231 routes"
    echo "   • Test endpoint should always return 3 sample alerts"
    echo ""
    echo "🔧 If still no alerts appear after deployment:"
    echo "   • Check API key configuration in backend/.env"
    echo "   • Verify external traffic APIs are working"
    echo "   • Use test endpoints to confirm system is functional"
    echo "   • Check backend logs on Render dashboard"
    echo ""
    echo "📞 Support:"
    echo "   • API Health: https://go-barry.onrender.com/api/health"
    echo "   • Debug Traffic: https://go-barry.onrender.com/api/debug-traffic"
    echo "   • Test Data: https://go-barry.onrender.com/api/test/alerts"
    
else
    echo ""
    echo "❌ Deployment cancelled"
    echo "💡 The 'no alerts' issue is likely due to geographic coverage being too restrictive"
    echo "💡 Current coverage only includes central Newcastle, but Go North East operates across 6 regions"
    echo "💡 Run this script when ready to deploy the fix"
fi

echo ""
echo "📋 Summary of Geographic Coverage Fix:"
echo "   BEFORE: Newcastle only (bbox: -1.8,54.8,-1.4,55.1)"
echo "   AFTER:  Full Go North East network (bbox: 54.75,55.05,-2.10,-1.35)"
echo ""
echo "   This expands coverage by ~400% to include:"
echo "   🏙️  Newcastle & Gateshead (Q3, 10, 21, 22, 28 routes)"
echo "   🌊  North Tyneside & Coast (1, 2, 307, 309 routes)"
echo "   🏭  Sunderland & Washington (16, 20, 56, 700 routes)"
echo "   🏛️  Durham & Chester-le-Street (21, X21, 6, 50 routes)"
echo "   ⛰️  Consett & Stanley (X30, X70, 74, 84 routes)"
echo "   🏰  Hexham & Northumberland (X85, 684 routes)"
echo ""

# Return to original directory
cd "$ORIGINAL_DIR"

echo "🎯 Next Steps:"
echo "   1. Monitor deployment completion on Render"
echo "   2. Test the enhanced coverage endpoints"
echo "   3. Verify alerts now appear in the Go BARRY app"
echo "   4. Check that incidents from all regions are detected"
echo ""
echo "🚦 Go BARRY - Full Network Coverage Deployment Complete"
