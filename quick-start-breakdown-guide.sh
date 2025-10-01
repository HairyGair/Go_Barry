#!/bin/bash
# Quick Start Script for Go North East Breakdown Guide
echo "🚌 Go North East Breakdown Guide - Quick Start"
echo "=============================================="
echo ""

# Navigate to the directory
cd "/Users/anthony/Go BARRY App"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install required dependencies for mock server if not present
if ! npm list express > /dev/null 2>&1; then
    echo "📦 Installing dependencies..."
    npm install express cors --save
fi

echo "🚀 Starting mock API server on port 3002..."
echo ""
echo "🌐 Your Breakdown Guide will be available at:"
echo "   📊 Dashboard: http://localhost:3002/sdc-operations-dashboard.html"
echo "   🔧 Breakdown Guide: http://localhost:3002/breakdown-guide/index-modern.html"
echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start the mock server
node mock-api-server.js
