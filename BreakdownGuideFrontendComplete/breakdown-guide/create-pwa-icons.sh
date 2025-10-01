#!/bin/bash

# Generate placeholder PWA icons
# These are SVG-based placeholders - replace with proper icons later

# Create the icons directory if it doesn't exist
mkdir -p "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/breakdown-guide/icons"

# Generate SVG placeholder icon
cat > "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete/breakdown-guide/icons/icon.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background -->
  <rect width="512" height="512" fill="#1e40af" rx="128"/>
  
  <!-- Bus Icon -->
  <g transform="translate(128,128) scale(4,4)">
    <!-- Bus body -->
    <rect x="8" y="16" width="48" height="32" fill="white" rx="4"/>
    
    <!-- Bus windows -->
    <rect x="12" y="20" width="8" height="6" fill="#1e40af" rx="1"/>
    <rect x="24" y="20" width="8" height="6" fill="#1e40af" rx="1"/>
    <rect x="36" y="20" width="8" height="6" fill="#1e40af" rx="1"/>
    <rect x="48" y="20" width="4" height="6" fill="#1e40af" rx="1"/>
    
    <!-- Bus door -->
    <rect x="12" y="30" width="8" height="12" fill="#dc2626" rx="1"/>
    
    <!-- Bus wheels -->
    <circle cx="16" cy="52" r="4" fill="#374151"/>
    <circle cx="48" cy="52" r="4" fill="#374151"/>
    
    <!-- Emergency badge -->
    <circle cx="40" cy="35" r="6" fill="#dc2626"/>
    <text x="40" y="38" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>
  </g>
  
  <!-- Text -->
  <text x="256" y="420" text-anchor="middle" fill="white" font-size="48" font-weight="bold" font-family="Arial, sans-serif">
    GNE
  </text>
  <text x="256" y="460" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif">
    Breakdown Guide
  </text>
</svg>
EOF

echo "✅ Created placeholder PWA icon at icons/icon.svg"
echo "🔧 Replace with proper icons for production deployment"
echo "📱 Icon sizes needed: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
