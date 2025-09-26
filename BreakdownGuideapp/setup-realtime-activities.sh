#!/bin/bash
# Quick setup script for Real-Time Activity System

echo "🚀 Setting up Real-Time Activity System for Go BARRY"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the root directory of the Go BARRY project"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "1. Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check environment variables
echo ""
echo "2. Checking environment variables..."

if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found"
    echo "Please create backend/.env with:"
    echo "SUPABASE_URL=your-supabase-url"
    echo "SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

# Source the .env file to check variables
set -a
source backend/.env
set +a

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required environment variables in backend/.env:"
    echo "   SUPABASE_URL: ${SUPABASE_URL:+✅ Set}${SUPABASE_URL:-❌ Missing}"
    echo "   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅ Set}${SUPABASE_ANON_KEY:-❌ Missing}"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo ""
echo "3. Installing dependencies..."

echo "Installing backend dependencies..."
cd backend
npm install --silent
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo "✅ Dependencies installed"

# Test database connection
echo ""
echo "4. Testing database connection..."

cd backend
node -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

supabase.from('breakdowns').select('id').limit(1).then(({ data, error }) => {
    if (error && !error.message.includes('relation \"breakdowns\" does not exist')) {
        console.log('❌ Database connection failed:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Database connection successful');
    }
}).catch(err => {
    console.log('❌ Database connection error:', err.message);
    process.exit(1);
});
" 2>/dev/null || {
    echo "❌ Database connection test failed"
    echo "Please check your Supabase configuration"
    exit 1
}

cd ..

# Run activity system test
echo ""
echo "5. Testing activity system..."

cd backend
if node test-activity-system.js 2>/dev/null; then
    echo "✅ Activity system test passed"
else
    echo "❌ Activity system test failed"
    echo ""
    echo "This might be because:"
    echo "1. Activities table doesn't exist - run the migration:"
    echo "   psql -h your-host -U postgres -d postgres -f backend/migrations/create_activities_table.sql"
    echo "2. Real-time not enabled in Supabase - enable in Dashboard > Database > Replication"
    echo "3. Server not running - this is expected for setup"
    echo ""
    echo "You can continue with the setup and run the test later."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

cd ..

# Make scripts executable
echo ""
echo "6. Setting up scripts..."

chmod +x setup-realtime-activities.sh 2>/dev/null || true
chmod +x backend/test-activity-system.js 2>/dev/null || true

echo "✅ Scripts configured"

# Final instructions
echo ""
echo "🎉 Real-Time Activity System Setup Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. 🗄️  Set up the database table (if not already done):"
echo "   Run this SQL in your Supabase SQL editor or psql:"
echo "   📄 backend/migrations/create_activities_table.sql"
echo ""
echo "2. ⚡ Enable real-time in Supabase Dashboard:"
echo "   - Go to Database → Replication"
echo "   - Add 'activities' table to replication"
echo "   - Enable real-time for the table"
echo ""
echo "3. 🚀 Start the servers:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "4. 🧪 Test the system:"
echo "   cd backend && node test-activity-system.js"
echo ""
echo "5. ✨ Try it out:"
echo "   - Open the app in your browser"
echo "   - Start a breakdown assessment wizard"
echo "   - Watch the Live Activity Feed update in real-time!"
echo ""
echo "📚 Documentation: REAL_TIME_ACTIVITY_SYSTEM.md"
echo ""
echo "Happy coding! 🎊"