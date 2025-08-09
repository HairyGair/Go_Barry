#!/bin/bash

# Go_BARRY/check-wizards-for-update.sh
# Script to check which wizard files need breakdown logging added

echo "🔍 Checking wizard files for breakdown logging integration..."
echo ""

WIZARD_DIR="/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards"
WIZARDS_TO_CHECK=(
    "SteeringWizard.js:Steering"
    "BrakesWizard.js:Brakes"
    "BatteryWizard.js:Battery"
    "DoorsWizard.js:Doors"
    "NonStarterWizard.js:Non-Starter"
    "ABSLightWizard.js:ABS Light"
    "OilWarningLightWizard.js:Oil Warning Light"
    "LooseWheelNutsWizard.js:Loose Wheel Nuts"
    "CoolingSystemWizard.js:Overheating"
    "LowWaterWizard.js:Low Water"
    "GearboxWizard.js:Gearbox"
    "SuspensionWizard.js:Suspension"
    "WheelchairRampWizard.js:Ramp Stuck"
    "ExcessiveSmokeWizard.js:Excessive Smoke"
    "WipersScreenwashWizard.js:Wipers/Screenwash"
    "ExteriorLightsWizard.js:Exterior Lights"
    "InteriorLightsWizard.js:Interior Lights"
    "PunctureWizard.js:Puncture"
)

echo "Checking ${#WIZARDS_TO_CHECK[@]} wizard files..."
echo ""

NEEDS_UPDATE=0
ALREADY_UPDATED=0

for wizard_info in "${WIZARDS_TO_CHECK[@]}"; do
    IFS=':' read -r filename breakdown_type <<< "$wizard_info"
    filepath="$WIZARD_DIR/$filename"
    
    if [ -f "$filepath" ]; then
        if grep -q "window.logBreakdown" "$filepath"; then
            echo "✅ $filename - Already has breakdown logging"
            ((ALREADY_UPDATED++))
        else
            echo "❌ $filename - Needs breakdown logging for '$breakdown_type'"
            ((NEEDS_UPDATE++))
        fi
    else
        echo "⚠️  $filename - File not found"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "✅ Already updated: $ALREADY_UPDATED"
echo "❌ Needs update: $NEEDS_UPDATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $NEEDS_UPDATE -gt 0 ]; then
    echo "📝 To update a wizard, add this to the final confirmation handler:"
    echo ""
    echo "try {"
    echo "    await window.logBreakdown({"
    echo "        supervisorId: window.AppConstants.currentSupervisor,"
    echo "        vehicleReg: window.selectedReg,"
    echo "        fleetNo: window.selectedFleetNo,"
    echo "        breakdownType: 'YOUR_TYPE_HERE',"
    echo "        timestamp: new Date().toISOString()"
    echo "    });"
    echo "} catch (error) {"
    echo "    console.error('Failed to log breakdown:', error);"
    echo "}"
fi
