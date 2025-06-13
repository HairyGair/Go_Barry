#!/bin/bash
echo "🔧 Committing WebSocket authentication fix..."
cd "/Users/anthony/Go BARRY App"
git add Go_BARRY/app/browser-main.jsx
git commit -m "Fix: Force backend supervisor ID for WebSocket authentication testing"
git push origin main
echo "✅ Deployed WebSocket fix!"
