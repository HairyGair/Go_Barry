#!/bin/bash
# Go BARRY Convex Migration Script

echo "🚀 Starting Go BARRY Convex Migration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Go_BARRY directory"
    echo "Please cd to Go_BARRY directory first"
    exit 1
fi

# Step 1: Install Convex
echo "📦 Installing Convex..."
npm install convex

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    echo "CONVEX_URL=https://your-project.convex.cloud" > .env
    echo "⚠️  Please update CONVEX_URL in .env after running convex dev"
fi

# Step 3: Initialize Convex
echo "🔧 Initializing Convex..."
echo "When prompted:"
echo "1. Choose 'create a new project' or select existing"
echo "2. Give your project a name (e.g., go-barry)"
echo ""
npx convex dev

echo "✅ Convex setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Convex URL"
echo "2. Follow the migration guide to update components"
echo "3. Test the real-time sync"
echo ""
echo "Happy coding! 🎉"
