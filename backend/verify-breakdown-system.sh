#!/bin/bash

# backend/verify-breakdown-system.sh
# Quick verification that breakdown system is working

echo "🔍 Verifying Breakdown Logging System..."
echo ""

# Check if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Start with: npm start"
    exit 1
fi

# Check breakdown endpoints
echo ""
echo "Checking endpoints..."

# Admin breakdowns
ADMIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3001/api/admin-breakdowns)
HTTP_CODE=$(echo "$ADMIN_RESPONSE" | grep HTTP_CODE | cut -d: -f2)
BODY=$(echo "$ADMIN_RESPONSE" | grep -v HTTP_CODE)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Admin endpoint working"
    if echo "$BODY" | grep -q '"success":true'; then
        LOG_COUNT=$(echo "$BODY" | grep -o '"logs":\[' | wc -l)
        echo "   Response is valid JSON with breakdown logs"
    fi
elif [ "$HTTP_CODE" = "500" ]; then
    if echo "$BODY" | grep -q "No API key"; then
        echo "❌ Missing Supabase configuration in .env"
    elif echo "$BODY" | grep -q "relation"; then
        echo "⚠️  Database table not created yet"
    fi
else
    echo "❌ Unexpected response: $HTTP_CODE"
fi

# Recent breakdowns
echo ""
RECENT_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/breakdowns/recent)
if [ "$RECENT_CODE" = "200" ]; then
    echo "✅ Recent breakdowns endpoint working"
else
    echo "❌ Recent breakdowns endpoint error: $RECENT_CODE"
fi

# Statistics
STATS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin-breakdowns/stats)
if [ "$STATS_CODE" = "200" ]; then
    echo "✅ Statistics endpoint working"
else
    echo "❌ Statistics endpoint error: $STATS_CODE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "For detailed testing run: node test-breakdown-complete.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
