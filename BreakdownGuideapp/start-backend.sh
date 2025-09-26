#!/bin/bash

echo "🚀 Starting Go North East Breakdown Guide Backend Server"
echo "==========================================="

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found in backend directory"
    echo "Creating .env file with local development settings..."
    cat > .env << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=3001

# Supabase Configuration - Add your credentials
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
    echo "✅ .env file created. Please update with your Supabase credentials."
fi

# Start the server
echo ""
echo "🌟 Starting server on port 3001..."
echo "📍 API Base URL: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==========================================="

npm start
