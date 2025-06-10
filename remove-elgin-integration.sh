#!/bin/bash
# remove-elgin-integration.sh
# Script to cleanly remove Elgin integration from Go BARRY

echo "🗑️ Go BARRY: Removing Elgin Integration"
echo "==========================================="

# 1. Disable Elgin in environment
echo "📝 Step 1: Disabling Elgin in environment..."
if [ -f "backend/.env" ]; then
    sed -i.bak 's/ELGIN_ENABLED=true/ELGIN_ENABLED=false/g' backend/.env
    echo "✅ Disabled ELGIN_ENABLED in .env"
fi

# 2. Remove Elgin service file
echo "🗂️ Step 2: Removing Elgin service file..."
if [ -f "backend/services/elgin.js" ]; then
    mv backend/services/elgin.js backend/services/elgin.js.backup
    echo "✅ Moved elgin.js to elgin.js.backup"
fi

# 3. Remove Elgin imports from main backend
echo "🔧 Step 3: Removing Elgin imports from backend..."
if [ -f "backend/index-v3-optimized.js" ]; then
    cp backend/index-v3-optimized.js backend/index-v3-optimized.js.backup
    
    # Remove import line
    sed -i.tmp '/import.*elgin/d' backend/index-v3-optimized.js
    
    # Remove getEnhancedAlerts function and restore simple SAMPLE_ALERTS
    sed -i.tmp '/async function getEnhancedAlerts/,/^}/d' backend/index-v3-optimized.js
    
    echo "✅ Removed Elgin imports and functions"
fi

# 4. Remove fast-xml-parser dependency
echo "📦 Step 4: Removing XML parser dependency..."
if [ -f "backend/package.json" ]; then
    cp backend/package.json backend/package.json.backup
    sed -i.tmp '/"fast-xml-parser"/d' backend/package.json
    echo "✅ Removed fast-xml-parser from package.json"
fi

# 5. Clean up temporary files
echo "🧹 Step 5: Cleaning up..."
find backend -name "*.tmp" -delete
echo "✅ Cleaned temporary files"

echo ""
echo "🎯 Elgin Integration Removal Complete!"
echo "======================================="
echo "✅ Elgin service disabled and backed up"
echo "✅ Backend imports removed"
echo "✅ XML parser dependency removed"
echo "📁 Backup files created (.backup extension)"
echo ""
echo "📋 Next Steps:"
echo "1. Run: cd backend && npm install"
echo "2. Test: npm run start"
echo "3. Deploy: git add . && git commit -m 'Remove Elgin integration'"
echo ""
echo "🔄 To restore: Run restore-elgin-integration.sh"
