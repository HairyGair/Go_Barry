#!/bin/bash

# backend/fix-breakdown-auth.sh
# Quick fix for the "No API key found" error

echo "🔧 Fixing Breakdown Authentication Error..."
echo ""

# Check if we have a .env file
if [ ! -f ".env" ]; then
    echo "❌ No .env file found!"
    echo "Creating one from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Check if Supabase variables are set
if grep -q "YOUR_.*_KEY_HERE" .env || ! grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env; then
    echo "⚠️  Your .env file needs Supabase configuration!"
    echo ""
    echo "📝 Please edit your .env file and add:"
    echo ""
    echo "SUPABASE_URL=your-supabase-project-url"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "🔍 To find these values:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select your project" 
    echo "3. Go to Settings → API"
    echo "4. Copy the Project URL and service_role key"
    echo ""
    echo "After adding these values, run this script again."
    exit 1
fi

echo "✅ Supabase configuration found in .env"
echo ""

# Offer to restart the server
echo "The server needs to be restarted to load the new configuration."
echo ""
read -p "Would you like me to find and show the server process? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔍 Looking for Node.js processes..."
    ps aux | grep "node.*index.js\|node.*render-startup.js" | grep -v grep
    echo ""
    echo "To restart the server:"
    echo "1. Kill the process with: kill <PID>"
    echo "2. Start it again with: npm start"
else
    echo ""
    echo "📝 To fix the issue:"
    echo "1. Stop the server (Ctrl+C in the server terminal)"
    echo "2. Start it again with: npm start"
fi

echo ""
echo "After restarting, test with:"
echo "curl http://localhost:3001/api/admin-breakdowns"
echo ""
echo "Expected response: {\"success\":true,\"logs\":[],\"pagination\":{...}}"
