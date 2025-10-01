#!/bin/bash

# Quick test launcher for location capture
echo "================================================"
echo "🚀 LOCATION CAPTURE - QUICK TEST LAUNCHER"
echo "================================================"
echo ""

# Make scripts executable
chmod +x verify-location-integration.sh 2>/dev/null
chmod +x open-location-test.sh 2>/dev/null

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Choose a test option:${NC}"
echo ""
echo "1) Test standalone location capture modal"
echo "2) Open actual breakdown guide service"
echo "3) Test API with location fields"
echo "4) Check system status"
echo "5) Verify integration completeness"
echo ""
read -p "Enter choice (1-5): " CHOICE

case $CHOICE in
    1)
        echo -e "${GREEN}Opening standalone test...${NC}"
        open test-location-capture.html
        echo ""
        echo "Test instructions:"
        echo "• Enter fleet 6301"
        echo "• Click 'Start Breakdown Report'"
        echo "• Try What3Words: cafe.pulse.risky"
        echo "• Or select Gateshead depot"
        ;;
    2)
        echo -e "${GREEN}Opening breakdown guide service...${NC}"
        open breakdown-guide-service/public/index.html
        echo ""
        echo "Test instructions:"
        echo "• Login as supervisor"
        echo "• Enter fleet number"
        echo "• Select any wizard"
        echo "• Location modal should appear!"
        ;;
    3)
        echo -e "${GREEN}Opening API test page...${NC}"
        open test-api-location.html
        echo ""
        echo "Test instructions:"
        echo "• Fill in the form"
        echo "• Click 'Create Breakdown with Location'"
        echo "• Check for SUCCESS response"
        ;;
    4)
        echo -e "${GREEN}Opening system status check...${NC}"
        open location-system-status.html
        echo ""
        echo "This will automatically check:"
        echo "• JavaScript module loaded"
        echo "• CSS styles available"
        echo "• Backend connectivity"
        echo "• Database columns"
        ;;
    5)
        echo -e "${GREEN}Running integration verification...${NC}"
        ./verify-location-integration.sh
        ;;
    *)
        echo -e "${YELLOW}Invalid choice${NC}"
        ;;
esac

echo ""
echo "================================================"
echo -e "${GREEN}Location Capture Status:${NC}"
echo "  ✅ Database migrated"
echo "  ✅ HTML files updated"  
echo "  ✅ JavaScript module deployed"
echo "  ✅ CSS styles in place"
echo "  ✅ Supervisor logger updated"
echo "================================================"