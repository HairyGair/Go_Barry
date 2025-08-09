#!/bin/bash

echo "🔍 Checking breakdown logging integration in all wizards..."
echo ""

# Directory containing wizards
WIZARD_DIR="/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards"

# Initialize counters
integrated=0
not_integrated=0

# Check each wizard file
for wizard_file in "$WIZARD_DIR"/*.js; do
    if [ -f "$wizard_file" ]; then
        filename=$(basename "$wizard_file")
        
        # Check if file contains window.logBreakdown
        if grep -q "window.logBreakdown" "$wizard_file"; then
            # Extract breakdown type
            breakdown_type=$(grep -o "breakdownType: '[^']*'" "$wizard_file" | cut -d"'" -f2)
            echo "✅ $filename - Logging integrated (Type: '$breakdown_type')"
            ((integrated++))
        else
            echo "❌ $filename - Logging NOT integrated"
            ((not_integrated++))
        fi
    fi
done

echo ""
echo "📊 Summary:"
echo "✅ Integrated: $integrated wizards"
echo "❌ Not Integrated: $not_integrated wizards"
echo ""
echo "📝 Wizards needing integration:"
for wizard_file in "$WIZARD_DIR"/*.js; do
    if [ -f "$wizard_file" ]; then
        filename=$(basename "$wizard_file")
        if ! grep -q "window.logBreakdown" "$wizard_file"; then
            wizard_name=${filename%.js}
            wizard_name=${wizard_name%Wizard}
            echo "- $filename (Type: '$wizard_name')"
        fi
    fi
done
