#!/bin/bash

# Auto-start Breakdown Guide for Go BARRY integration
echo "🚀 Starting Breakdown Guide for Go BARRY..."

# Check if breakdown guide is already running on port 8080
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Breakdown Guide already running on port 8080"
else
    echo "🔄 Starting Breakdown Guide server..."
    cd "Breakdown Guide/src"
    python3 -m http.server 8080 &
    echo "✅ Breakdown Guide started on http://localhost:8080"
fi

echo ""
echo "📋 Usage:"
echo "1. The Breakdown Guide will open automatically when you click the card in Go BARRY"
echo "2. If it doesn't open, manually visit: http://localhost:8080"
echo ""
echo "🛑 To stop the breakdown guide server:"
echo "   pkill -f 'python3 -m http.server 8080'"