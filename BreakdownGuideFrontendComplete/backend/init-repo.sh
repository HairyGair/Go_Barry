#!/bin/bash

# Initialize Breakdown Backend as Git Repository
# This script prepares the backend for deployment to Render

echo "🚀 Initializing Breakdown Backend Repository"
echo "==========================================="

# Navigate to backend directory
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideFrontendComplete/backend

# Initialize git repository
echo "📁 Initializing Git repository..."
git init

# Create initial commit
echo "📝 Creating initial commit..."
git add .
git commit -m "Initial commit: Go North East Breakdown Backend

- Complete breakdown tracking system with sequential IDs
- Location tracking with GPS and What3Words
- Supervisor authentication (9 supervisors)
- Fleet database (541 vehicles)
- Analytics and KPI endpoints
- Admin management tools
- Real-time dashboard support"

# Create render.yaml for easy deployment
echo "🔧 Creating Render deployment config..."
cat > render.yaml << 'EOF'
services:
  - type: web
    name: gne-breakdown-backend
    runtime: node
    repo: https://github.com/YOUR_GITHUB_USERNAME/gne-breakdown-backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: "*"
      - key: SUPERVISOR_BADGES
        value: "AW001,AC002,AG003,CF004,DH005,JD006,JP007,SG008,BP009"
      - key: ADMIN_BADGES
        value: "AG003,BP009"
      - key: VALID_DEPOTS
        value: "Washington,Riverside,Percy Main,Consett,Deptford,Hexham"
      - key: PRIORITY_ROUTES
        value: "X10,X21,307,1"
      - key: ENABLE_LOCATION_TRACKING
        value: "true"
      - key: ENABLE_HOTSPOT_ANALYSIS
        value: "true"
      - key: ENABLE_AUTO_ESCALATION
        value: "true"
EOF

echo "✅ render.yaml created"

# Create deployment README
echo "📚 Creating deployment documentation..."
cat > DEPLOY.md << 'EOF'
# Deployment Guide for Render

## Quick Deploy to Render

### Option 1: Using Render Blueprint (Easiest)
1. Push this repository to GitHub
2. Click the button below:
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
3. Connect your GitHub account
4. Select this repository
5. Render will automatically configure everything from `render.yaml`

### Option 2: Manual Setup
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables (see below)

## Required Environment Variables

### For Supabase (Production)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### For JWT Authentication
```
JWT_SECRET=generate_a_strong_secret_key
JWT_EXPIRES_IN=7d
```

### For CORS (adjust for production)
```
CORS_ORIGIN=https://your-frontend-domain.com
```

## Post-Deployment Steps

1. **Set up Supabase**:
   - Create a Supabase project
   - Run the migration script from `/scripts/setup-database.sql`
   - Add Supabase credentials to Render environment variables

2. **Update Frontend**:
   - Change `BACKEND_URL` to your Render service URL
   - Example: `https://gne-breakdown-backend.onrender.com`

3. **Test the deployment**:
   - Visit: `https://your-service.onrender.com/api/health`
   - Check API docs: `https://your-service.onrender.com/api-docs`

## Monitoring

- Render provides automatic health checks
- View logs in Render dashboard
- Set up alerts for failures

## Scaling

- Render Free Tier: Good for development
- Render Starter: $7/month for production
- Auto-scaling available on higher tiers
EOF

echo "✅ DEPLOY.md created"

# Update package.json for production
echo "🔄 Updating package.json for production..."
cat > package.json << 'EOF'
{
  "name": "gne-breakdown-backend",
  "version": "2.0.0",
  "description": "Go North East Breakdown Tracking Backend Service",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test-api.js",
    "setup": "node scripts/setup.js",
    "health": "curl -s http://localhost:3003/api/health | json_pp"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.50.2",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^4.2.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_GITHUB_USERNAME/gne-breakdown-backend"
  },
  "keywords": [
    "breakdown",
    "tracking",
    "fleet",
    "management",
    "gne",
    "api"
  ],
  "author": "Anthony Gair",
  "license": "PROPRIETARY"
}
EOF

echo "✅ package.json updated"

# Create GitHub Actions workflow
echo "🔄 Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Render

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18
      uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Render
      env:
        deploy_url: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
      run: |
        curl "$deploy_url"
EOF

echo "✅ GitHub Actions workflow created"

# Create .env.production template
echo "📝 Creating production environment template..."
cat > .env.production << 'EOF'
# Production Environment Variables for Render

# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT Configuration
JWT_SECRET=your-production-secret-change-this
JWT_EXPIRES_IN=7d

# CORS Configuration (update with your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com

# Supervisor Configuration
SUPERVISOR_BADGES=AW001,AC002,AG003,CF004,DH005,JD006,JP007,SG008,BP009
ADMIN_BADGES=AG003,BP009

# Depot Configuration
VALID_DEPOTS=Washington,Riverside,Percy Main,Consett,Deptford,Hexham

# Priority Routes
PRIORITY_ROUTES=X10,X21,307,1

# Feature Flags
ENABLE_LOCATION_TRACKING=true
ENABLE_HOTSPOT_ANALYSIS=true
ENABLE_AUTO_ESCALATION=true

# Logging
LOG_LEVEL=info
LOG_TO_FILE=false
EOF

echo "✅ .env.production created"

# Show summary
echo ""
echo "✅ Repository initialized successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Create a GitHub repository: 'gne-breakdown-backend'"
echo "2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/gne-breakdown-backend.git"
echo "3. Push code: git push -u origin main"
echo "4. Deploy to Render using render.yaml"
echo "5. Configure environment variables in Render dashboard"
echo ""
echo "📚 Files created:"
echo "   - render.yaml (Render deployment config)"
echo "   - DEPLOY.md (Deployment documentation)"
echo "   - .github/workflows/deploy.yml (CI/CD pipeline)"
echo "   - .env.production (Production env template)"
echo ""
echo "🚀 Ready for deployment!"
