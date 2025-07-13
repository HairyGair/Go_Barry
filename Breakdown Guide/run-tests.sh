#!/bin/bash

# Go North East - Breakdown Guide
# Test Runner Script

echo "🧪 Breakdown Guide Test Suite"
echo "============================"
echo ""

# Check if Python is available for simple HTTP server
if command -v python3 &> /dev/null; then
    echo "Starting local server..."
    echo "Navigate to: http://localhost:8080/tests/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    cd "$(dirname "$0")/.."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Starting local server..."
    echo "Navigate to: http://localhost:8080/tests/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    cd "$(dirname "$0")/.."
    python -m SimpleHTTPServer 8080
else
    echo "❌ Python not found. Please install Python or use a local web server."
    echo ""
    echo "Alternative: Open the following file directly in your browser:"
    echo "$(pwd)/tests/index.html"
fi