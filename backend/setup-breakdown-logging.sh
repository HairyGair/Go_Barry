#!/bin/bash

# backend/setup-breakdown-logging.sh
# Setup script for the breakdown logging system

echo "🚀 Setting up Breakdown Logging System for Go BARRY..."
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install uuid
echo "✅ Dependencies installed"
echo ""

# Create the database table
echo "🗄️  Creating database table..."
echo "Please run the following SQL in your Supabase dashboard:"
echo ""
echo "-- Copy everything below this line --"
cat sql/breakdowns_schema.sql
echo "-- Copy everything above this line --"
echo ""
echo "Press Enter once you've created the table in Supabase..."
read

# Test the system
echo "🧪 Testing the breakdown logging system..."
node test-breakdown-logging.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add the frontend breakdownLogger.js to your public/js directory"
echo "2. Add the BreakdownLogs.jsx component to your components/admin directory"
echo "3. Update your index.html to include the breakdownLogger.js script"
echo "4. Integrate window.logBreakdown() calls into your wizard components"
echo ""
echo "📖 See BREAKDOWN_LOGGING_IMPLEMENTATION.md for detailed instructions"
