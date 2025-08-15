#!/bin/bash

# Make deployment scripts executable
chmod +x /Users/anthony/Go\ BARRY\ App/deploy-cors-fix.sh
chmod +x /Users/anthony/Go\ BARRY\ App/test-cors-fix.sh

echo "✅ Scripts are now executable"
echo ""
echo "To deploy the CORS fix:"
echo "  ./deploy-cors-fix.sh"
echo ""
echo "To test if CORS is working:"
echo "  ./test-cors-fix.sh"
