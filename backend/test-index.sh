# Post-Deployment Test - Run after updating backend
echo "🚀 Testing BARRY Comprehensive Backend Deployment"

# 1. Check version upgrade
echo "1. 📊 Version Check:"
VERSION=$(curl -s "https://go-barry.onrender.com/api/health" | jq -r '.version')
echo "   Current Version: $VERSION"

if [ "$VERSION" = "3.0-comprehensive" ]; then
    echo "   ✅ SUCCESS! Backend upgraded to comprehensive version"
else
    echo "   ❌ FAILED! Still showing old version: $VERSION"
    echo "   → Check if your /backend/index.js file was properly updated"
    exit 1
fi

# 2. Check data sources
echo ""
echo "2. 🔑 Data Sources Configuration:"
curl -s "https://go-barry.onrender.com/api/health" | jq '.dataSources'

# 3. Test main endpoint
echo ""
echo "3. 🚨 Testing Main Alerts Endpoint:"
ALERTS=$(curl -s "https://go-barry.onrender.com/api/alerts")
TOTAL=$(echo "$ALERTS" | jq '.metadata.totalAlerts')
echo "   Total Alerts: $TOTAL"

# 4. Check individual sources
echo ""
echo "4. 📊 Data Source Results:"
echo "$ALERTS" | jq '.metadata.sources' | while IFS= read -r line; do
    if [[ "$line" == *'"success": true'* ]]; then
        echo "   ✅ $line"
    elif [[ "$line" == *'"success": false'* ]]; then
        echo "   ❌ $line"
    else
        echo "   $line"
    fi
done

# 5. Performance check
echo ""
echo "5. ⚡ Performance:"
PROCESSING_TIME=$(echo "$ALERTS" | jq -r '.metadata.processingTime')
echo "   Processing Time: $PROCESSING_TIME"

# 6. Summary
echo ""
echo "6. 📈 Summary:"
if [ "$TOTAL" -gt 0 ]; then
    echo "   ✅ SUCCESS! Found $TOTAL alerts from comprehensive sources"
    echo "   🎯 Your BARRY backend is now fully operational!"
else
    echo "   ⚠️  No alerts found - this could be normal if:"
    echo "   • No traffic incidents in North East right now"
    echo "   • API keys need configuration"
    echo "   • APIs are experiencing issues"
fi

echo ""
echo "🎉 Comprehensive Backend Test Complete!"