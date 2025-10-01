#!/bin/bash

# Make all test scripts executable
chmod +x test-location-system.sh
chmod +x verify-location-integration.sh
chmod +x open-location-test.sh
chmod +x post-migration-setup.sh
chmod +x verify-location-files.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Quick test command:"
echo "  ./test-location-system.sh"