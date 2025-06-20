#!/bin/bash
# Script to verify Supabase configuration

echo "🔍 Checking Supabase Configuration..."
echo ""

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ No .env file found in backend directory!"
    echo "   Please create one with your Supabase credentials."
    exit 1
fi

# Check if Supabase variables are set
if grep -q "SUPABASE_URL" .env && grep -q "SUPABASE_ANON_KEY" .env; then
    echo "✅ Supabase environment variables found in .env"
    
    # Test the connection
    echo ""
    echo "🧪 Testing Supabase connection..."
    node -e "
    import dotenv from 'dotenv';
    import { createClient } from '@supabase/supabase-js';
    
    dotenv.config();
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    
    // Test query
    supabase
        .from('supervisor_sessions')
        .select('count', { count: 'exact' })
        .then(({ data, error, count }) => {
            if (error) {
                console.log('❌ Connection failed:', error.message);
            } else {
                console.log('✅ Connection successful!');
                console.log('📊 Sessions table has', count || 0, 'records');
            }
        })
        .catch(err => {
            console.log('❌ Error:', err.message);
        });
    " --input-type=module
else
    echo "❌ Supabase environment variables not found in .env!"
    echo "   Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file."
fi