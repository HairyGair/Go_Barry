#!/bin/bash
# Start backend without Supabase for development

cd "$(dirname "$0")"

# Set minimal environment variables
export PORT=3001
export NODE_ENV=development
export ENABLE_FALLBACK_AUTH=true
export SUPABASE_URL=https://example.com
export SUPABASE_ANON_KEY=dummy_key
export SUPABASE_SERVICE_KEY=dummy_key

echo "🚀 Starting backend in development mode (no Supabase)..."
echo "⚠️  Note: Roadworks data will be limited without real Supabase keys"

# Start the backend
node render-startup.js
