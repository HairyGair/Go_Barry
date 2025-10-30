#!/bin/bash

# Verify dashboard files have correct URLs on server

echo "========================================="
echo "Verifying Dashboard Files on Server"
echo "========================================="
echo ""

# Test if we can fetch the dashboard and check for correct URL
echo "Fetching SDC dashboard from server..."
DASHBOARD_CONTENT=$(curl -s https://breakdowns.gobarry.co.uk/dashboards/sdc-operations-dashboard.html)

if echo "$DASHBOARD_CONTENT" | grep -q "https://breakdowns.gobarry.co.uk/api"; then
    echo "✅ SUCCESS - Dashboard has correct cPanel URL"
    echo "   Found: https://breakdowns.gobarry.co.uk/api"
else
    echo "❌ PROBLEM - Dashboard still has old URL"
    if echo "$DASHBOARD_CONTENT" | grep -q "https://go-barry.onrender.com"; then
        echo "   Found: https://go-barry.onrender.com (OLD URL)"
        echo ""
        echo "   This means the files weren't uploaded or upload failed."
    fi
fi

echo ""

# Check for public endpoints
if echo "$DASHBOARD_CONTENT" | grep -q "/api/public/breakdowns/live"; then
    echo "✅ SUCCESS - Dashboard using public endpoints"
    echo "   Found: /api/public/breakdowns/live"
else
    echo "❌ PROBLEM - Dashboard using protected endpoints"
    if echo "$DASHBOARD_CONTENT" | grep -q "/api/breakdowns/live"; then
        echo "   Found: /api/breakdowns/live (requires auth)"
    fi
fi

echo ""
echo "========================================="
echo "Recommendation:"
echo "========================================="

if echo "$DASHBOARD_CONTENT" | grep -q "https://breakdowns.gobarry.co.uk/api" && echo "$DASHBOARD_CONTENT" | grep -q "/api/public/breakdowns/live"; then
    echo ""
    echo "Server files are CORRECT! ✅"
    echo ""
    echo "Your browser is showing old cached files."
    echo ""
    echo "Fix: Clear browser cache or use Incognito window"
    echo ""
else
    echo ""
    echo "Server files are OLD! ❌"
    echo ""
    echo "The upload may have failed or files went to wrong location."
    echo ""
    echo "Please re-upload the files via CyberDuck to:"
    echo "  publichtml/breakdowns.gobarry.co.uk/dashboards/"
    echo ""
fi
