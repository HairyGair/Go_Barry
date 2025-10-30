#!/bin/bash

###############################################################################
# Backend Deployment Package Creator for cPanel
# Creates a clean zip file ready for upload to cPanel File Manager
###############################################################################

echo "🚀 Preparing Backend Deployment Package for cPanel..."
echo ""

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create deployment directory name with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="backend-deploy-${TIMESTAMP}"
ZIP_NAME="backend-cpanel-${TIMESTAMP}.zip"

echo -e "${BLUE}Creating deployment directory: ${DEPLOY_DIR}${NC}"
mkdir -p "$DEPLOY_DIR"

# Files and directories to include
echo -e "${BLUE}Copying necessary files...${NC}"

# Copy main files
cp server.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || echo "Note: package-lock.json not found (optional)"

# Copy .env.example (we'll create .env manually on server)
if [ -f ".env.example" ]; then
    cp .env.example "$DEPLOY_DIR/"
    echo "✓ Copied .env.example"
fi

# Copy directories
echo -e "${BLUE}Copying directories...${NC}"
for dir in middleware routes services data migrations scripts; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$DEPLOY_DIR/"
        echo "✓ Copied $dir/"
    else
        echo "⚠ Warning: $dir/ directory not found"
    fi
done

# Create .env template in deployment package
echo -e "${BLUE}Creating .env template...${NC}"
cat > "$DEPLOY_DIR/.env.template" << 'EOF'
# Environment Configuration for cPanel Deployment
# Copy this to .env and fill in the actual values

PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://qjbypqpofxzrcqnrzdjx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Optional: Additional Configuration
# CORS_ORIGIN=https://breakdowns.gobarry.co.uk
EOF

echo "✓ Created .env.template"

# Create README for deployment
echo -e "${BLUE}Creating deployment README...${NC}"
cat > "$DEPLOY_DIR/DEPLOYMENT_README.md" << 'EOF'
# Backend Deployment Instructions for cPanel

## Files Included
- `server.js` - Main application entry point
- `package.json` - Dependencies and configuration
- `middleware/` - Authentication and security
- `routes/` - API endpoints
- `services/` - Business logic
- `data/` - Static data files
- `.env.template` - Environment variables template

## Installation Steps

### 1. Upload to cPanel
- Upload this entire folder via cPanel File Manager
- Extract to: `/home/gobarryco/api/`

### 2. Install Dependencies
SSH into server and run:
```bash
cd /home/gobarryco/api
/opt/cpanel/ea-nodejs20/bin/npm install
```

### 3. Configure Environment Variables
Create `.env` file from template:
```bash
cp .env.template .env
nano .env  # Edit with actual values
```

Required variables:
- `PORT=3001`
- `NODE_ENV=production`
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `JWT_SECRET` - Random secret for JWT signing

### 4. Test the Application
```bash
/opt/cpanel/ea-nodejs20/bin/node server.js
```

Should see: "Server running on port 3001"

### 5. Restart Passenger
The application should auto-start via Passenger.
If needed, restart:
```bash
touch /home/gobarryco/api/tmp/restart.txt
```

## Verify Deployment
Test API endpoint:
```bash
curl https://breakdowns.gobarry.co.uk/api/health
# or
curl https://api.breakdowns.gobarry.co.uk/health
```

Should return: `{"status":"ok"}`

## Troubleshooting
- Check Apache error logs: `/var/log/apache2/error_log`
- Check Passenger logs: `/home/gobarryco/api/log/`
- Verify Node.js version: `/opt/cpanel/ea-nodejs20/bin/node -v`
- Check file permissions: `ls -la /home/gobarryco/api/`

## Security Notes
- Never commit `.env` file to git
- Ensure `.env` file permissions are 600: `chmod 600 .env`
- Keep dependencies updated: `npm update`

## Support
Contact: anthony@gobarry.co.uk
EOF

echo "✓ Created DEPLOYMENT_README.md"

# Create a .npmrc to use the correct npm (optional but helpful)
cat > "$DEPLOY_DIR/.npmrc" << 'EOF'
# Use cPanel's Node.js 20 npm
EOF

# Count files
FILE_COUNT=$(find "$DEPLOY_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)

echo ""
echo -e "${GREEN}✓ Deployment directory prepared${NC}"
echo "  Files: $FILE_COUNT"
echo "  Size: $DIR_SIZE"
echo ""

# Create zip file
echo -e "${BLUE}Creating zip file: ${ZIP_NAME}${NC}"
zip -r "$ZIP_NAME" "$DEPLOY_DIR" -q

if [ $? -eq 0 ]; then
    ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
    echo -e "${GREEN}✓ Zip file created successfully${NC}"
    echo "  File: $ZIP_NAME"
    echo "  Size: $ZIP_SIZE"
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✓ DEPLOYMENT PACKAGE READY!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Upload ${ZIP_NAME} to cPanel File Manager"
    echo "2. Navigate to /home/gobarryco/"
    echo "3. Extract the zip file"
    echo "4. Rename extracted folder to 'api'"
    echo "   (or extract directly into existing api/ folder)"
    echo "5. Follow instructions in DEPLOYMENT_README.md"
    echo ""
    echo -e "${BLUE}Location: $(pwd)/${ZIP_NAME}${NC}"
else
    echo -e "${RED}✗ Error creating zip file${NC}"
    exit 1
fi

# Clean up deployment directory (optional)
# Uncomment if you want to remove the temp directory
# rm -rf "$DEPLOY_DIR"
# echo "Cleaned up temporary directory"

echo ""
echo "Done! 🎉"
