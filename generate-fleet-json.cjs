const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

// Script to generate GNE Fleet Database JSON from Excel file
// Usage: node generate-fleet-json.js [path-to-excel-file]

const excelFile = process.argv[2] || 'GNE_Fleet_Master.xlsx';

if (!fs.existsSync(excelFile)) {
    console.error(`Error: Excel file '${excelFile}' not found!`);
    console.log('Usage: node generate-fleet-json.js [path-to-excel-file]');
    process.exit(1);
}

try {
    // Read the Excel file
    console.log(`Reading Excel file: ${excelFile}`);
    const workbook = XLSX.readFile(excelFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON, skip first row (header note)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rawData[1]; // Second row contains headers
    const dataRows = rawData.slice(2); // Skip header rows
    
    // Define active depots
    const activeDepots = ['Washington', 'Hexham', 'Riverside', 'Percy Main', 'Deptford', 'Consett'];
    
    // Process the data
    const fleetData = [];
    let skippedCount = 0;
    
    dataRows.forEach(row => {
        if (row.length === 0) return; // Skip empty rows
        
        // Create object from row
        const record = {};
        headers.forEach((header, index) => {
            record[header] = row[index];
        });
        
        const depot = record['Depot'] || '';
        const allocatedDepot = record['Allocated Depot'] || '';
        
        // Check if from active depot
        let isActiveDepot = false;
        for (const activeDepot of activeDepots) {
            if (depot.toLowerCase().includes(activeDepot.toLowerCase()) ||
                allocatedDepot.toLowerCase().includes(activeDepot.toLowerCase())) {
                isActiveDepot = true;
                break;
            }
        }
        
        if (isActiveDepot && record['FleetNo'] && record['RegNumber']) {
            fleetData.push({
                fleetNumber: String(record['FleetNo']),
                regNo: record['RegNumber'],
                vehicleType: record['VehicleType Equinox'] || record['Service Specific Vehicle Type'] || 'Unknown'
            });
        } else if (!isActiveDepot && record['FleetNo']) {
            skippedCount++;
        }
    });
    
    // Sort by fleet number
    fleetData.sort((a, b) => parseInt(a.fleetNumber) - parseInt(b.fleetNumber));
    
    // Create final JSON structure
    const jsonDatabase = {
        lastUpdated: new Date().toISOString(),
        totalVehicles: fleetData.length,
        activeDepots: activeDepots,
        fleet: fleetData
    };
    
    // Save to file
    const outputFile = 'gne-fleet-database.json';
    fs.writeFileSync(outputFile, JSON.stringify(jsonDatabase, null, 2));
    
    // Print summary
    console.log('\n=== GNE Fleet Database Generation Complete ===');
    console.log(`✓ Created: ${outputFile}`);
    console.log(`✓ Total vehicles from active depots: ${jsonDatabase.totalVehicles}`);
    console.log(`✓ Vehicles from inactive depots skipped: ${skippedCount}`);
    console.log(`✓ Active depots: ${activeDepots.join(', ')}`);
    
    // Show vehicle type distribution
    const vehicleTypes = {};
    fleetData.forEach(bus => {
        const simpleType = bus.vehicleType.split(' ')[0] + ' ' + bus.vehicleType.split(' ')[1];
        vehicleTypes[simpleType] = (vehicleTypes[simpleType] || 0) + 1;
    });
    
    console.log('\nTop vehicle types:');
    Object.entries(vehicleTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, count]) => {
            console.log(`  - ${type}: ${count} vehicles`);
        });
        
} catch (error) {
    console.error('Error processing Excel file:', error.message);
    process.exit(1);
}
