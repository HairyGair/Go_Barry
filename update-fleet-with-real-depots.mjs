// Update fleet database with REAL depot assignments from Excel
// This replaces all the guesswork with actual data!

import fs from 'fs';

try {
    console.log('🔄 Updating fleet database with real depot assignments...');
    
    // Load the real depot assignments
    const realDepots = JSON.parse(fs.readFileSync('./real-depot-assignments.json', 'utf8'));
    console.log(`📊 Loaded ${Object.keys(realDepots).length} real depot assignments`);
    
    // Load the current fleet database
    const currentFleetData = JSON.parse(fs.readFileSync('./gne-fleet-database.json', 'utf8'));
    console.log(`📊 Current fleet database has ${currentFleetData.totalVehicles} vehicles`);
    
    // Depot name mapping to standardize names
    const depotNameMapping = {
        'Gateshead Riverside': 'Riverside',
        'Percy Main ': 'Percy Main', // Handle trailing space
        'Percy Main': 'Percy Main',
        'Deptford': 'Deptford',
        'Consett': 'Consett', 
        'Washington': 'Washington',
        'Hexham': 'Hexham'
    };
    
    // Operational depots (the 6 you want)
    const operationalDepots = ['Percy Main', 'Riverside', 'Hexham', 'Consett', 'Deptford', 'Washington'];
    
    // Update the fleet database with real depot assignments
    const updatedFleet = [];
    let operationalCount = 0;
    const depotCounts = {};
    
    currentFleetData.fleet.forEach(vehicle => {
        const fleetNumber = vehicle.fleetNumber;
        const realDepotData = realDepots[fleetNumber];
        
        if (realDepotData) {
            // Map depot name to standardized version
            const mappedDepot = depotNameMapping[realDepotData.depot] || realDepotData.depot;
            
            // Only include vehicles from operational depots
            if (operationalDepots.includes(mappedDepot)) {
                updatedFleet.push({
                    fleetNumber: vehicle.fleetNumber,
                    regNo: realDepotData.registration,
                    vehicleType: vehicle.vehicleType,
                    depot: mappedDepot  // Add real depot assignment
                });
                
                operationalCount++;
                depotCounts[mappedDepot] = (depotCounts[mappedDepot] || 0) + 1;
            }
        }
    });
    
    // Create updated fleet database
    const updatedFleetDatabase = {
        lastUpdated: new Date().toISOString(),
        totalVehicles: operationalCount,
        activeDepots: operationalDepots,
        fleet: updatedFleet
    };
    
    // Save updated database
    fs.writeFileSync('./gne-fleet-database-updated.json', JSON.stringify(updatedFleetDatabase, null, 2));
    
    console.log('\n✅ FLEET DATABASE UPDATED WITH REAL DEPOT ASSIGNMENTS!');
    console.log(`📁 Updated database saved to: gne-fleet-database-updated.json`);
    console.log(`🚌 Operational vehicles: ${operationalCount}`);
    console.log(`🎯 Target: 541`);
    console.log(`📊 Difference: ${541 - operationalCount}`);
    
    console.log('\n🏢 FINAL DEPOT BREAKDOWN:');
    Object.entries(depotCounts).sort((a, b) => b[1] - a[1]).forEach(([depot, count]) => {
        console.log(`  ${depot}: ${count} vehicles`);
    });
    
    // Show sample assignments
    console.log('\n📋 SAMPLE REAL ASSIGNMENTS:');
    updatedFleet.slice(0, 10).forEach(vehicle => {
        console.log(`  Fleet ${vehicle.fleetNumber}: ${vehicle.depot} (${vehicle.regNo})`);
    });
    
    if (operationalCount !== 541) {
        console.log(`\n⚠️  Note: Got ${operationalCount} vehicles instead of expected 541.`);
        console.log('This might be due to:');
        console.log('- Vehicles in depot but not marked as operational');
        console.log('- Different operational criteria');
        console.log('- Data timing differences');
    }
    
} catch (error) {
    console.error('❌ Error updating fleet database:', error.message);
}
