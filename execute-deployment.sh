#!/bin/bash
# execute-deployment.sh
# Execute the Convex deployment for Communications Platform

echo "🚀 DEPLOYING COMMUNICATIONS PLATFORM TO PRODUCTION"
echo "=================================================="
echo ""

# Change to the correct directory
cd "/Users/anthony/Go BARRY App/Go_BARRY"

echo "📁 Current directory: $(pwd)"
echo ""

# Verify we're in the right place
if [ ! -f "convex/schema.ts" ]; then
    echo "❌ Error: convex/schema.ts not found!"
    echo "   Make sure you're in the correct directory."
    exit 1
fi

if [ ! -f "convex/communications.ts" ]; then
    echo "❌ Error: convex/communications.ts not found!"
    echo "   Communications functions file is missing."
    exit 1
fi

echo "✅ Files verified - ready for deployment"
echo ""

# Show what we're deploying
echo "📦 DEPLOYMENT CONTENTS:"
echo "----------------------"
echo "• Enhanced schema.ts with 5 communications tables"
echo "• communications.ts with 18 real-time functions"
echo "• Email template management"
echo "• VoIP session tracking"
echo "• Message queue processing"
echo "• Communication audit logging"
echo "• All existing functions preserved"
echo ""

echo "🎯 TARGET: standing-octopus-908.convex.cloud"
echo ""

echo "🚀 Starting deployment..."
echo "========================"
echo ""

# Execute the deployment
npx convex deploy --prod

# Check the exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    echo "✅ Communications Platform is now LIVE in production!"
    echo ""
    echo "📊 What's Now Available:"
    echo "• Real-time communications sync across all screens"
    echo "• Email template management with variables"
    echo "• VoIP call logging with emergency detection"
    echo "• Message queue background processing"
    echo "• Comprehensive audit trail for compliance"
    echo "• Production-ready infrastructure for Phase 3"
    echo ""
    echo "🌐 Production Environment:"
    echo "• Dashboard: https://dashboard.convex.dev/d/standing-octopus-908"
    echo "• API: https://standing-octopus-908.convex.cloud"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. ✅ Verify deployment in Convex dashboard"
    echo "2. 🧪 Test communications functions"
    echo "3. 🚀 Begin Phase 3: Component Development"
    echo ""
    echo "🎊 PHASE 2 (INFRASTRUCTURE) COMPLETE!"
    echo "Ready for Phase 3: Component Development - Tier 1"
    echo ""
    echo "Outstanding work! The foundation is now LIVE! 🚀"
    
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "==================="
    echo ""
    echo "🛠️ Troubleshooting:"
    echo "1. Check error messages above"
    echo "2. Verify Convex login: npx convex login"
    echo "3. Check project access: npx convex dashboard"
    echo "4. Verify schema syntax"
    echo "5. Try manual deployment: npx convex deploy --prod"
    echo ""
    echo "📞 Need help? Check the Convex dashboard for detailed error logs."
    
    exit 1
fi