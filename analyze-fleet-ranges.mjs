// Quick fleet analysis script
// Run this with: node analyze-fleet-ranges.mjs

import fs from 'fs';

try {
    const data = JSON.parse(fs.readFileSync('./gne-fleet-database.json', 'utf8'));
    console.log(`📊 Total vehicles in source: ${data.totalVehicles}`);
    
    // Current depot logic (same as in our components)
    function currentEstimateDepot(fleetNumber) {
        const num = parseInt(fleetNumber);
        
        if (num >= 3941 && num <= 3965) return 'Consett';
        if (num >= 5210 && num <= 5229) return 'Deptford';
        if (num >= 5230 && num <= 5249) return 'Percy Main';
        if (num >= 5250 && num <= 5274) return 'Deptford';
        if (num >= 5275 && num <= 5284) return 'Percy Main';
        if (num >= 5285 && num <= 5309) return 'Riverside';
        if (num >= 5310 && num <= 5337) return 'Washington';
        if (num >= 5338 && num <= 5376) return 'Consett';
        if (num >= 5377 && num <= 5409) return 'Deptford';
        if (num >= 5410 && num <= 5419) return 'Hexham';
        if (num >= 5420 && num <= 5437) return 'Percy Main';
        if (num >= 5438 && num <= 5452) return 'Riverside';
        if (num >= 5453 && num <= 5479) return 'Washington';
        if (num >= 5480 && num <= 5499) return 'Consett';
        if (num >= 6001 && num <= 6007) return 'Deptford';
        if (num >= 6008 && num <= 6014) return 'Hexham';
        if (num >= 6043 && num <= 6048) return 'Percy Main';
        if (num >= 6049 && num <= 6055) return 'Riverside';
        if (num >= 6056 && num <= 6070) return 'Washington';
        if (num >= 6071 && num <= 6084) return 'Consett';
        if (num >= 6085 && num <= 6098) return 'Washington';
        if (num >= 6099 && num <= 6117) return 'Riverside';
        if (num >= 6118 && num <= 6146) return 'Percy Main';
        if (num >= 6147 && num <= 6161) return 'Consett';
        if (num >= 6162 && num <= 6175) return 'Hexham';
        if (num >= 6308 && num <= 6332) return 'Consett';
        if (num >= 6333 && num <= 6337) return 'Washington';
        if (num >= 6338 && num <= 6355) return 'Percy Main';
        if (num >= 6356 && num <= 6376) return 'Riverside';
        if (num >= 6917 && num <= 6923) return 'Percy Main';
        if (num >= 6924 && num <= 6931) return 'Riverside';
        if (num >= 6932 && num <= 6949) return 'Percy Main';
        if (num >= 6950 && num <= 6964) return 'Washington';
        if (num >= 6965 && num <= 6970) return 'Percy Main';
        if (num >= 6971 && num <= 6999) return 'Riverside';
        
        return 'Non-operational';
    }
    
    // Analyze all vehicles
    const operationalDepots = ['Percy Main', 'Riverside', 'Hexham', 'Consett', 'Deptford', 'Washington'];
    const included = [];
    const excluded = [];
    
    data.fleet.forEach(vehicle => {
        const fleetNumber = vehicle.fleetNumber;
        const depot = currentEstimateDepot(fleetNumber);
        
        if (operationalDepots.includes(depot)) {
            included.push({ fleet: fleetNumber, depot: depot });
        } else {
            excluded.push({ fleet: fleetNumber, depot: depot });
        }
    });
    
    console.log(`✅ Currently included: ${included.length}`);
    console.log(`❌ Currently excluded: ${excluded.length}`);
    console.log(`🎯 Target: 541`);
    console.log(`📈 Need to add: ${541 - included.length} vehicles`);
    
    // Analyze excluded vehicles by range
    console.log('\n🔍 EXCLUDED VEHICLE RANGES:');
    const ranges = {};
    excluded.forEach(vehicle => {
        const num = parseInt(vehicle.fleet);
        const range100 = Math.floor(num / 100) * 100;
        const rangeKey = `${range100}-${range100 + 99}`;
        if (!ranges[rangeKey]) ranges[rangeKey] = [];
        ranges[rangeKey].push(vehicle);
    });
    
    // Sort ranges by count and show top ranges
    Object.entries(ranges)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 15)
        .forEach(([range, vehicles]) => {
            console.log(`${range}: ${vehicles.length} vehicles`);
            // Show first few fleet numbers in each range
            const fleetNums = vehicles.slice(0, 8).map(v => v.fleet).join(', ');
            console.log(`  Fleet numbers: ${fleetNums}${vehicles.length > 8 ? '...' : ''}`);
        });
    
    // Show specific excluded vehicles to help identify patterns
    console.log('\n📋 SAMPLE EXCLUDED VEHICLES:');
    excluded.slice(0, 50).forEach(vehicle => {
        console.log(`Fleet ${vehicle.fleet} - ${vehicle.depot}`);
    });
    
} catch (error) {
    console.error('Error:', error.message);
}
