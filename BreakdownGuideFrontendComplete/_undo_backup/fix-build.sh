#!/bin/bash

# Fix Build Script for Breakdown Guide Frontend
echo "🔧 Fixing build issues..."

# Navigate to the breakdown-guide directory
cd breakdown-guide

# 1. Remove the problematic breakdownLogger.js reference
echo "📝 Fixing index-modern.html..."
if [ -f "index-modern.html" ]; then
    # Create backup
    cp index-modern.html index-modern.html.backup
    
    # Remove the problematic line
    sed -i '' '/<script src="\.\.\/breakdownLogger\.js"><\/script>/d' index-modern.html
    
    # Change type="text/babel" to type="module" for all wizard scripts
    sed -i '' 's/type="text\/babel"/type="module"/g' index-modern.html
    
    echo "✅ Fixed index-modern.html"
else
    echo "⚠️ index-modern.html not found"
fi

# 2. Create a simple package.json if it doesn't exist
if [ ! -f "../package.json" ]; then
    echo "📦 Creating package.json..."
    cat > ../package.json << 'EOF'
{
  "name": "breakdown-guide-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.simple.js",
    "build": "vite build --config vite.config.simple.js",
    "preview": "vite preview --config vite.config.simple.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
EOF
    echo "✅ Created package.json"
fi

echo ""
echo "🎉 Build issues fixed!"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Build for production: npm run build"
echo "3. Or run locally: npm run dev"
echo ""
echo "The build should now work without errors!"
