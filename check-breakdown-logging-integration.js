#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to wizards directory
const wizardsDir = path.join(__dirname, 'Go_BARRY/public/breakdown-guide/components/wizards');

// List of all wizard files
const wizardFiles = [
    'ABSLightWizard.js',
    'BatteryWizard.js',
    'BrakesWizard.js',
    'BrokenWindowsWizard.js',
    'BuzzersWizard.js',
    'CoolingSystemWizard.js',
    'CuttingOutFuelWizard.js',
    'DemistersHeatersWizard.js',
    'DestinationDisplayWizard.js',
    'DoorsWizard.js',
    'ExcessiveSmokeWizard.js',
    'ExteriorLightsWizard.js',
    'GearSelectionWizard.js',
    'GearboxWizard.js',
    'InteriorExteriorDamageWizard.js',
    'InteriorLightsWizard.js',
    'LooseWheelNutsWizard.js',
    'LowWaterWizard.js',
    'NonStarterWizard.js',
    'OilWarningLightWizard.js',
    'PunctureWizard.js',
    'RepeatDefectsWizard.js',
    'RoadTrafficIncidentsWizard.js',
    'SpeedoWizard.js',
    'SteeringWizard.js',
    'SuspensionWizard.js',
    'TracerItHelperWizard.js',
    'WarningLightsWizard.js',
    'WheelchairRampWizard.js',
    'WingMirrorsWizard.js',
    'WipersScreenwashWizard.js'
];

console.log('🔍 Checking breakdown logging integration in all wizards...\n');

const results = {
    integrated: [],
    notIntegrated: [],
    errors: []
};

wizardFiles.forEach(wizardFile => {
    const filePath = path.join(wizardsDir, wizardFile);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file contains window.logBreakdown
        if (content.includes('window.logBreakdown')) {
            results.integrated.push(wizardFile);
            
            // Extract the breakdown type being logged
            const match = content.match(/breakdownType:\s*['"]([^'"]+)['"]/);
            const breakdownType = match ? match[1] : 'Unknown';
            console.log(`✅ ${wizardFile} - Logging integrated (Type: ${breakdownType})`);
        } else {
            results.notIntegrated.push(wizardFile);
            console.log(`❌ ${wizardFile} - Logging NOT integrated`);
        }
    } catch (error) {
        results.errors.push({ file: wizardFile, error: error.message });
        console.log(`⚠️ ${wizardFile} - Error reading file: ${error.message}`);
    }
});

console.log('\n📊 Summary:');
console.log(`✅ Integrated: ${results.integrated.length} wizards`);
console.log(`❌ Not Integrated: ${results.notIntegrated.length} wizards`);
console.log(`⚠️ Errors: ${results.errors.length} files`);

console.log('\n📝 Wizards needing integration:');
results.notIntegrated.forEach(wizard => {
    const wizardName = wizard.replace('Wizard.js', '');
    console.log(`- ${wizard} (Type: '${wizardName}')`);
});

// Write results to a file for reference
const resultsPath = path.join(__dirname, 'breakdown-logging-integration-status.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Results saved to: ${resultsPath}`);
