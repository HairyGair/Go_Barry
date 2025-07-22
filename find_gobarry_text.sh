#!/bin/bash

# Script to find and count instances of Go BARRY text that need to be replaced with logo

cd "/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide"

echo "Searching for instances of Go BARRY text pattern..."
echo ""

# Count instances of the text pattern
echo "=== Instances of 'text-3xl font-black text-white'>Go</span>' pattern ==="
grep -n "text-3xl font-black text-white\">Go</span>" App.js | wc -l

echo ""
echo "=== Lines with this pattern ==="
grep -n "text-3xl font-black text-white\">Go</span>" App.js | head -10

echo ""
echo "Done!"
