#!/bin/bash
# Fix and deploy VIX to Convex

echo "🔧 Fixing VIX Convex deployment..."

cd Go_BARRY

# First, ensure Convex is initialized
echo "📦 Checking Convex setup..."
npx convex dev --once

# Deploy the functions
echo "🚀 Deploying to Convex production..."
npx convex deploy --prod

echo "✅ VIX functions deployed!"
echo ""
echo "🔄 Please refresh your browser to load the updated functions"