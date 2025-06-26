#!/bin/bash
# Deploy VIX data to Convex

echo "🚌 Deploying VIX Late Runners to Convex..."

# Navigate to Go_BARRY directory
cd Go_BARRY

# Deploy to Convex
echo "📦 Deploying Convex functions..."
npx convex deploy --prod

echo "✅ VIX data sync deployed to Convex!"
echo ""
echo "📝 Next steps:"
echo "1. Install xlsx in backend: cd ../backend && npm install xlsx"
echo "2. Restart backend server"
echo "3. VIX upload button is now in the Supervisor Dashboard"
echo "4. Late runners will appear on Display Screen after upload"