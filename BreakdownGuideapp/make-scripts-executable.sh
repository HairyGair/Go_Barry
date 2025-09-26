#!/bin/bash

# Make all scripts executable
chmod +x start-backend.sh
chmod +x test-wizard-endpoint.sh
chmod +x test-wizard-to-activity.sh
chmod +x make-scripts-executable.sh

echo "✅ All scripts are now executable"
echo ""
echo "You can now run:"
echo "  ./start-backend.sh           - Start the backend server"
echo "  ./test-wizard-endpoint.sh    - Test the wizard API endpoint"
echo "  ./test-wizard-to-activity.sh - Test the complete flow"
echo ""
echo "Quick Start:"
echo "1. In terminal 1: ./start-backend.sh"
echo "2. In terminal 2: cd frontend && npm run dev"
echo "3. Open browser to http://localhost:3000"
echo "4. Complete a wizard assessment and check activity feed"
