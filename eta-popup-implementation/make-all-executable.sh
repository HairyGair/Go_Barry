#!/bin/bash

# Make all deployment scripts executable
chmod +x "/Users/anthony/Go BARRY App/eta-popup-implementation/DEPLOY-NOW.sh"
chmod +x "/Users/anthony/Go BARRY App/eta-popup-implementation/COMPLETE-DEPLOY.sh"
chmod +x "/Users/anthony/Go BARRY App/eta-popup-implementation/test-eta-system.sh"

echo "✅ All deployment scripts are now executable!"
echo ""
echo "You can now run ANY of these:"
echo ""
echo "1. Simple deployment:"
echo "   ./eta-popup-implementation/DEPLOY-NOW.sh"
echo ""
echo "2. Complete automated deployment (recommended):"
echo "   ./eta-popup-implementation/COMPLETE-DEPLOY.sh"
echo ""
echo "3. Just make scripts executable:"
echo "   ./eta-popup-implementation/make-executable.sh"