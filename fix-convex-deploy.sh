#!/bin/bash

echo "🚀 Fixing Convex deployment for Go BARRY..."

cd "/Users/anthony/Go BARRY App/Go_BARRY"

echo "📦 Installing dependencies if needed..."
npm install

echo "🔄 Deploying Convex functions to production..."
npx convex deploy --prod

echo "✅ Convex deployment complete!"
echo ""
echo "If errors persist:"
echo "1. Check Convex dashboard: https://dashboard.convex.dev/d/standing-octopus-908"
echo "2. Clear browser cache and reload"
echo "3. Restart the Expo app"
