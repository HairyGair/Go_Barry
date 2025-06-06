#!/bin/bash

# Go Barry v3.0 - Browser Build Verification Script

echo "🔧 Fixing browser build issues..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Installing updated dependencies..."
npm install

print_status "Clearing expo cache..."
npx expo install --fix

print_status "Building browser version..."
npm run build:web:production

if [ $? -eq 0 ]; then
    print_success "🎉 Browser build completed successfully!"
    echo ""
    print_status "📁 Files ready in dist/ folder"
    print_status "🚀 Test with: npm run serve"
else
    print_error "❌ Build failed. Check the error messages above."
    exit 1
fi
