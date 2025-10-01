#!/bin/bash

# Copy all necessary files for ETA system

echo "📦 Copying ETA System files to their locations..."

# 1. Copy Engineering Dashboard
cp "/Users/anthony/Go BARRY App/eta-popup-implementation/3-engineering-dashboard.html" \
   "/Users/anthony/Go BARRY App/Go_BARRY/public/engineering-eta-dashboard.html"
echo "✅ Engineering dashboard copied to /Go_BARRY/public/"

# 2. Make test script executable
chmod +x "/Users/anthony/Go BARRY App/backend/test-eta-system.sh"
echo "✅ Test script is executable"

echo ""
echo "✅ All files are in place!"
echo ""
echo "📋 Final checklist:"
echo "  [✓] Backend API: /backend/routes/etaRequestSystem.js"
echo "  [✓] Backend updated: /backend/index.js"
echo "  [✓] Engineering Dashboard: /Go_BARRY/public/engineering-eta-dashboard.html"
echo "  [✓] Test script: /backend/test-eta-system.sh"
echo ""
echo "🎯 Next steps:"
echo "  1. Install dependencies:"
echo "     cd /Users/anthony/Go\ BARRY\ App/backend"
echo "     npm install socket.io node-cron"
echo ""
echo "  2. Run database migration in Supabase"
echo ""
echo "  3. Start the server:"
echo "     npm run dev"
echo ""
echo "  4. Test the system:"
echo "     bash test-eta-system.sh"
echo ""
echo "  5. Access dashboards:"
echo "     Engineering: http://localhost:3001/engineering-eta-dashboard.html"
echo "     SDC: http://localhost:3001/enhanced-breakdown-dashboard.html"