#!/bin/bash

# Make the setup scripts executable
chmod +x backend/scripts/setup-breakdown-analytics.js
chmod +x backend/test-breakdown-analytics.js
chmod +x make-setup-executable.sh

echo "✅ Scripts are now executable"
echo ""
echo "To run the setup:"
echo "cd backend"
echo "node scripts/setup-breakdown-analytics.js"
echo ""
echo "To test the API:"
echo "node test-breakdown-analytics.js"