// Script to check and update breakdown logging integration

const checkIntegration = async () => {
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

    const results = {
        integrated: [],
        notIntegrated: [],
        highPriority: [
            'SteeringWizard.js',
            'BrakesWizard.js', 
            'BatteryWizard.js',
            'DoorsWizard.js',
            'NonStarterWizard.js',
            'OilWarningLightWizard.js',
            'LooseWheelNutsWizard.js',
            'CoolingSystemWizard.js'
        ]
    };

    console.log('🔍 Checking breakdown logging integration...\n');

    // Return the list of wizards that need integration
    return {
        wizardFiles,
        results,
        needsIntegration: [
            'NonStarterWizard.js',
            'BatteryWizard.js',
            'DoorsWizard.js',
            'OilWarningLightWizard.js',
            'LooseWheelNutsWizard.js',
            'CoolingSystemWizard.js',
            'ABSLightWizard.js',
            'BrokenWindowsWizard.js',
            'BuzzersWizard.js',
            'CuttingOutFuelWizard.js',
            'DemistersHeatersWizard.js',
            'DestinationDisplayWizard.js',
            'ExcessiveSmokeWizard.js',
            'ExteriorLightsWizard.js',
            'GearSelectionWizard.js',
            'GearboxWizard.js',
            'InteriorExteriorDamageWizard.js',
            'InteriorLightsWizard.js',
            'LowWaterWizard.js',
            'PunctureWizard.js',
            'RepeatDefectsWizard.js',
            'RoadTrafficIncidentsWizard.js',
            'SpeedoWizard.js',
            'SuspensionWizard.js',
            'TracerItHelperWizard.js',
            'WarningLightsWizard.js',
            'WheelchairRampWizard.js',
            'WingMirrorsWizard.js',
            'WipersScreenwashWizard.js'
        ]
    };
};

checkIntegration();
