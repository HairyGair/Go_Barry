#!/bin/bash
# Prepare Go Barry Backend for cPanel Node.js Deployment

echo "📦 Preparing Go Barry Backend for cPanel Node.js"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

echo "🗂️ Creating cPanel Node.js deployment package..."

# Create deployment directory
rm -rf cpanel-nodejs-backend
mkdir -p cpanel-nodejs-backend

# Copy essential backend files
echo "📋 Copying backend files..."
cp -r backend/* cpanel-nodejs-backend/

# Create cPanel-specific files
echo "⚙️ Creating cPanel configuration files..."

# Create .htaccess for subdomain routing (if needed)
cat > cpanel-nodejs-backend/.htaccess << 'EOF'
# Node.js App .htaccess for cPanel
DirectoryIndex app.js

# Protect sensitive files
<FilesMatch "\.(env|log|json)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# CORS Headers for API
Header always set Access-Control-Allow-Origin "https://gobarry.co.uk"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept"
EOF

# Create startup script for cPanel
cat > cpanel-nodejs-backend/app.js << 'EOF'
// cPanel Node.js App Entry Point
// This file is required by some cPanel Node.js setups

// Import the main application
import('./index.js')
  .then(() => {
    console.log('✅ Go Barry Backend started successfully on cPanel');
  })
  .catch((error) => {
    console.error('❌ Failed to start Go Barry Backend:', error);
    process.exit(1);
  });
EOF

# Create environment setup script
cat > cpanel-nodejs-backend/setup-cpanel-env.sh << 'EOF'
#!/bin/bash
# Setup environment variables for cPanel Node.js

echo "Setting up environment variables for cPanel..."

# Create .env file with production settings
cat > .env << 'ENVEOF'
# Go Barry Backend - cPanel Production Environment
NODE_ENV=production
PORT=3001

# API Keys (update these with your actual keys)
TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp
MAPQUEST_API_KEY=OeLAWVPNlgnBjW66iamoyiD5kEecJloN
HERE_API_KEY=Xo2Q-IQMOBERx3wCtl0o9Nc6VRVf4uCCJVUAfEbLxs
NATIONAL_HIGHWAYS_API_KEY=d2266b385f64d968f330969398b2961

# CORS for your domain
CORS_ORIGIN=https://gobarry.co.uk,https://www.gobarry.co.uk

# Supabase (if needed)
SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs
ENVEOF

echo "✅ Environment variables set up for cPanel"
EOF

chmod +x cpanel-nodejs-backend/setup-cpanel-env.sh

# Create installation instructions
cat > cpanel-nodejs-backend/CPANEL_SETUP_INSTRUCTIONS.md << 'EOF'
# Go Barry Backend - cPanel Node.js Setup Instructions

## 📋 Prerequisites
- cPanel with Node.js App support
- SSH access (recommended) or File Manager
- Domain/subdomain for API (api.gobarry.co.uk)

## 🚀 Installation Steps

### Step 1: Upload Files
1. Compress this entire folder into a zip file
2. Upload to cPanel File Manager
3. Extract to a directory like `barry-api/`

### Step 2: Set Up Node.js App in cPanel
1. Go to "Node.js App" in cPanel
2. Click "Create Application"
3. Settings:
   - Node.js Version: 18.x or 20.x (latest available)
   - Application Mode: Production
   - Application Root: barry-api/
   - Application URL: api.gobarry.co.uk
   - Application Startup File: app.js

### Step 3: Install Dependencies
1. In Node.js App settings, click "Run NPM Install"
2. Or via SSH: `cd barry-api && npm install`

### Step 4: Set Environment Variables
1. Run: `chmod +x setup-cpanel-env.sh`
2. Run: `./setup-cpanel-env.sh`
3. Or manually set in Node.js App environment variables

### Step 5: Start Application
1. In cPanel Node.js App, click "Start"
2. Or via SSH: `npm start`

### Step 6: Test
- Visit: https://api.gobarry.co.uk/api/health
- Should return: {"status": "operational"}

## 🔧 Troubleshooting
- Check Node.js App logs in cPanel
- Verify domain/subdomain points to correct directory
- Ensure all dependencies installed
- Check file permissions (644 for files, 755 for directories)
EOF

# Create zip file for easy upload
echo "📦 Creating deployment zip file..."
cd cpanel-nodejs-backend
zip -r ../barry-backend-cpanel.zip . -x '*.DS_Store' '*.log'
cd ..

# Get file size
ZIP_SIZE=$(du -sh barry-backend-cpanel.zip | cut -f1)

echo ""
echo "✅ cPanel Node.js Backend Package Ready!"
echo "======================================="
echo "📦 Package: barry-backend-cpanel.zip"
echo "📊 Size: $ZIP_SIZE"
echo ""
echo "📋 Package Contents:"
echo "   ✅ All backend files"
echo "   ✅ cPanel-specific app.js entry point"
echo "   ✅ Environment setup script"
echo "   ✅ .htaccess for API routing"
echo "   ✅ Complete setup instructions"
echo ""
echo "🚀 Next Steps:"
echo "1. Check your cPanel for Node.js App support"
echo "2. Upload barry-backend-cpanel.zip to cPanel"
echo "3. Follow CPANEL_SETUP_INSTRUCTIONS.md"
echo ""
echo "📖 Instructions file: cpanel-nodejs-backend/CPANEL_SETUP_INSTRUCTIONS.md"
