#!/bin/bash
# restore-elgin-integration.sh
# Script to restore Elgin integration if removal was needed

echo "🔄 Go BARRY: Restoring Elgin Integration"
echo "========================================"

# 1. Restore service file
echo "🗂️ Step 1: Restoring Elgin service file..."
if [ -f "backend/services/elgin.js.backup" ]; then
    mv backend/services/elgin.js.backup backend/services/elgin.js
    echo "✅ Restored elgin.js from backup"
fi

# 2. Restore backend file
echo "🔧 Step 2: Restoring backend integration..."
if [ -f "backend/index-v3-optimized.js.backup" ]; then
    mv backend/index-v3-optimized.js.backup backend/index-v3-optimized.js
    echo "✅ Restored backend integration from backup"
fi

# 3. Restore package.json
echo "📦 Step 3: Restoring package.json..."
if [ -f "backend/package.json.backup" ]; then
    mv backend/package.json.backup backend/package.json
    echo "✅ Restored package.json from backup"
fi

# 4. Install dependencies
echo "📥 Step 4: Installing dependencies..."
cd backend && npm install

echo ""
echo "🎯 Elgin Integration Restored!"
echo "============================="
echo "✅ All files restored from backup"
echo "✅ Dependencies reinstalled"
echo ""
echo "📋 Next Steps:"
echo "1. Configure ELGIN_ENABLED=true in .env"
echo "2. Add your Elgin API credentials"
echo "3. Test: npm run start"
echo "4. Deploy: git add . && git commit -m 'Restore Elgin integration'"
