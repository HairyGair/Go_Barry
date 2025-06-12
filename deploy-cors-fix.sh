#!/bin/bash
chmod +x "$0"

echo "🚀 Deploying CORS fix for User-Agent header..."

# Add and commit
git add backend/index.js
git commit -m "Fix: Add User-Agent to allowed CORS headers"
git push origin main

echo "✅ CORS fix deployed!"
echo ""
echo "⏱️ Wait 3-5 minutes for Render to rebuild"
echo ""
echo "Then test the Supervisor-Display connection again!"
