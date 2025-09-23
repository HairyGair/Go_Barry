#!/bin/bash

# Script to add missing columns to the breakdowns table
echo "🔧 Adding missing columns to breakdowns table..."

# Check if we have database connection details
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables"
    exit 1
fi

# Extract database URL from Supabase URL
DB_URL=$(echo "$SUPABASE_URL" | sed 's/https:\/\///' | sed 's/\.supabase\.co/.pooler.supabase.com/')

echo "📝 SQL Commands to execute:"
echo "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_description TEXT;"
echo "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"

echo ""
echo "🌐 Manual Instructions:"
echo "1. Open your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Navigate to your project"
echo "3. Go to 'SQL Editor' in the sidebar"
echo "4. Create a new query"
echo "5. Copy and paste these SQL commands:"
echo ""
echo "-- Add missing columns to breakdowns table"
echo "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_description TEXT;"
echo "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
echo ""
echo "6. Click 'Run' to execute the SQL"
echo "7. Test the wizard again after running these commands"

echo ""
echo "✅ After running the SQL commands above, your wizard should work!"