#!/bin/bash
# Make this script executable: chmod +x verify-copyright.sh

echo "🔍 Verifying copyright implementation..."
echo ""

# Check landing page
echo "1️⃣ Checking landing page footer..."
if grep -q "© 2024-2025 Anthony Gair. All rights reserved." Go_BARRY/app/index.jsx; then
    echo "✅ Landing page copyright correct"
else
    echo "❌ Landing page copyright not found"
fi

# Check file headers
echo ""
echo "2️⃣ Checking source file headers..."
if grep -q "© 2024-2025 Anthony Gair. All rights reserved." Go_BARRY/app/index.jsx; then
    echo "✅ Frontend header copyright correct"
else
    echo "❌ Frontend header copyright not found"
fi

if grep -q "© 2024-2025 Anthony Gair. All rights reserved." backend/index.js; then
    echo "✅ Backend header copyright correct"
else
    echo "❌ Backend header copyright not found"
fi

# Check LICENSE file
echo ""
echo "3️⃣ Checking LICENSE file..."
if grep -q "Copyright (c) 2024-2025 Anthony Gair" LICENSE; then
    echo "✅ LICENSE file correct"
else
    echo "❌ LICENSE file incorrect"
fi

# Check package.json files
echo ""
echo "4️⃣ Checking package.json files..."
if grep -q '"copyright": "© 2024-2025 Anthony Gair. All rights reserved."' Go_BARRY/package.json; then
    echo "✅ Frontend package.json copyright correct"
else
    echo "❌ Frontend package.json copyright incorrect"
fi

if grep -q '"copyright": "© 2024-2025 Anthony Gair. All rights reserved."' backend/package.json; then
    echo "✅ Backend package.json copyright correct"
else
    echo "❌ Backend package.json copyright incorrect"
fi

# Check for any remaining "Go North East" references in copyright contexts
echo ""
echo "5️⃣ Checking for removed references..."
if grep -r "© 2024-2025 Go North East" . --include="*.js" --include="*.jsx" --include="*.json" --include="LICENSE" --include="*.md" 2>/dev/null | grep -v node_modules | grep -v ".git"; then
    echo "❌ Found remaining 'Go North East' copyright references!"
else
    echo "✅ No 'Go North East' copyright references found"
fi

echo ""
echo "📋 Summary:"
echo "Your copyright '© 2024-2025 Anthony Gair. All rights reserved.' should appear in:"
echo "  - Landing page footer"
echo "  - Source code headers"
echo "  - LICENSE file"
echo "  - README.md"
echo "  - Package.json files"
echo ""
echo "✅ Copyright verification complete!"
