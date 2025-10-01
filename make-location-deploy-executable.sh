#!/bin/bash

echo "Making location capture deployment script executable..."
chmod +x deploy-location-capture.sh
chmod +x test-location-capture.sh 2>/dev/null || true

echo "✓ Scripts are now executable"
echo ""
echo "Run the deployment with:"
echo "  ./deploy-location-capture.sh"