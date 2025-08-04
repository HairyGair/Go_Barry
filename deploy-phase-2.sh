#!/bin/bash

echo "🚀 Deploying Phase 2: Disruption Database"
echo "========================================"

# Navigate to project
cd /Users/anthony/Go\ BARRY\ App

# Show what's being deployed
echo ""
echo "📋 Files to deploy:"
echo "- backend/migrations/create-disruptions-table.sql (NEW)"
echo "- backend/routes/disruptionAPI.js (NEW)"
echo "- backend/index.js (MODIFIED)"
echo "- Go_BARRY/components/DisruptionDatabase.jsx (NEW)"
echo "- Go_BARRY/components/RoadworksManagerDashboard.jsx (MODIFIED)"
echo ""

# Git operations
echo "💾 Committing changes..."
git add -A
git commit -m "Phase 2: Disruption Database implementation complete

- Add disruptions table schema with audit logging
- Create comprehensive disruption API endpoints
- Auto-create disruption records on escalation
- Build disruption management UI with search/filter
- Implement reactivation flow with history tracking
- Add complete audit trail for all actions
- Integrate with Disruption Centre interface

Ready for production deployment!"

# Push to deploy
echo ""
echo "🚀 Pushing to GitHub (auto-deploys to Render)..."
git push

echo ""
echo "✅ Backend deployment initiated!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "========================"
echo ""
echo "1. 🗄️  RUN SUPABASE MIGRATION:"
echo "   a) Go to your Supabase dashboard"
echo "   b) Navigate to SQL Editor"
echo "   c) Open: backend/migrations/create-disruptions-table.sql"
echo "   d) Copy entire contents and paste into SQL editor"
echo "   e) Click 'Run' to create tables"
echo ""
echo "2. 🧪 TEST THE IMPLEMENTATION:"
echo "   a) Wait 2-3 minutes for Render deployment"
echo "   b) Go to Disruption Centre in the app"
echo "   c) Open Roadworks Manager"
echo "   d) Escalate a roadwork to display"
echo "   e) Check it appears in Disruption Database"
echo "   f) Test end/reactivate functions"
echo ""
echo "3. 🌐 BUILD FRONTEND (if needed):"
echo "   cd Go_BARRY"
echo "   expo export:web"
echo "   # Upload web-build to hosting"
echo ""
echo "📊 Phase 2 Features:"
echo "- ✅ Automatic disruption tracking"
echo "- ✅ Reactivation with history"
echo "- ✅ Complete audit trail"
echo "- ✅ Search and filtering"
echo "- ✅ Real-time statistics"
echo ""
echo "🎉 Phase 2 deployment complete!"
