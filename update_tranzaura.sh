#!/bin/bash
# Script to find and replace Go-Check with Tranzaura in all wizard files

cd "/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards/"

# List of all wizard files that need updating
files=(
    "ABSLightWizard.js"
    "BatteryWizard.js"
    "BrokenWindowsWizard.js"
    "BuzzersWizard.js"
    "CoolingSystemWizard.js"
    "CuttingOutFuelWizard.js"
    "DemistersHeatersWizard.js"
    "DestinationDisplayWizard.js"
    "DoorsWizard.js"
    "ExcessiveSmokeWizard.js"
    "ExteriorLightsWizard.js"
    "GearSelectionWizard.js"
    "GearboxWizard.js"
    "InteriorExteriorDamageWizard.js"
    "InteriorLightsWizard.js"
    "LooseWheelNutsWizard.js"
    "LowWaterWizard.js"
    "NonStarterWizard.js"
    "PunctureWizard.js"
    "RoadTrafficIncidentsWizard.js"
    "SpeedoWizard.js"
    "SuspensionWizard.js"
    "TracerItHelperWizard.js"
    "WarningLightsWizard.js"
    "WheelchairRampWizard.js"
    "WingMirrorsWizard.js"
    "WipersScreenwashWizard.js"
)

# Replace Go-Check with Tranzaura in each file
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "Processing $file..."
        # Use sed to replace both variations
        sed -i '' 's/Go-Check/Tranzaura/g' "$file"
        sed -i '' 's/Go Check/Tranzaura/g' "$file"
    fi
done

echo "Replacement complete!"
