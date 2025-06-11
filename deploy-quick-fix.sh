#!/bin/bash
# Quick fix for supervisorSession variable error

echo "🔧 Quick fix: Adding missing supervisorSession variable..."

# Add the fix
git add Go_BARRY/app/browser-main.jsx

# Commit the fix
git commit -m "Fix: Add missing supervisorSession destructuring in browser-main.jsx

- Resolves 'Can't find variable: supervisorSession' error
- Now supervisorSession.supervisor.backendId is accessible for WebSocket auth"

# Push the fix
git push origin main

echo "✅ Quick fix deployed!"
echo "🔗 Test at: https://gobarry.co.uk"
