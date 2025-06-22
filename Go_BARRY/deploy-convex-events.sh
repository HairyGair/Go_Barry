#!/bin/bash
# Deploy Convex events functionality to production

echo "🚀 Deploying Convex events functionality..."
echo "📂 Working directory: $(pwd)"

# Make sure we're in the right directory
if [ ! -d "convex" ]; then
    echo "❌ Error: convex directory not found. Please run from Go_BARRY directory."
    exit 1
fi

# Check if Convex CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js."
    exit 1
fi

echo "✅ Found convex directory"
echo "🔧 Deploying schema and functions to production..."

# Deploy to production
npx convex deploy --prod

if [ $? -eq 0 ]; then
    echo "✅ Convex deployment successful!"
    echo "📊 New events functionality is now live:"
    echo "   - Events table created in database"
    echo "   - Event management functions deployed"
    echo "   - Real-time events sync enabled"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Test DisplayScreen for CORS fix"
    echo "   2. Verify events appear in real-time"
    echo "   3. Check Convex dashboard for event data"
    echo ""
    echo "🌐 Convex Dashboard: https://dashboard.convex.dev/d/standing-octopus-908"
else
    echo "❌ Convex deployment failed!"
    echo "🔍 Please check the error messages above"
    exit 1
fi
