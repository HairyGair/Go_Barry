#!/bin/bash
# deploy-v3.sh
# Go Barry v3.0 Complete Deployment Script

echo "🚀 Go Barry v3.0 - COMPLETE DEPLOYMENT"
echo "====================================="
echo ""
echo "📋 Deploying comprehensive traffic intelligence system with:"
echo "   ✅ Phase 1: Enhanced foundations & GTFS integration"
echo "   ✅ Phase 2: GTFS-powered incident management" 
echo "   ✅ Phase 3: AI-assisted diversion & messaging"
echo "   ✅ Phase 4: Multi-channel distribution & automation"
echo "   ✅ Phase 5: System health monitoring & training"
echo ""

# Step 1: Update render.yaml for v3.0
echo "🔧 Step 1: Updating deployment configuration..."
cat > render.yaml << EOF
services:
  # Backend API Service - Go Barry v3.0
  - type: web
    name: go-barry
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_OPTIONS
        value: --max-old-space-size=2048 --optimize-for-size
      - key: PORT
        value: 10000
      # API Keys (set these in Render dashboard)
      - key: TOMTOM_API_KEY
        sync: false
      - key: MAPQUEST_API_KEY  
        sync: false
      - key: HERE_API_KEY
        sync: false
      - key: MAPBOX_API_KEY
        sync: false
      - key: NATIONAL_HIGHWAYS_API_KEY
        sync: false
    autoDeploy: false

  # Frontend Web App - Go Barry v3.0 Dashboard
  - type: static
    name: barry-frontend
    buildCommand: cd Go_BARRY && npm install && npm run build:web
    staticPublishPath: Go_BARRY/dist
    plan: free
    envVars:
      - key: EXPO_PUBLIC_API_BASE_URL
        value: https://go-barry.onrender.com
    autoDeploy: false
EOF

# Step 2: Update backend package.json start command
echo "📦 Step 2: Updating backend start command for v3.0..."
cd backend
npm pkg set scripts.start="node index.js"
cd ..

# Step 3: Git operations
echo "📝 Step 3: Committing Go Barry v3.0..."
cd "/Users/anthony/Go BARRY App"

# Check git status
echo "🔍 Checking git status..."
git status

# Add all v3.0 files
echo "➕ Adding Go Barry v3.0 files..."
git add .

# Commit with comprehensive v3.0 message
echo "💾 Committing Go Barry v3.0..."
git commit -m "🚀 GO BARRY v3.0 - COMPLETE SYSTEM DEPLOYMENT

🎉 MASSIVE BROWSER UPDATE COMPLETE with all 5 phases implemented!

✅ Phase 1: Foundations & Data Integration
- Fixed supervisor session persistence (no more logout on refresh!)
- Enhanced API configuration for browser/mobile compatibility  
- Created browser-compatible session storage service
- Updated all components for cross-platform compatibility

✅ Phase 2: GTFS-Powered Incident Management
- New IncidentManager component with GTFS route detection
- Location autocomplete with bus stops and areas
- Real-time affected route calculation within 250m
- Backend API at /api/incidents with full CRUD operations

✅ Phase 3: AI-Assisted Diversion & Messaging  
- AIDisruptionManager with smart diversion suggestions
- Knowledge-base driven recommendations for common closure points
- Automated message generation for drivers, passengers, social media
- Learning system that improves from supervisor feedback

✅ Phase 4: Multi-Channel Distribution & Automation
- MessageDistributionCenter for Ticketer, Passenger Cloud, Email, SMS
- AutomatedReportingSystem with daily Start of Service reports (00:15am)
- Template-based messaging with variable substitution
- Backend APIs at /api/messaging with full distribution system

✅ Phase 5: Testing, Training & Continuous Improvement
- SystemHealthMonitor with real-time component diagnostics
- TrainingHelpSystem with video modules and help articles
- Performance analytics and continuous learning capabilities

🏗️ Enhanced Navigation & Integration
- Updated DisruptionControlRoom with all 7 screens
- Enhanced Settings screen with quick access to health & training
- All components work seamlessly in browser and mobile

🌐 Browser Compatibility Fixes
- Sessions persist across browser refreshes using localStorage
- Platform-specific components only render where supported
- API calls work in both browser and mobile environments
- Responsive design works on desktop, tablet, mobile

🚀 Ready for Production Deployment to Render!"

echo "📤 Pushing to remote repository..."
git push origin main

echo ""
echo "✅ Go Barry v3.0 committed and pushed!"
echo ""
echo "🚢 NEXT STEPS - Deploy to Render:"
echo ""
echo "1. 🌐 Go to https://dashboard.render.com"
echo "2. 🔍 Find your 'go-barry' service"
echo "3. 🚀 Click 'Manual Deploy' -> 'Deploy latest commit'"
echo "4. 👀 Monitor deployment logs for v3.0 startup messages"
echo ""
echo "🔗 DEPLOYMENT URLS:"
echo "   Backend:  https://go-barry.onrender.com"
echo "   Frontend: https://barry-frontend.onrender.com (if deploying static)"
echo ""
echo "🧪 TEST ENDPOINTS after deployment:"
echo "   • https://go-barry.onrender.com/api/health"
echo "   • https://go-barry.onrender.com/api/alerts"
echo "   • https://go-barry.onrender.com/api/incidents"
echo "   • https://go-barry.onrender.com/api/messaging/channels"
echo "   • https://go-barry.onrender.com/api/routes/gtfs-stats"
echo ""
echo "🎯 GO BARRY v3.0 FEATURES TO TEST:"
echo "   ✅ Supervisor login persistence (refresh browser!)"
echo "   ✅ Incident Manager with GTFS route detection"  
echo "   ✅ AI Disruption Manager with smart suggestions"
echo "   ✅ Message Distribution Center"
echo "   ✅ Automated Reporting System"
echo "   ✅ System Health Monitor"
echo "   ✅ Training & Help System"
echo ""
echo "🔑 REMEMBER: Set your API keys in Render dashboard:"
echo "   • TOMTOM_API_KEY"
echo "   • MAPQUEST_API_KEY" 
echo "   • HERE_API_KEY"
echo "   • MAPBOX_API_KEY"
echo ""
echo "🎉 GO BARRY v3.0 READY FOR PRODUCTION! 🚀"
