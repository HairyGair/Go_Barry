import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Script to generate GNE Fleet Database JSON from Excel file
const excelFile = process.argv[2] || 'GNE_Fleet_Master.xlsx';

if (!fs.existsSync(excelFile)) {
    console.error(`Error: Excel file '${excelFile}' not found!`);
    console.log('Usage: node generate-gne-fleet-json.mjs [path-to-excel-file]');
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
    let depotStats = {};
    
    dataRows.forEach(row => {
        if (row.length === 0) return; // Skip empty rows
        
        // Create object from row
        const record = {};
        headers.forEach((header, index) => {
            record[header] = row[index];
        });
        
        const depot = record['Depot'] || '';
        const allocatedDepot = record['Allocated Depot'] || '';
        
        // Track depot statistics
        depotStats[depot] = (depotStats[depot] || 0) + 1;
        
        // Check if from active depot
        let isActiveDepot = false;
        let matchedDepot = '';
        
        for (const activeDepot of activeDepots) {
            if (depot.toLowerCase().includes(activeDepot.toLowerCase()) ||
                allocatedDepot.toLowerCase().includes(activeDepot.toLowerCase())) {
                isActiveDepot = true;
                matchedDepot = activeDepot;
                break;
            }
        }
        
        if (isActiveDepot && record['FleetNo'] && record['RegNumber']) {
            fleetData.push({
                fleetNumber: String(record['FleetNo']),
                regNo: record['RegNumber'],
                vehicleType: record['VehicleType Equinox'] || record['Service Specific Vehicle Type'] || 'Unknown',
                depot: matchedDepot // Track which active depot
            });
        }
    });
    
    // Sort by fleet number
    fleetData.sort((a, b) => parseInt(a.fleetNumber) - parseInt(b.fleetNumber));
    
    // Remove depot field from final data (kept for statistics)
    const cleanFleetData = fleetData.map(({ depot, ...rest }) => rest);
    
    // Create final JSON structure
    const jsonDatabase = {
        lastUpdated: new Date().toISOString(),
        totalVehicles: cleanFleetData.length,
        activeDepots: activeDepots,
        fleet: cleanFleetData
    };
    
    // Save to file
    const outputFile = 'gne-fleet-database.json';
    fs.writeFileSync(outputFile, JSON.stringify(jsonDatabase, null, 2));
    
    // Print summary
    console.log('\n=== GNE Fleet Database Generation Complete ===');
    console.log(`✓ Created: ${outputFile}`);
    console.log(`✓ Total vehicles from active depots: ${jsonDatabase.totalVehicles}`);
    console.log(`✓ Active depots: ${activeDepots.join(', ')}`);
    
    // Show active depot distribution
    const activeDepotCounts = {};
    fleetData.forEach(bus => {
        activeDepotCounts[bus.depot] = (activeDepotCounts[bus.depot] || 0) + 1;
    });
    
    console.log('\nVehicles per active depot:');
    Object.entries(activeDepotCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([depot, count]) => {
            console.log(`  - ${depot}: ${count} vehicles`);
        });
    
    // Show vehicle type distribution
    const vehicleTypes = {};
    cleanFleetData.forEach(bus => {
        const simpleType = bus.vehicleType.split(' ').slice(0, 3).join(' ');
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
