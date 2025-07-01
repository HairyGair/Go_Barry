#!/bin/bash

echo "📦 Installing test dependencies..."

# Check if chrome-launcher is installed
if ! npm list chrome-launcher >/dev/null 2>&1; then
    echo "Installing chrome-launcher..."
    npm install --save-dev chrome-launcher
fi

# Verify all test dependencies
echo ""
echo "✅ Verifying test dependencies:"
npm list puppeteer lighthouse @axe-core/puppeteer chrome-launcher 2>/dev/null | grep -E "(puppeteer|lighthouse|@axe-core/puppeteer|chrome-launcher)"

echo ""
echo "✅ Test dependencies installed!"
