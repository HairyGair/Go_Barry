#!/bin/bash
# Deploy Go Barry to Render with custom domain gobarry.co.uk

echo "🚀 Deploying Go Barry to Render with custom domain gobarry.co.uk"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   🌐 Frontend Domain: gobarry.co.uk"
echo "   🔗 Backend API: api.gobarry.co.uk"
echo "   📡 Render Service: go-barry"
echo "   🎯 Environment: Production"
echo ""

# Create checkpoint before deployment
echo "🔄 Creating deployment checkpoint..."
if command -v git &> /dev/null; then
    git add .
    git commit -m "Pre-deployment checkpoint for gobarry.co.uk - $(date)"
    echo "✅ Checkpoint created"
else
    echo "⚠️ Git not found - skipping checkpoint"
fi

# Verify environment files
echo "🔍 Verifying configuration files..."

# Check backend .env
if [ -f "backend/.env" ]; then
    if grep -q "api.gobarry.co.uk" backend/.env; then
        echo "✅ Backend .env configured for custom domain"
    else
        echo "❌ Backend .env not configured for custom domain"
        exit 1
    fi
else
    echo "❌ Backend .env file missing"
    exit 1
fi

# Check frontend API config
if [ -f "Go_BARRY/config/api.js" ]; then
    if grep -q "api.gobarry.co.uk" Go_BARRY/config/api.js; then
        echo "✅ Frontend API config configured for custom domain"
    else
        echo "❌ Frontend API config not configured for custom domain"
        exit 1
    fi
else
    echo "❌ Frontend API config file missing"
    exit 1
fi

# Check render.yaml
if [ -f "render.yaml" ]; then
    if grep -q "api.gobarry.co.uk" render.yaml; then
        echo "✅ Render config configured for custom domain"
    else
        echo "❌ Render config not configured for custom domain"
        exit 1
    fi
else
    echo "❌ render.yaml file missing"
    exit 1
fi

echo ""
echo "🔧 Pre-deployment checks..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd Go_BARRY
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

# Build frontend
echo "🏗️ Building frontend for production..."
if npm run build:web; then
    echo "✅ Frontend build successful"
    echo "📁 Build output: Go_BARRY/dist"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "🚀 Ready for Render deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Commit and push to your repository:"
echo "   git add ."
echo "   git commit -m 'Configure for gobarry.co.uk domain'"
echo "   git push origin main"
echo ""
echo "2. In Render Dashboard:"
echo "   🔗 Connect your repository to Render"
echo "   🎯 Deploy using render.yaml configuration"
echo "   🌐 Set up custom domains:"
echo "      - Frontend: gobarry.co.uk → barry-frontend service"
echo "      - Backend: api.gobarry.co.uk → go-barry service"
echo ""
echo "3. DNS Configuration (in your domain registrar):"
echo "   📝 Add CNAME records:"
echo "   - gobarry.co.uk → your-render-frontend-url.onrender.com"
echo "   - api.gobarry.co.uk → your-render-backend-url.onrender.com"
echo ""
echo "4. Environment Variables in Render:"
echo "   🔑 Set these in the Render dashboard for go-barry service:"
echo "   - TOMTOM_API_KEY"
echo "   - MAPQUEST_API_KEY"
echo "   - HERE_API_KEY"
echo "   - MAPBOX_API_KEY"
echo "   - NATIONAL_HIGHWAYS_API_KEY"
echo ""
echo "✅ Deployment preparation complete!"
echo "🌐 Your app will be available at: https://gobarry.co.uk"
echo "🔗 API will be available at: https://api.gobarry.co.uk"
