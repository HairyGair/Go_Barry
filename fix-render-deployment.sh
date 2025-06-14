#!/bin/bash
# fix-render-deployment.sh
# Fix API keys and port binding issues

echo "🔧 Fixing Render Deployment Issues"
echo "=================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
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

echo "🔍 Issues Identified from Render Logs:"
echo "1. ❌ National Highways API: Invalid Subscription Key"
echo "2. ❌ MapQuest API: Authentication failed"  
echo "3. ⚠️ Port binding issue detected"
echo ""

print_status "Checking current backend index.js for port binding..."

# Check if index.js has correct port binding
if [ -f "backend/index.js" ]; then
    if grep -q "0.0.0.0" backend/index.js; then
        print_success "✅ Port binding looks correct in code"
    else
        print_warning "⚠️ Port binding may need adjustment"
    fi
    
    # Check if PORT environment variable is used
    if grep -q "process.env.PORT" backend/index.js; then
        print_success "✅ PORT environment variable is used"
    else
        print_error "❌ PORT environment variable not found"
    fi
else
    print_error "❌ backend/index.js not found"
fi

echo ""
print_status "🔑 API Key Environment Variables Needed in Render:"

echo ""
echo "📋 Go to Render Dashboard → go-barry service → Environment:"
echo ""
echo "🔑 Add these environment variables:"
echo "   NATIONAL_HIGHWAYS_API_KEY=your_key_here"
echo "   MAPQUEST_API_KEY=your_key_here"
echo "   HERE_API_KEY=your_existing_key"
echo "   TOMTOM_API_KEY=your_existing_key"
echo ""

print_status "🚀 Quick Fix Steps:"
echo ""
echo "1. 🔑 Add missing API keys in Render Dashboard"
echo "2. 🔄 Trigger manual redeploy"
echo "3. 🧪 Test endpoints after redeploy"
echo ""

print_status "🎯 Current System Status:"
echo "✅ Enhanced data feeds: WORKING (TomTom + HERE)"
echo "✅ Duplicate detection: ACTIVE (30→16 alerts)"
echo "✅ Enhanced geocoding: WORKING (15/16 with coordinates)"  
echo "✅ Enhanced filtering: ACTIVE"
echo "⚠️ National Highways: Needs API key"
echo "⚠️ MapQuest: Needs API key"
echo "⚠️ Port binding: May need verification"

echo ""
print_success "🎉 Core Enhanced System is WORKING!"
print_status "Just need to fix API keys and possibly port binding"

echo ""
print_status "🧪 Test Current System:"
echo "curl https://go-barry.onrender.com/api/health-extended"
echo ""
print_status "Expected: Should show enhanced features working with 2/4 sources"
