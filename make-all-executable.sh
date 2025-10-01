#!/bin/bash

# Make all location capture scripts executable
chmod +x open-location-test.sh
chmod +x verify-location-files.sh
chmod +x post-migration-setup.sh
chmod +x location-capture-quickstart.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Commands you can run:"
echo ""
echo "1. Open test page:"
echo "   ./open-location-test.sh"
echo ""
echo "2. Verify all files:"
echo "   ./verify-location-files.sh"
echo ""
echo "3. Run guided setup:"
echo "   ./post-migration-setup.sh"