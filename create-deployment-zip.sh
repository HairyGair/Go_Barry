#!/bin/bash

# Go Barry Deployment Package Creator
echo "🚀 Creating Go Barry Deployment Package..."

# Navigate to the deployment package directory
cd "$(dirname "$0")/deployment-package"

# Create the zip file
echo "📦 Creating gobarry-website-deployment.zip..."
zip -r "../gobarry-website-deployment.zip" .

echo "✅ Deployment package created successfully!"
echo ""
echo "📋 Package Contents:"
echo "   • index.html (Homepage)"
echo "   • display-screen/index.html (Control Room Display)"
echo "   • supervisor/index.html (Supervisor Dashboard)"
echo "   • gobarry-logo.png (Logo file)"
echo "   • README.md (Deployment instructions)"
echo ""
echo "🌐 Upload this zip file to gobarry.co.uk to make the website work!"
echo ""
echo "📍 URLs after deployment:"
echo "   • https://gobarry.co.uk → Homepage"
echo "   • https://gobarry.co.uk/display-screen/ → Control Room"
echo "   • https://gobarry.co.uk/supervisor/ → Supervisor Tools"
echo ""
echo "🔗 API Backend: https://go-barry.onrender.com"
echo ""
echo "✨ Ready to deploy Go Barry! 🚦"