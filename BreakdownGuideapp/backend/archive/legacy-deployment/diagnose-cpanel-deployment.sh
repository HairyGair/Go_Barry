#!/bin/bash
#
# Go BARRY Backend - cPanel Deployment Diagnostics
#
# This script helps identify where the backend is deployed and how it's running
# Run this on the cPanel server via SSH to diagnose deployment issues
#
# Usage: ssh gobarryco@gobarry.co.uk 'bash -s' < diagnose-cpanel-deployment.sh
#

echo "=========================================="
echo "🔍 Go BARRY Backend Deployment Diagnostics"
echo "=========================================="
echo ""
echo "Server: $(hostname)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo ""

# ============================================
# STEP 1: Find Backend Deployment Location
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 STEP 1: Finding Backend Deployment Location"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check common deployment directories
echo "Checking common directories:"
echo ""

for dir in \
    ~/gobarry-backend-deploy \
    ~/backend \
    ~/api \
    ~/public_html/api \
    ~/www/api \
    ~/.local/share/lsws/go-barry-api \
    ~/repositories/go-barry-api
do
    if [ -d "$dir" ]; then
        echo "  ✅ Found: $dir"
        if [ -f "$dir/server.js" ]; then
            echo "     → Contains server.js ✓"
        fi
        if [ -f "$dir/package.json" ]; then
            echo "     → Contains package.json ✓"
        fi
        if [ -d "$dir/routes" ]; then
            echo "     → Contains routes/ ✓"
            if [ -f "$dir/routes/supervisors.js" ]; then
                echo "     → Contains routes/supervisors.js ✓"
            else
                echo "     → MISSING routes/supervisors.js ✗"
            fi
        fi
        echo ""
    fi
done

# Search for server.js files
echo ""
echo "Searching for all server.js files in home directory:"
find ~ -name "server.js" -type f 2>/dev/null | grep -v node_modules | head -10
echo ""

# ============================================
# STEP 2: Check Running Node Processes
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 STEP 2: Checking Running Node.js Processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ps aux | grep -v grep | grep node > /dev/null; then
    echo "✅ Node.js processes found:"
    echo ""
    ps aux | grep -v grep | grep node | while read line; do
        echo "  $line"
    done
    echo ""
else
    echo "❌ No Node.js processes running"
    echo ""
fi

# Check for Passenger processes
echo "Checking for Passenger processes:"
if ps aux | grep -v grep | grep -i passenger > /dev/null; then
    echo "  ✅ Passenger is running"
    ps aux | grep -v grep | grep -i passenger | head -5
else
    echo "  ❌ No Passenger processes found"
fi
echo ""

# ============================================
# STEP 3: Check Application Startup Method
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STEP 3: Detecting Application Startup Method"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for CloudLinux Node.js selector
if command -v cloudlinux-selector &> /dev/null; then
    echo "✅ CloudLinux Node.js Selector available"
    echo ""
    echo "   Listing configured apps:"
    cloudlinux-selector list --json 2>/dev/null || echo "   (Unable to list apps)"
    echo ""
else
    echo "❌ CloudLinux Node.js Selector not found"
fi

# Check for cPanel Node.js configuration
if [ -f ~/.cpanel/nodeapp/apps.json ]; then
    echo "✅ cPanel Node.js App configuration found:"
    echo ""
    cat ~/.cpanel/nodeapp/apps.json 2>/dev/null || echo "   (Unable to read config)"
    echo ""
else
    echo "❌ cPanel Node.js App configuration not found"
fi

# Check for Passenger configuration
echo ""
echo "Checking for Passenger configuration files:"
for config in \
    ~/public_html/.htaccess \
    ~/www/.htaccess \
    ~/api/.htaccess \
    ~/backend/.htaccess
do
    if [ -f "$config" ]; then
        echo "  ✅ Found: $config"
        echo "     Content:"
        cat "$config" | head -20
        echo ""
    fi
done

# Check for PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 found"
    echo ""
    pm2 list
    echo ""
else
    echo "❌ PM2 not installed"
fi

echo ""

# ============================================
# STEP 4: Check Port Bindings
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 STEP 4: Checking Port Bindings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v ss &> /dev/null; then
    echo "Active listening ports (user processes only):"
    ss -tlnp 2>/dev/null | grep LISTEN || echo "  (Unable to query ports)"
elif command -v netstat &> /dev/null; then
    echo "Active listening ports (user processes only):"
    netstat -tlnp 2>/dev/null | grep LISTEN || echo "  (Unable to query ports)"
else
    echo "❌ Unable to check ports (ss/netstat not available)"
fi
echo ""

# ============================================
# STEP 5: Check Environment Configuration
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  STEP 5: Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js version
echo "Node.js version:"
node --version 2>/dev/null || echo "  ❌ Node.js not found in PATH"
echo ""

# Check npm version
echo "npm version:"
npm --version 2>/dev/null || echo "  ❌ npm not found in PATH"
echo ""

# Check for .env files
echo "Checking for .env files:"
for dir in \
    ~/gobarry-backend-deploy \
    ~/backend \
    ~/api
do
    if [ -f "$dir/.env" ]; then
        echo "  ✅ Found: $dir/.env"
        echo "     PORT: $(grep -E '^PORT=' "$dir/.env" 2>/dev/null || echo 'not set')"
        echo "     DB_HOST: $(grep -E '^DB_HOST=' "$dir/.env" 2>/dev/null || echo 'not set')"
    fi
done
echo ""

# ============================================
# STEP 6: Check Logs
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 STEP 6: Recent Application Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check common log locations
for log in \
    ~/logs/stderr.log \
    ~/logs/stdout.log \
    ~/logs/nodejs.log \
    ~/backend/server.log \
    ~/gobarry-backend-deploy/server.log \
    ~/.pm2/logs/*.log
do
    if [ -f "$log" ]; then
        echo "📄 Log: $log"
        echo "   Last 10 lines:"
        tail -10 "$log" 2>/dev/null || echo "   (Unable to read log)"
        echo ""
    fi
done

# ============================================
# STEP 7: Test API Endpoints
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 STEP 7: Testing API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test health endpoint
echo "Testing: https://api.breakdowns.gobarry.co.uk/api/health"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.breakdowns.gobarry.co.uk/api/health 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo "  ✅ Health endpoint responding (200 OK)"
    curl -s https://api.breakdowns.gobarry.co.uk/api/health 2>/dev/null | head -5
else
    echo "  ❌ Health endpoint not responding (HTTP $HEALTH)"
fi
echo ""

# Test supervisors endpoint
echo "Testing: https://api.breakdowns.gobarry.co.uk/api/supervisors"
SUPS=$(curl -s -o /dev/null -w "%{http_code}" https://api.breakdowns.gobarry.co.uk/api/supervisors 2>/dev/null || echo "000")
if [ "$SUPS" = "200" ]; then
    echo "  ✅ Supervisors endpoint responding (200 OK)"
else
    echo "  ❌ Supervisors endpoint not responding (HTTP $SUPS)"
fi
echo ""

# ============================================
# SUMMARY & RECOMMENDATIONS
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY & RECOMMENDATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Determine deployment directory
DEPLOY_DIR=""
if [ -d ~/gobarry-backend-deploy ]; then
    DEPLOY_DIR="~/gobarry-backend-deploy"
elif [ -d ~/backend ]; then
    DEPLOY_DIR="~/backend"
elif [ -d ~/api ]; then
    DEPLOY_DIR="~/api"
fi

if [ -n "$DEPLOY_DIR" ]; then
    echo "✅ Likely deployment directory: $DEPLOY_DIR"
    echo ""
    echo "To deploy the fixed backend:"
    echo "  1. Upload gobarry-backend.zip to home directory via Cyberduck"
    echo "  2. Run these commands:"
    echo ""
    echo "     # Backup current deployment"
    echo "     mv $DEPLOY_DIR ${DEPLOY_DIR}-backup-\$(date +%Y%m%d-%H%M%S)"
    echo ""
    echo "     # Extract new deployment"
    echo "     unzip -q ~/gobarry-backend.zip -d $DEPLOY_DIR"
    echo ""
    echo "     # Restart application"
    echo "     cd $DEPLOY_DIR && mkdir -p tmp && touch tmp/restart.txt"
    echo ""
else
    echo "⚠️  Unable to determine deployment directory"
    echo ""
    echo "Please review the directory listings above and identify"
    echo "where the backend is currently deployed."
fi

echo ""
echo "=========================================="
echo "✅ Diagnostics Complete"
echo "=========================================="
