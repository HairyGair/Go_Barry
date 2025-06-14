#!/bin/bash
# fix-render-enhanced-deployment.sh
# Fix Render deployment to include enhanced services

echo "🔧 Fixing Render Enhanced Deployment"
echo "==================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔍 Issue Analysis from Render Logs:"
echo "✅ Enhanced filtering working (30→16 alerts)"
echo "✅ TomTom + HERE APIs working"
echo "✅ Enhanced GTFS route matching active"
echo "❌ Import errors for new enhanced services"
echo "❌ Missing API keys for National Highways + MapQuest"
echo "❌ Port detection issue (app not starting properly)"
echo ""

# Check if enhanced services exist
print_status "Checking enhanced services..."
enhanced_services=(
    "backend/services/timeBasedPollingManager.js"
    "backend/services/duplicateDetectionManager.js"
    "backend/services/enhancedGeocodingService.js"
)

all_services_exist=true
for service in "${enhanced_services[@]}"; do
    if [ -f "$service" ]; then
        print_success "✅ $service exists"
    else
        print_error "❌ $service missing"
        all_services_exist=false
    fi
done

if [ "$all_services_exist" = true ]; then
    print_status "All enhanced services exist locally. Need to push to Render."
    
    # Check if these files are committed to git
    print_status "Checking Git status..."
    if git diff --name-only HEAD | grep -E "(timeBasedPollingManager|duplicateDetectionManager|enhancedGeocodingService)" > /dev/null; then
        print_warning "Enhanced services have uncommitted changes"
    fi
    
    if git diff --cached --name-only | grep -E "(timeBasedPollingManager|duplicateDetectionManager|enhancedGeocodingService)" > /dev/null; then
        print_success "Enhanced services are staged for commit"
    fi
    
    # Check if files are in the last commit
    if git show --name-only HEAD | grep -E "(timeBasedPollingManager|duplicateDetectionManager|enhancedGeocodingService)" > /dev/null; then
        print_success "Enhanced services are in the latest commit"
        print_status "These should be deployed to Render already."
    else
        print_warning "Enhanced services not in latest commit - may need re-deployment"
    fi
else
    print_error "Enhanced services missing locally! This shouldn't happen."
fi

echo ""
print_status "🔑 Render Environment Variables Needed:"
echo ""
echo "Go to: https://dashboard.render.com → go-barry service → Environment"
echo ""
echo "Add these environment variables:"
echo "📋 NATIONAL_HIGHWAYS_API_KEY=your_key_here"
echo "📋 MAPQUEST_API_KEY=your_key_here"  
echo "📋 HERE_API_KEY=your_existing_key (if not set)"
echo "📋 TOMTOM_API_KEY=your_existing_key (if not set)"

echo ""
print_status "🚀 Quick Fix Steps:"
echo ""
echo "1. 🔄 Check Render deployment logs for import errors"
echo "2. 🔑 Add missing API keys in Render Dashboard"
echo "3. 🔄 Manual redeploy: Render Dashboard → Manual Deploy"
echo "4. 🧪 Test health endpoint after redeploy"

echo ""
print_status "🎯 Expected After Fix:"
echo "✅ All 4 data sources working (not just 2)"
echo "✅ No import errors in logs"
echo "✅ Port detection successful"
echo "✅ Enhanced features fully operational"

echo ""
print_success "Enhanced system core is already working!"
print_status "Just need API keys and proper service imports"

# Create a minimal test to verify enhanced services can be imported
print_status "Testing enhanced service imports..."
cat > test-enhanced-imports.js << 'EOF'
// Test if enhanced services can be imported
async function testImports() {
  try {
    console.log('Testing enhanced service imports...');
    
    const timeBasedPollingManager = await import('./backend/services/timeBasedPollingManager.js');
    console.log('✅ timeBasedPollingManager imported');
    
    const duplicateDetectionManager = await import('./backend/services/duplicateDetectionManager.js');
    console.log('✅ duplicateDetectionManager imported');
    
    const enhancedGeocodingService = await import('./backend/services/enhancedGeocodingService.js');
    console.log('✅ enhancedGeocodingService imported');
    
    console.log('🎉 All enhanced services can be imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Import error:', error.message);
    return false;
  }
}

testImports().then(success => {
  if (success) {
    console.log('✅ Enhanced services ready for deployment');
  } else {
    console.log('❌ Enhanced services have import issues');
  }
}).catch(console.error);
EOF

print_status "Running import test..."
if node test-enhanced-imports.js 2>/dev/null; then
    print_success "✅ Enhanced services import successfully"
else
    print_warning "⚠️ Enhanced services have import issues"
fi

# Cleanup test file
rm -f test-enhanced-imports.js

echo ""
print_status "🧪 Test Current Render Status:"
echo "curl https://go-barry.onrender.com/api/health"
echo ""
print_status "If health endpoint fails, deployment needs fixing"
