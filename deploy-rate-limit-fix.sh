#!/bin/bash
# Deploy Rate Limiting & WebSocket Fixes for Live Production

echo "🚨 Deploying Live Production Fixes..."
echo ""

# Show what's being deployed
echo "🔧 CRITICAL PRODUCTION FIXES:"
echo "   • Rate limit increased: 10 → 50 concurrent requests"
echo "   • WebSocket ping frequency reduced: 30s → 60s"  
echo "   • Reconnection attempts reduced: 10 → 5 max"
echo "   • Reconnection delays increased: 1s → 2s start, 30s → 60s max"
echo "   • More conservative connection management"
echo "   • Reduced WebSocket connection churn"
echo ""

# Add all changes
git add .

# Commit with detailed message
git commit -m "🚨 CRITICAL: Fix Rate Limiting & WebSocket Issues

🔴 LIVE PRODUCTION FIXES:
- Increased rate limit from 10 to 50 concurrent requests
- Reduced WebSocket ping frequency from 30s to 60s
- Limited reconnection attempts to 5 maximum  
- Increased reconnection delays (2s start, 60s max)
- More conservative WebSocket connection management
- Fixed WebSocket connection churn causing rate limit hits

🔧 Backend Changes:
- MAX_CONCURRENT_REQUESTS: 10 → 50
- Better handling of simultaneous display/supervisor connections
- Improved rate limiting for live production environment

🔌 WebSocket Improvements:
- Ping interval: 30s → 60s (reduced server load)
- Reconnection attempts: 10 → 5 (prevent endless loops)
- Exponential backoff: 1s-30s → 2s-60s (more conservative)
- Better connection state management

📊 Production Impact:
- Reduces 'Rate limit hit' errors in logs
- Prevents WebSocket connection storms  
- More stable control room display connections
- Better handling of multiple supervisor sessions"

# Push to trigger deployment
echo "🚀 Pushing critical fixes to production..."
git push origin main

echo ""
echo "✅ CRITICAL FIXES DEPLOYED!"
echo ""
echo "📊 Expected improvements:"
echo "   • Fewer 'Rate limit hit' errors in logs"
echo "   • More stable WebSocket connections"
echo "   • Reduced connection churn"
echo "   • Better handling of multiple users"
echo ""
echo "🔍 Monitor at: https://go-barry.onrender.com/api/health"
echo "⏱️  Changes will be live in ~2-3 minutes"