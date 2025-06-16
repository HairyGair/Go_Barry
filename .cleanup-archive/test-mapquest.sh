#!/bin/bash

echo "🔧 Testing MapQuest API Fix..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Run the test
node test-mapquest-fix.js "$@"
