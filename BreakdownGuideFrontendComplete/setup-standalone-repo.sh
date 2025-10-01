#!/bin/bash

# Setup script for standalone Breakdown Guide repository
# This creates a clean, independent repository for the Breakdown Guide system

echo "🚀 Setting up standalone Breakdown Guide repository..."

# Create the new repository structure
REPO_NAME="breakdown-guide-standalone"
REPO_PATH="/Users/anthony/Go BARRY App/$REPO_NAME"

echo "📁 Creating repository at: $REPO_PATH"

# Check if directory already exists
if [ -d "$REPO_PATH" ]; then
    echo "⚠️  Directory already exists. Please remove it first or choose a different name."
    exit 1
fi

# Create the repository
mkdir -p "$REPO_PATH"
cd "$REPO_PATH"

# Initialize git repository
git init
echo "✅ Git repository initialized"

# Create directory structure
mkdir -p frontend/breakdown-guide
mkdir -p frontend/dashboard
mkdir -p frontend/public
mkdir -p backend/routes
mkdir -p backend/services
mkdir -p backend/scripts
mkdir -p backend/migrations
mkdir -p docs
mkdir -p .github/workflows

echo "✅ Directory structure created"

# Copy backend files
echo "📋 Copying backend files..."
cp -r "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/backend/"* "$REPO_PATH/backend/" 2>/dev/null

# Copy frontend files
echo "📋 Copying frontend files..."
cp -r "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/breakdown-guide/"* "$REPO_PATH/frontend/breakdown-guide/" 2>/dev/null
cp -r "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/dashboard/"* "$REPO_PATH/frontend/dashboard/" 2>/dev/null

# Copy root configuration files
cp "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/package.json" "$REPO_PATH/frontend/package.json" 2>/dev/null
cp "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/vite.config.js" "$REPO_PATH/frontend/vite.config.js" 2>/dev/null
cp "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/gne-fleet-database.json" "$REPO_PATH/frontend/public/gne-fleet-database.json" 2>/dev/null

# Copy database files
cp "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/database-architecture-complete.sql" "$REPO_PATH/backend/migrations/" 2>/dev/null
cp "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/supabase-security-config.sql" "$REPO_PATH/backend/migrations/" 2>/dev/null

echo "✅ Files copied successfully"

# Create README
cat > "$REPO_PATH/README.md" << 'EOF'
# Go North East - Breakdown Guide System

A standalone breakdown assessment and tracking system for Go North East bus operations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Configure Environment**
```bash
# Copy environment template
cp backend/.env.example backend/.env
# Edit .env with your Supabase credentials
```

4. **Start Development Servers**

Backend (Port 3003):
```bash
cd backend
npm run dev
```

Frontend (Port 3001):
```bash
cd frontend
npm run dev
```

## 📦 Deployment

### Render Deployment (Free Tier)

This application is optimized for Render's free tier with a single web service.

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
4. Add environment variables from `.env.example`
5. Deploy!

The backend serves both API and static frontend files, keeping everything in a single service.

## 🏗️ Architecture

- **Frontend**: React with Vite, React Native compatible
- **Backend**: Node.js/Express with Supabase
- **Database**: PostgreSQL (via Supabase)
- **Hosting**: Optimized for Render free tier

## 📄 License

Proprietary - © 2025 Anthony Gair. All rights reserved.
EOF

echo "✅ README created"

# Create package.json for monorepo root
cat > "$REPO_PATH/package.json" << 'EOF'
{
  "name": "breakdown-guide-system",
  "version": "2.0.0",
  "description": "Standalone Breakdown Guide System for Go North East",
  "private": true,
  "scripts": {
    "install:all": "npm run install:backend && npm run install:frontend",
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "build:all": "npm run build && cd backend && npm run build:static",
    "start": "cd backend && npm start",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  },
  "author": "Anthony Gair",
  "license": "PROPRIETARY"
}
EOF

echo "✅ Root package.json created"

# Create .gitignore
cat > "$REPO_PATH/.gitignore" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov
.nyc_output

# Production
dist/
build/
*.production

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Cache
.eslintcache
.cache/
.parcel-cache/

# Temporary
tmp/
temp/
*.tmp

# Database
*.sqlite
*.sqlite3
*.db

# Backups
*.backup
*.bak

# Supabase
supabase/.branches
supabase/.temp
EOF

echo "✅ .gitignore created"

# Create deployment configuration for Render
cat > "$REPO_PATH/render.yaml" << 'EOF'
services:
  - type: web
    name: breakdown-guide
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && cd ../frontend && npm install && npm run build && cp -r dist/* ../backend/public/
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
EOF

echo "✅ Render configuration created"

# Make backend serve static files in production
cat > "$REPO_PATH/backend/scripts/build-static.js" << 'EOF'
#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('📦 Building static files for production...');

// Ensure public directory exists
const publicDir = join(process.cwd(), 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Copy frontend build to backend public directory
const frontendDist = join(process.cwd(), '..', 'frontend', 'dist');
if (existsSync(frontendDist)) {
  execSync(`cp -r ${frontendDist}/* ${publicDir}/`, { stdio: 'inherit' });
  console.log('✅ Frontend files copied to backend/public');
} else {
  console.error('❌ Frontend dist not found. Run npm run build in frontend first.');
  process.exit(1);
}

console.log('✅ Static build complete!');
EOF

chmod +x "$REPO_PATH/backend/scripts/build-static.js"

echo "✅ Build script created"

# Create initial commit
cd "$REPO_PATH"
git add .
git commit -m "Initial commit: Standalone Breakdown Guide System

- Complete backend with Supabase integration
- Optimized frontend with React Native compatibility
- Ready for Render deployment on free tier
- Separated from main Go BARRY application"

echo "✅ Initial commit created"

echo "
================================================================================
🎉 STANDALONE REPOSITORY CREATED SUCCESSFULLY!
================================================================================

Repository Location: $REPO_PATH

Next Steps:
-----------
1. Navigate to the repository:
   cd '$REPO_PATH'

2. Create a GitHub repository:
   - Go to https://github.com/new
   - Name: breakdown-guide-system (or your preference)
   - Create as PRIVATE repository

3. Connect to GitHub:
   git remote add origin https://github.com/YOUR_USERNAME/breakdown-guide-system.git
   git branch -M main
   git push -u origin main

4. Deploy to Render (FREE):
   - Go to https://dashboard.render.com
   - Create New > Web Service
   - Connect GitHub repo
   - Use settings from render.yaml
   - Add environment variables
   - Deploy!

5. Configure Environment:
   - Edit backend/.env with your Supabase credentials
   - Set PORT=3003 for local development

The system is now completely independent and ready for deployment!
================================================================================
"