#!/bin/bash

# Check if xlsx is installed
if ! npm list xlsx &> /dev/null; then
    echo "Installing XLSX package..."
    npm install xlsx
fi

# Check if Excel file exists
if [ ! -f "GNE_Fleet_Master.xlsx" ]; then
    echo "❌ Error: GNE_Fleet_Master.xlsx not found in current directory"
    echo ""
    echo "Please either:"
    echo "1. Copy GNE_Fleet_Master.xlsx to this directory"
    echo "2. Run with: node generate-gne-fleet-json.mjs /path/to/GNE_Fleet_Master.xlsx"
    exit 1
fi

# Generate the JSON database
echo "Generating fleet database..."
node generate-gne-fleet-json.mjs

if [ -f "gne-fleet-database.json" ]; then
    echo "✅ Done! Check gne-fleet-database.json"
    echo "Total vehicles: $(grep -c 'fleetNumber' gne-fleet-database.json)"
else
    echo "❌ Failed to generate database"
fi
