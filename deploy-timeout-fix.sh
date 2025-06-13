#!/bin/bash

echo "🔧 Deploying supervisor auto-timeout feature..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add supervisor auto-timeout after 10 minutes inactivity - fixes duplicate sessions

- Sessions automatically expire after 10 minutes of inactivity
- Cleanup runs every 60 seconds to remove inactive sessions
- Activity tracking middleware updates lastActivity on API calls
- Added /timeout-info, /cleanup-sessions, enhanced /debug/sessions endpoints
- Prevents duplicate supervisor logins (12 supervisors, 5 same person issue)
- Backend-only change, frontend automatically compatible"

# Push to trigger Render deployment
git push origin main

echo "✅ Deployment triggered! Auto-timeout will be live in ~2 minutes"
echo "🎯 Sessions now timeout after 10 minutes of inactivity"
echo "🧹 Cleanup runs every 60 seconds"
echo "📊 Monitor at: https://go-barry.onrender.com/api/supervisor/debug/sessions"
