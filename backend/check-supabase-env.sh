#!/bin/bash

# Quick script to check and fix Supabase connection

echo "🔍 Checking Supabase environment variables..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ No .env file found!"
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_key_here
# Or use:
# SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# Server Port
PORT=3001
EOF
    echo "✅ Created .env template - add your Supabase credentials!"
else
    echo "✅ .env file exists"
    
    # Check for Supabase URL
    if grep -q "SUPABASE_URL" .env; then
        echo "✅ SUPABASE_URL found"
    else
        echo "❌ SUPABASE_URL missing - add it to .env!"
    fi
    
    # Check for Supabase key
    if grep -q "SUPABASE_SERVICE_KEY\|SUPABASE_SERVICE_ROLE_KEY" .env; then
        echo "✅ Supabase key found"
    else
        echo "❌ Supabase key missing - add SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY to .env!"
    fi
fi

echo ""
echo "📝 To get your Supabase credentials:"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to Settings → API"
echo "4. Copy:"
echo "   - Project URL → SUPABASE_URL"
echo "   - service_role key (secret) → SUPABASE_SERVICE_KEY"
echo ""
echo "After adding credentials, restart the backend:"
echo "npm run dev"
