#!/bin/bash
# Go Barry Production Deployment for gobarry.co.uk

echo "🚀 Deploying Go Barry to gobarry.co.uk"
echo "====================================="

# Build frontend for cPanel
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build:cpanel

# Create deployment package
echo "📦 Creating deployment package..."
cd cpanel-build
zip -r ../../gobarry-production.zip . -x '*.DS_Store' '*.map'
cd ../..

# Backend package
echo "📦 Creating backend package..."
cd backend
zip -r ../gobarry-backend.zip . -x '*.DS_Store' '*.log' 'node_modules/*'
cd ..

echo "✅ Deployment packages created:"
echo "   🌐 Frontend: gobarry-production.zip"
echo "   🔗 Backend: gobarry-backend.zip"
echo ""
echo "📋 Next steps:"
echo "1. Upload gobarry-production.zip to cPanel public_html"
echo "2. Upload gobarry-backend.zip to cPanel Node.js app directory"
echo "3. Extract both files"
echo "4. Configure domains and start services"
