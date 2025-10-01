#!/bin/bash

# Setup Engineering Team Management System
# Run this script to integrate real engineering data

echo "🔧 Setting up Engineering Team Management System..."
echo "================================================"

# 1. Run database migration
echo ""
echo "📊 Step 1: Database Migration"
echo "-----------------------------"
echo "Please run the following in Supabase SQL Editor:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of:"
echo "   backend/migrations/engineering-team-migration.sql"
echo "4. Click 'Run' to execute"
echo ""
read -p "Press Enter when database migration is complete..."

# 2. Update backend routes
echo ""
echo "📡 Step 2: Backend Route Registration"
echo "-------------------------------------"
echo "Add the following to backend/index.js after the breakdown routes:"
echo ""
cat << 'EOF'
// Engineering Team Management Routes
await routeManager.registerRoute(
    app, 
    '/api/engineering', 
    './routes/engineeringTeam.js', 
    'Engineering Team Management'
);
console.log('✅ Engineering team management routes registered');
EOF
echo ""
read -p "Press Enter when backend is updated..."

# 3. Test the API endpoints
echo ""
echo "🧪 Step 3: Testing API Endpoints"
echo "---------------------------------"

# Test if backend is running
echo "Testing backend connection..."
if curl -s "http://localhost:3001/api/breakdowns/test" > /dev/null 2>&1; then
    BACKEND_URL="http://localhost:3001"
    echo "✅ Local backend detected at $BACKEND_URL"
else
    BACKEND_URL="https://go-barry.onrender.com"
    echo "📡 Using production backend at $BACKEND_URL"
fi

# Test engineering endpoints
echo ""
echo "Testing engineering endpoints..."

# Test engineers endpoint
echo -n "Testing /api/engineering/engineers... "
if curl -s "$BACKEND_URL/api/engineering/engineers" | grep -q "success"; then
    echo "✅ Success"
else
    echo "❌ Failed"
fi

# Test metrics endpoint
echo -n "Testing /api/engineering/metrics... "
if curl -s "$BACKEND_URL/api/engineering/metrics" | grep -q "success"; then
    echo "✅ Success"
else
    echo "❌ Failed"
fi

echo ""
echo "================================================"
echo "✨ Setup Complete!"
echo ""
echo "📊 Access the new dashboard at:"
echo "http://127.0.0.1:5500/BreakdownGuideFrontendComplete/dashboard/engineering-dashboard-live.html"
echo ""
echo "🎯 Features now available:"
echo "- Real-time engineer availability"
echo "- Auto-assignment of nearest engineer"
echo "- Live response time tracking"
echo "- SLA monitoring by depot"
echo "- Engineer shift management"
echo ""
echo "💡 Next steps:"
echo "1. Open the engineering dashboard"
echo "2. Create a test breakdown"
echo "3. Try auto-assigning an engineer"
echo "4. Track the response lifecycle"
echo ""
echo "Need help? Check the documentation in:"
echo "- backend/routes/engineeringTeam.js"
echo "- backend/migrations/engineering-team-migration.sql"
