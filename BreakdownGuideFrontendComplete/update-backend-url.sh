#!/bin/bash

# Update Frontend to Use New Backend URL
# This script updates all frontend files to use the new dedicated backend

echo "🔄 Frontend Backend URL Updater"
echo "==============================="
echo ""

# Get the new backend URL
read -p "Enter your new Render backend URL (e.g., https://gne-breakdown-backend.onrender.com): " NEW_URL

if [ -z "$NEW_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo ""
echo "📝 Updating frontend files to use: $NEW_URL"
echo ""

# Base directory
BASE_DIR="/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete"

# Files to update
FILES_TO_UPDATE=(
    "dashboard/sdc-operations-dashboard.html"
    "dashboard/engineering-dashboard-live.html"
    "dashboard/management-overview-dashboard.html"
    "breakdown-guide/supervisorBreakdownLogger.js"
    "breakdown-guide/components/BreakdownTracker.js"
    "breakdown-guide/breakdown-analytics.js"
    "breakdown-guide/breakdown-analytics-integration.js"
    "tests/test-breakdown-api.js"
)

# Update each file
for file in "${FILES_TO_UPDATE[@]}"; do
    FULL_PATH="$BASE_DIR/$file"
    
    if [ -f "$FULL_PATH" ]; then
        echo "📄 Updating: $file"
        
        # Replace various backend URL patterns
        sed -i.bak "s|https://go-barry.onrender.com|$NEW_URL|g" "$FULL_PATH"
        sed -i.bak "s|http://localhost:3003|$NEW_URL|g" "$FULL_PATH"
        sed -i.bak "s|http://localhost:8080|$NEW_URL|g" "$FULL_PATH"
        sed -i.bak "s|const BACKEND_URL = '.*'|const BACKEND_URL = '$NEW_URL'|g" "$FULL_PATH"
        
        # Remove backup file
        rm "${FULL_PATH}.bak"
        
        echo "   ✅ Updated"
    else
        echo "   ⚠️  File not found: $file"
    fi
done

# Create a config file for easy reference
CONFIG_FILE="$BASE_DIR/backend-config.js"
echo "// Backend Configuration" > "$CONFIG_FILE"
echo "// Generated: $(date)" >> "$CONFIG_FILE"
echo "window.BACKEND_CONFIG = {" >> "$CONFIG_FILE"
echo "  API_URL: '$NEW_URL'," >> "$CONFIG_FILE"
echo "  BREAKDOWNS_API: '$NEW_URL/api/breakdowns'," >> "$CONFIG_FILE"
echo "  ANALYTICS_API: '$NEW_URL/api/breakdown-analytics'," >> "$CONFIG_FILE"
echo "  FLEET_API: '$NEW_URL/api/fleet-database'," >> "$CONFIG_FILE"
echo "  AUTH_API: '$NEW_URL/api/supervisor'," >> "$CONFIG_FILE"
echo "  HEALTH_CHECK: '$NEW_URL/api/health'" >> "$CONFIG_FILE"
echo "};" >> "$CONFIG_FILE"

echo ""
echo "✅ Created central config file: backend-config.js"
echo ""
echo "✨ Update Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the frontend with: open $BASE_DIR/dashboard/sdc-operations-dashboard.html"
echo "2. Check health endpoint: curl $NEW_URL/api/health"
echo "3. Include backend-config.js in your HTML files for centralized config"
echo ""
echo "💡 To use central config, add to your HTML:"
echo '   <script src="/backend-config.js"></script>'
echo '   Then use: window.BACKEND_CONFIG.API_URL'
echo ""
echo "🎉 Frontend is now configured to use: $NEW_URL"
