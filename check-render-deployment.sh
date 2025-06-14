#!/bin/bash
# check-render-deployment.sh
# Monitor Render deployment status for enhanced data feeds

echo "🔍 Checking Render Deployment Status"
echo "===================================="

API_BASE="https://go-barry.onrender.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check endpoint with timeout
check_endpoint() {
    local endpoint=$1
    local description=$2
    
    print_status "Testing $description..."
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -w "%{http_code}" --max-time 30 "$API_BASE$endpoint" -o /tmp/response.json)
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            print_success "$description: ✅ Active (HTTP $http_code)"
            
            # Show key information from response
            if [ -f "/tmp/response.json" ]; then
                if command -v jq >/dev/null 2>&1; then
                    # Parse JSON if jq is available
                    if [ "$endpoint" = "/api/health-extended" ]; then
                        polling_status=$(jq -r '.pollingStatus.overallStatus // "Unknown"' /tmp/response.json 2>/dev/null)
                        services_count=$(jq -r '.services | length // 0' /tmp/response.json 2>/dev/null)
                        echo "      Polling Status: $polling_status"
                        echo "      Services Active: $services_count"
                    elif [ "$endpoint" = "/api/alerts-enhanced" ]; then
                        incidents_count=$(jq -r '.incidents | length // 0' /tmp/response.json 2>/dev/null)
                        sources_active=$(jq -r '.metadata.statistics.sourcesSuccessful // 0' /tmp/response.json 2>/dev/null)
                        echo "      Incidents: $incidents_count"
                        echo "      Sources Active: $sources_active"
                    fi
                else
                    # Show first few lines if no jq
                    echo "      Response: $(head -c 200 /tmp/response.json)..."
                fi
            fi
            return 0
        elif [ "$http_code" = "503" ] || [ "$http_code" = "502" ]; then
            print_warning "$description: ⏳ Service starting (HTTP $http_code)"
            return 1
        else
            print_error "$description: ❌ Failed (HTTP $http_code)"
            return 1
        fi
    else
        print_error "curl not available for testing"
        return 1
    fi
}

# Check deployment readiness
print_status "Waiting for Render deployment to complete..."
echo "This may take 2-3 minutes for first deployment after push..."
echo ""

# Try checking endpoints with retries
max_retries=10
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    echo "🔄 Attempt $((retry_count + 1))/$max_retries"
    
    # Check basic health first
    if check_endpoint "/api/health" "Basic Health Check"; then
        echo ""
        
        # Check enhanced health
        if check_endpoint "/api/health-extended" "Enhanced Health Check"; then
            echo ""
            
            # Check enhanced alerts
            if check_endpoint "/api/alerts-enhanced" "Enhanced Alerts Endpoint"; then
                echo ""
                
                # Check new polling status endpoint
                if check_endpoint "/api/polling-status" "Polling Status Endpoint"; then
                    echo ""
                    print_success "🎉 All enhanced endpoints are active!"
                    print_success "✅ Render deployment completed successfully"
                    
                    echo ""
                    echo "📋 Next Steps:"
                    echo "1. Run: node test-enhanced-data-feeds.js"
                    echo "2. Test supervisor interface: https://gobarry.co.uk/browser-main"
                    echo "3. Test map button functionality"
                    echo "4. Monitor: $API_BASE/api/health-extended"
                    
                    exit 0
                fi
            fi
        fi
    fi
    
    retry_count=$((retry_count + 1))
    
    if [ $retry_count -lt $max_retries ]; then
        print_status "Waiting 30 seconds before next check..."
        sleep 30
        echo ""
    fi
done

# If we get here, deployment may still be in progress
print_warning "Deployment may still be in progress or experiencing issues"
echo ""
echo "📋 Manual Check Options:"
echo "1. Visit Render Dashboard: https://dashboard.render.com"
echo "2. Check deployment logs for 'go-barry' service"
echo "3. Wait a few more minutes and run this script again"
echo "4. Try manual endpoints:"
echo "   • $API_BASE/api/health"
echo "   • $API_BASE/api/health-extended"
echo "   • $API_BASE/api/polling-status"

echo ""
print_status "If deployment is taking longer than 10 minutes, check Render logs for issues"

# Cleanup
rm -f /tmp/response.json
