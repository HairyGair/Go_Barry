#!/bin/bash

# Breakdown Guide - Phase 5 Production Deployment Script
# Deploys complete 18-flow rapid decision system to Render

set -e  # Exit on any error

echo "🎆 Deploying Breakdown Guide Phase 5 Complete System"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "Breakdown Guide" ]; then
    echo "❌ Error: Breakdown Guide directory not found"
    echo "Please run this script from the Go BARRY App root directory"
    exit 1
fi

# Verify all required files exist
echo "📋 Verifying deployment files..."

REQUIRED_FILES=(
    "Breakdown Guide/src/index.html"
    "Breakdown Guide/src/data/diagnostic-flows.js"
    "Breakdown Guide/src/rapid-wizard-engine.js"
    "Breakdown Guide/src/app.js"
    "Breakdown Guide/src/styles.css"
    "Breakdown Guide/src/rapid-wizard-styles.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ $file"
    fi
done

# Check diagnostic flows content
echo "🔍 Verifying Phase 5 content..."

# Count flows in diagnostic-flows.js
FLOW_COUNT=$(grep -o "'[^']*': {" "Breakdown Guide/src/data/diagnostic-flows.js" | wc -l | tr -d ' ')
if [ "$FLOW_COUNT" -ne 18 ]; then
    echo "❌ Error: Expected 18 flows, found $FLOW_COUNT"
    exit 1
else
    echo "✅ 18 diagnostic flows verified"
fi

# Check for Phase 5 indicators
if ! grep -q "Phase 5 Complete" "Breakdown Guide/src/index.html"; then
    echo "❌ Error: Phase 5 Complete not found in index.html"
    exit 1
else
    echo "✅ Phase 5 Complete status verified"
fi

# Check version numbers
if ! grep -q "Version 3.0" "Breakdown Guide/src/index.html"; then
    echo "❌ Error: Version 3.0 not found in index.html"
    exit 1
else
    echo "✅ Version 3.0 verified"
fi

# Verify all categories are present
echo "📊 Verifying flow categories..."

CATEGORIES=("safety_critical" "high_priority" "standard")
for category in "${CATEGORIES[@]}"; do
    if ! grep -q "category: '$category'" "Breakdown Guide/src/data/diagnostic-flows.js"; then
        echo "❌ Missing category: $category"
        exit 1
    else
        echo "✅ Category: $category"
    fi
done

# Create deployment directory
echo "📦 Preparing deployment package..."
DEPLOY_DIR="breakdown-guide-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy all necessary files
cp -r "Breakdown Guide/src/"* "$DEPLOY_DIR/"

# Create package.json for Render (even though it's static)
cat > "$DEPLOY_DIR/package.json" << EOF
{
  "name": "breakdown-guide-gne",
  "version": "3.0.0",
  "description": "Go North East Breakdown Guide - Phase 5 Complete - 18 Rapid Decision Flows",
  "main": "index.html",
  "scripts": {
    "start": "echo 'Static site - no build required'",
    "build": "echo 'No build step needed'"
  },
  "keywords": [
    "breakdown-guide",
    "go-north-east",
    "rapid-decision",
    "diagnostic-flows",
    "phase-5-complete"
  ],
  "author": "Go North East",
  "license": "ISC",
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

echo "🎉 Deployment package ready!"
echo "=============================="
echo ""
echo "📂 Deployment directory: $DEPLOY_DIR/"
echo "🌐 Target domain: breakdown.gobarry.co.uk"
echo "📊 System status: Phase 5 Complete - 18 flows operational"