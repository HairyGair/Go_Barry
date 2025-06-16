#!/bin/bash
# deploy-frequency-service.sh
# Deploy frequency service integration to Go BARRY

echo "🚀 DEPLOYING FREQUENCY SERVICE INTEGRATION..."
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="root@gobarry.co.uk"
REMOTE_DIR="/home/gobarryc/public_html/go-barry-backend"
LOCAL_BACKEND_DIR="./backend"

echo -e "${YELLOW}📦 Preparing frequency service files...${NC}"

# Create deployment package
DEPLOY_DIR="deploy_frequency_temp"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
echo "📄 Copying service files..."
cp $LOCAL_BACKEND_DIR/services/serviceFrequencyAnalyzer.js $DEPLOY_DIR/
cp $LOCAL_BACKEND_DIR/routes/frequencyAPI.js $DEPLOY_DIR/

# Update index.js to include frequency service
echo "📝 Creating updated index.js with frequency service..."
cat > $DEPLOY_DIR/index_frequency_update.txt << 'EOF'
// Add to imports section:
import frequencyAPI from './routes/frequencyAPI.js';
import serviceFrequencyAnalyzer from './services/serviceFrequencyAnalyzer.js';

// Add to initialization section (after GTFS initialization):
console.log('🚌 Initializing Service Frequency Analyzer...');
await serviceFrequencyAnalyzer.initialize();
console.log('✅ Service Frequency Analyzer ready');

// Add to routes section:
// Service Frequency API routes
app.use('/api/frequency', frequencyAPI);

// Update processAlertsOptimized to include frequency data
EOF

echo -e "${GREEN}✅ Files prepared${NC}"

# Deploy to server
echo -e "${YELLOW}🚀 Deploying to production server...${NC}"

# Upload files
echo "📤 Uploading frequency service files..."
scp $DEPLOY_DIR/serviceFrequencyAnalyzer.js $REMOTE_HOST:$REMOTE_DIR/services/
scp $DEPLOY_DIR/frequencyAPI.js $REMOTE_HOST:$REMOTE_DIR/routes/

# Update server
echo "🔄 Updating server configuration..."
ssh $REMOTE_HOST << 'ENDSSH'
cd /home/gobarryc/public_html/go-barry-backend

# Backup current index.js
cp index.js index.js.backup.$(date +%Y%m%d_%H%M%S)

# Note: Manual update of index.js required to add frequency service

# Test the deployment
echo "🧪 Testing frequency service..."
node -e "
import serviceFrequencyAnalyzer from './services/serviceFrequencyAnalyzer.js';
serviceFrequencyAnalyzer.initialize()
  .then(() => console.log('✅ Frequency service initialized successfully'))
  .catch(err => console.error('❌ Frequency service error:', err.message));
"

echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Manually update index.js to include:"
echo "1. Import statements for frequency service"
echo "2. Initialize frequency analyzer after GTFS"
echo "3. Add frequency API routes"
echo "4. Update processAlertsOptimized function"
ENDSSH

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm -rf $DEPLOY_DIR

echo -e "${GREEN}✅ FREQUENCY SERVICE DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📊 Next steps:"
echo "1. SSH to server and manually update index.js"
echo "2. Restart the backend service"
echo "3. Test /api/frequency/high-frequency endpoint"
echo "4. Verify routes show frequency in Display Screen"
echo ""
echo "Test with: curl https://go-barry.onrender.com/api/frequency/route/21"