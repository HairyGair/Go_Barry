#!/bin/bash

# Go BARRY Security Setup Script
# Run this script to set up the new security features

set -e  # Exit on error

echo "================================================"
echo "  Go BARRY Security Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating logs directory...${NC}"
mkdir -p logs
touch logs/.gitkeep
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with the following variables:"
    echo "  JWT_ACCESS_SECRET"
    echo "  JWT_REFRESH_SECRET"
    echo "  JWT_ISSUER"
    echo "  ACCESS_TOKEN_EXPIRY"
    echo "  REFRESH_TOKEN_EXPIRY"
    exit 1
fi

# Check for required env vars
required_vars=("JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET" "DB_HOST" "DB_USER" "DB_NAME")
missing_vars=0

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo -e "${RED}✗ Missing: ${var}${NC}"
        missing_vars=1
    else
        echo -e "${GREEN}✓ Found: ${var}${NC}"
    fi
done

if [ $missing_vars -eq 1 ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Testing database connection...${NC}"
# This will be tested when the server starts
echo -e "${YELLOW}  (Will be tested on server startup)${NC}"
echo ""

echo -e "${YELLOW}Step 5: Checking file permissions...${NC}"
chmod +x setup-security.sh
echo -e "${GREEN}✓ File permissions set${NC}"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Security setup complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Update server.js to use authSecure.js:"
echo "     import authSecureRouter from './routes/authSecure.js';"
echo "     app.use('/api/auth', authSecureRouter);"
echo ""
echo "  2. Start the server:"
echo "     npm run dev"
echo ""
echo "  3. Test the endpoints:"
echo "     curl -X POST http://localhost:3001/api/auth/login \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"badge\":\"AG003\",\"password\":\"your-password\"}'"
echo ""
echo "  4. Monitor the logs:"
echo "     tail -f logs/combined.log"
echo ""
echo "Documentation:"
echo "  - Full guide: SECURITY_IMPLEMENTATION_GUIDE.md"
echo "  - Integration: INTEGRATION_EXAMPLE.md"
echo "  - Summary: SECURITY_IMPLEMENTATION_SUMMARY.md"
echo ""
echo -e "${GREEN}Ready to go!${NC}"
