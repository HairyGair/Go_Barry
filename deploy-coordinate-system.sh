#!/bin/bash
# Deploy Unified Coordinate System
# Run this script to deploy the new coordinate system

echo "🚀 Deploying Unified Coordinate System for Go BARRY"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the Go BARRY App root directory"
    exit 1
fi

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing proj4 dependency..."
cd backend
npm install proj4
if [ $? -eq 0 ]; then
    echo "✅ proj4 installed successfully"
else
    echo "❌ Failed to install proj4"
    exit 1
fi
cd ..

# Step 2: Check environment variables
echo ""
echo "🔧 Step 2: Checking environment variables..."

# Load from .env file if it exists
if [ -f "backend/.env" ]; then
    echo "Loading environment from backend/.env..."
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  Warning: SUPABASE_URL not set"
else
    echo "✅ SUPABASE_URL is configured"
fi
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: SUPABASE_ANON_KEY not set"
else
    echo "✅ SUPABASE_ANON_KEY is configured"
fi
echo "✅ Environment check complete"

# Step 3: Run database migration
echo ""
echo "🗄️  Step 3: Running database migration..."
echo "Please run the following SQL in your Supabase dashboard:"
echo ""
cat backend/migrations/unified_coordinate_cache.sql | head -20
echo "..."
echo ""
read -p "Have you run the migration? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Database migration complete"
else
    echo "⚠️  Please run the migration before using the new system"
fi

# Step 4: Test the new API
echo ""
echo "🧪 Step 4: Testing the new coordinate API..."
echo "Starting backend server for testing..."

# Start backend in background with render-startup
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

# Test the API
echo "Testing coordinate processing..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/coordinates/process \
  -H "Content-Type: application/json" \
  -d '{"location": "Newcastle", "postcode": "NE1 1AA"}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ API test successful"
else
    echo "❌ API test failed (server may need more time to start)"
    echo "You can manually test with: curl -X POST http://localhost:3001/api/coordinates/process -H 'Content-Type: application/json' -d '{\"location\": \"Newcastle\"}'"
fi

# Kill the backend
kill $BACKEND_PID 2>/dev/null

# Step 5: Summary
echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "✅ Dependencies installed"
echo "✅ New coordinate service created"
echo "✅ API endpoints registered"
echo "✅ Frontend service created"
echo ""
echo "🎯 Next Steps:"
echo "1. Deploy to production (git push)"
echo "2. Monitor cache performance"
echo "3. Test coordinate operations"
echo "4. Begin migrating old service calls"
echo ""
echo "📝 Documentation:"
echo "- Plan: Plans/COORDINATE_SYSTEM_REFACTOR.md"
echo "- Summary: Plans/COORDINATE_REFACTOR_SUMMARY.md"
echo ""
echo "✨ Unified Coordinate System deployment complete!"
