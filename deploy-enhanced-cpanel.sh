#!/bin/bash

# Go BARRY Enhanced Display Screen - cPanel Deployment Script
# Version 3.0 with Supervisor Integration - FIXED
echo "🚀 Building Enhanced Go BARRY for cPanel Deployment..."
echo "✨ Includes: Supervisor Integration, Activity Feed, Enhanced Layout"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Ensure we're in the right directory
if [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Go_BARRY directory not found. Run this script from the project root."
    exit 1
fi

# Clean any existing deployment
echo "🧹 Cleaning previous deployment..."
rm -rf cpanel-deployment-enhanced/static
rm -f go-barry-enhanced-cpanel.zip

# Build the frontend with enhanced features
echo "🔨 Building enhanced frontend..."
cd Go_BARRY

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean any previous builds
rm -rf dist
rm -rf web-build

# Build for web with production optimization INSIDE the project directory
echo "📦 Running expo export for web (enhanced version)..."
npx expo export --platform web --output-dir dist --clear

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - no dist folder found"
    echo "💡 Try running: npm install && npx expo export --platform web"
    exit 1
fi

# Copy the built files to our deployment directory
echo "📋 Copying built files to deployment directory..."
cd ..
rm -rf cpanel-deployment-enhanced/static
mkdir -p cpanel-deployment-enhanced/static

# Copy all built files from Go_BARRY/dist to deployment directory
cp -r Go_BARRY/dist/* cpanel-deployment-enhanced/

# Copy assets if they exist
echo "📁 Copying assets..."
if [ -d "Go_BARRY/assets" ]; then
    mkdir -p cpanel-deployment-enhanced/assets
    cp -r Go_BARRY/assets/* cpanel-deployment-enhanced/assets/ 2>/dev/null || true
fi

# The expo build will have created an index.html, but we want our enhanced one
# So let's update the generated index.html with our enhancements
if [ -f "cpanel-deployment-enhanced/index.html" ]; then
    echo "🔧 Enhancing generated index.html with Go BARRY branding..."
    
    # Create our enhanced index.html by merging with expo's generated one
    cat > cpanel-deployment-enhanced/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go Barry - Traffic Intelligence Platform</title>
    
    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://go-barry.onrender.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- External CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Expo Web Generated Assets -->
    <link rel="icon" type="image/png" sizes="16x16" href="./assets/favicon.png">
    <link rel="shortcut icon" href="./assets/favicon.ico">
    
    <!-- Meta tags for Go Barry -->
    <meta name="description" content="Go Barry - Real-time Traffic Intelligence Platform for Go North East. Professional traffic monitoring and alert management.">
    <meta name="keywords" content="traffic, monitoring, go north east, alerts, transport, intelligence">
    <meta name="author" content="Go Barry">
    
    <style>
        /* Loading screen styles */
        #initial-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Inter', sans-serif;
        }
        
        .loading-logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 16px;
            letter-spacing: 2px;
            margin-bottom: 24px;
            animation: pulse 2s infinite;
        }
        
        .loading-title {
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .loading-subtitle {
            color: #9CA3AF;
            font-size: 16px;
            margin-bottom: 32px;
            text-align: center;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #374151;
            border-top: 4px solid #DC2626;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-status {
            color: #6B7280;
            font-size: 14px;
            margin-top: 16px;
            text-align: center;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* React app container */
        #root {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
        
        /* Global reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: #1F2937;
            color: #FFFFFF;
            overflow: hidden;
        }
    </style>
EOF

    # Add the expo generated CSS and JS links
    if [ -f "Go_BARRY/dist/index.html" ]; then
        # Extract CSS and JS links from expo's generated index.html
        grep -E "<link.*\.css|<script.*\.js" Go_BARRY/dist/index.html >> cpanel-deployment-enhanced/index.html || true
    fi

    # Complete the HTML
    cat >> cpanel-deployment-enhanced/index.html << 'EOF'
</head>
<body>
    <!-- Loading Screen -->
    <div id="initial-loading">
        <div class="loading-logo">GO BARRY</div>
        <div class="loading-title">Go Barry</div>
        <div class="loading-subtitle">Traffic Intelligence Platform</div>
        <div class="loading-spinner"></div>
        <div class="loading-status">Loading enhanced display screen...</div>
    </div>
    
    <!-- React App Root -->
    <div id="root"></div>
    
    <script>
        // Global configuration for Go Barry
        window.GoBarry = {
            version: '3.0',
            environment: 'production',
            apiUrl: 'https://go-barry.onrender.com',
            features: {
                supervisorPolling: true,
                enhancedDisplay: true,
                realTimeUpdates: true
            }
        };
        
        // Hide loading screen when app loads
        function hideLoadingScreen() {
            const loading = document.getElementById('initial-loading');
            if (loading) {
                loading.style.opacity = '0';
                loading.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
            }
        }
        
        // Auto-hide loading screen after 5 seconds as fallback
        setTimeout(hideLoadingScreen, 5000);
        
        // Hide when React app loads
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(hideLoadingScreen, 1000);
        });
        
        console.log('🚦 Go Barry - Traffic Intelligence Platform v3.0');
        console.log('🔗 API Backend:', window.GoBarry.apiUrl);
        console.log('✨ Enhanced Display Screen with Supervisor Integration');
    </script>
</body>
</html>
EOF

fi

# Ensure proper file structure
echo "🔧 Optimizing deployment structure..."

# Create favicon links if icon exists
if [ -f "cpanel-deployment-enhanced/assets/favicon.png" ]; then
    cp cpanel-deployment-enhanced/assets/favicon.png cpanel-deployment-enhanced/favicon.ico 2>/dev/null || true
fi

# Create ZIP package for easy upload
echo "📦 Creating deployment package..."
cd cpanel-deployment-enhanced
zip -r ../go-barry-enhanced-cpanel.zip . -x '*.DS_Store' '*.map' 'DEPLOYMENT_GUIDE.md'
cd ..

# Get deployment statistics
FILE_COUNT=$(find cpanel-deployment-enhanced -type f | wc -l)
ZIP_SIZE=$(du -sh go-barry-enhanced-cpanel.zip 2>/dev/null | cut -f1 || echo "Unknown")
FOLDER_SIZE=$(du -sh cpanel-deployment-enhanced 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "✅ Enhanced Go BARRY Deployment Ready!"
echo "======================================"
echo ""
echo "🌟 ENHANCED FEATURES INCLUDED:"
echo "   ✨ Supervisor count in display header"
echo "   📊 Real-time supervisor activity feed"
echo "   🎯 Enhanced 40/60 layout (alerts + map/activity)"
echo "   🔄 Supervisor integration (polling every 2s)"
echo "   🔒 Locked alerts handling"
echo "   📢 Custom broadcast messages"
echo "   ⚡ Live supervisor action sync"
echo ""
echo "📦 Package Details:"
echo "   📁 Folder: cpanel-deployment-enhanced/"
echo "   📦 ZIP File: go-barry-enhanced-cpanel.zip"
echo "   📊 ZIP Size: $ZIP_SIZE"
echo "   📄 Total Files: $FILE_COUNT"
echo "   💾 Folder Size: $FOLDER_SIZE"
echo ""
echo "🎯 Deployment Contents:"
echo "   ✅ Enhanced React build with supervisor features"
echo "   ✅ Optimized .htaccess (SPA routing + performance)"
echo "   ✅ Professional loading screen"
echo "   ✅ Enhanced deployment guide"
echo "   ✅ Complete Expo web build"
echo ""
echo "🚀 Upload Instructions:"
echo "======================"
echo "1. Upload 'go-barry-enhanced-cpanel.zip' to cPanel File Manager"
echo "2. Extract to public_html directory"
echo "3. Test enhanced features at:"
echo "   • Main App: https://gobarry.co.uk"
echo "   • Enhanced Display: https://gobarry.co.uk/display"
echo "   • Supervisor Interface: https://gobarry.co.uk/browser-main"
echo ""
echo "📖 See: cpanel-deployment-enhanced/DEPLOYMENT_GUIDE.md"
echo ""
echo "🔍 Test Enhanced Features:"
echo "   • Supervisor count in display header"
echo "   • Activity feed shows supervisor actions"
echo "   • Real-time sync between supervisor and display"
echo "   • Locked alerts stay on screen"
echo "   • Priority overrides and notes display"
echo ""
echo "🌐 Backend API: https://go-barry.onrender.com"
echo "⚡ Polling Rate: Every 2 seconds for real-time feel"
echo ""
echo "🎉 Enhanced Display Screen Deployment Complete!"
