#!/bin/bash
# Restart the Go North East Breakdown Guide App
# Run this after environment variable changes

echo "🔄 Restarting Go North East Breakdown Guide..."
echo ""

# Navigate to frontend directory
cd frontend

# Kill any running processes on port 3000
echo "⏹️ Stopping existing server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clear node modules cache if needed
echo "🧹 Clearing cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "✅ App configured in NO AUTH mode"
echo "✅ You'll be automatically logged in as 'Anthony Gair'"
echo "✅ No password required!"
echo ""
npm run dev
