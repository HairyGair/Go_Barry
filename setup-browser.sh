#!/bin/bash

# Quick setup script for Go Barry v3.0 Browser-First

echo "🚀 Setting up Go Barry v3.0 Browser-First..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install Go_BARRY dependencies  
echo "📦 Installing Go_BARRY dependencies..."
cd Go_BARRY
npm install

echo "✅ Setup complete!"
echo ""
echo "🎯 Now you can:"
echo "   npm run dev:browser    # Start development server"
echo "   npm run build:browser  # Build for production"
echo "   npm run preview        # Build and preview locally"
echo ""
