#!/bin/bash

# Make the test script executable
chmod +x test-fleet-integration.mjs

echo "✅ Test script is now executable"
echo "Running fleet integration tests..."
echo ""

# Run the test script
node test-fleet-integration.mjs
