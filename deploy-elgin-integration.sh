#!/bin/bash
# deploy-elgin-integration.sh
# Deploy Elgin integration to Go BARRY

echo "🚧 Go BARRY: Deploying Elgin Integration"
echo "========================================"

# 1. Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd backend
npm install
echo "✅ Dependencies installed"

# 2. Test integration locally
echo "🧪 Step 2: Testing integration..."
node test-elgin-integration.js
echo "✅ Integration tested"

# 3. Prepare for deployment
echo "🚀 Step 3: Preparing deployment..."
cd ..

# 4. Commit changes
echo "📝 Step 4: Committing changes..."
git add .
git commit -m "Add modular Elgin roadworks integration

✅ Features added:
- Modular Elgin roadworks API integration
- SOAP/XML processing with proper parsing
- North East England geographic filtering
- Easy enable/disable with ELGIN_ENABLED flag
- Graceful fallback when API unavailable
- Health monitoring and status endpoints
- Complete removal scripts if access denied

🔧 Files modified:
- backend/services/elgin.js (new service)
- backend/package.json (added fast-xml-parser)
- backend/.env.example (added Elgin config)
- backend/index-v3-optimized.js (integrated alerts)

🛠️ Management:
- Set ELGIN_ENABLED=false to disable
- Run ./remove-elgin-integration.sh to remove completely
- Run ./restore-elgin-integration.sh to restore if needed

📋 Next steps:
- Add Elgin API credentials when received
- Test with real data
- Monitor /api/elgin/status endpoint"

echo "✅ Changes committed"

# 5. Deploy to Render
echo "🌐 Step 5: Deploying to Render..."
git push origin main
echo "✅ Pushed to Render"

echo ""
echo "🎯 Elgin Integration Deployment Complete!"
echo "========================================"
echo "✅ Backend deployed to: https://go-barry.onrender.com"
echo "🔍 Test endpoints:"
echo "   • Status: /api/elgin/status"
echo "   • Alerts: /api/alerts (includes Elgin if enabled)"
echo "   • Health: /api/health"
echo ""
echo "⚙️ Next Steps:"
echo "1. Wait for Elgin API response"
echo "2. If approved: Add credentials to Render environment"
echo "3. If denied: Run ./remove-elgin-integration.sh"
echo ""
echo "📋 Environment Variables Needed (if approved):"
echo "   ELGIN_ENABLED=true"
echo "   ELGIN_ENDPOINT=your_endpoint"
echo "   ELGIN_USERNAME=your_username"
echo "   ELGIN_API_KEY=your_api_key"
