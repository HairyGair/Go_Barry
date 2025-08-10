// Extract real depot assignments from Excel file - ROBUST VERSION
// Run with: node extract-real-depots.mjs

import XLSX from 'xlsx';
import fs from 'fs';

const EXCEL_FILE = './GNE_Fleet_Master.xlsx';
const OUTPUT_FILE = './real-depot-assignments.json';

try {
    console.log('📊 Reading Excel file with robust header detection...');
    
    const workbook = XLSX.readFile(EXCEL_FILE);
    console.log('📚 Available sheets:', workbook.SheetNames);
    
    let foundData = false;
    let realDepotAssignments = {};
    
    // Check each sheet
    for (const sheetName of workbook.SheetNames) {
        console.log(`\n🔍 Checking sheet: "${sheetName}"`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`  Rows in sheet: ${data.length}`);
        
        if (data.length === 0) continue;
        
        // Check first 10 rows for headers
        for (let rowIndex = 0; rowIndex < Math.min(10, data.length); rowIndex++) {
            const row = data[rowIndex];
            console.log(`  Row ${rowIndex + 1}:`, row?.slice(0, 8) || 'empty');
            
            // Look for our target columns in this row
            if (row && Array.isArray(row)) {
                const allocatedDepotIndex = row.findIndex(h => h && h.toString().includes('Allocated Depot'));
                const fleetNoIndex = row.findIndex(h => h && h.toString().includes('FleetNo'));
                const regNumberIndex = row.findIndex(h => h && h.toString().includes('RegNumber'));
                
                if (allocatedDepotIndex >= 0 && fleetNoIndex >= 0) {
                    console.log(`\n✅ FOUND HEADERS in sheet "${sheetName}", row ${rowIndex + 1}!`);
                    console.log(`  Allocated Depot: column ${allocatedDepotIndex}`);
                    console.log(`  FleetNo: column ${fleetNoIndex}`);
                    console.log(`  RegNumber: column ${regNumberIndex}`);
                    
                    // Extract data starting from the next row
                    const depotCounts = {};
                    const operationalDepots = ['Percy Main', 'Riverside', 'Hexham', 'Consett', 'Deptford', 'Washington'];
                    let operationalCount = 0;
                    let totalProcessed = 0;
                    
                    for (let dataRowIndex = rowIndex + 1; dataRowIndex < data.length; dataRowIndex++) {
                        const dataRow = data[dataRowIndex];
                        const fleetNo = dataRow[fleetNoIndex];
                        const depot = dataRow[allocatedDepotIndex];
                        const regNumber = dataRow[regNumberIndex];
                        
                        if (fleetNo && depot) {
                            realDepotAssignments[fleetNo.toString()] = {
                                fleetNumber: fleetNo.toString(),
                                depot: depot,
                                registration: regNumber || 'Unknown'
                            };
                            
                            depotCounts[depot] = (depotCounts[depot] || 0) + 1;
                            
                            if (operationalDepots.includes(depot)) {
                                operationalCount++;
                            }
                            
                            totalProcessed++;
                        }
                    }
                    
                    console.log(`\n📊 EXTRACTION RESULTS:`);
                    console.log(`  Total vehicles processed: ${totalProcessed}`);
                    console.log(`  Operational vehicles (6 depots): ${operationalCount}`);
                    console.log(`  Expected: 541`);
                    console.log(`  Difference: ${541 - operationalCount}`);
                    
                    console.log('\n🏢 DEPOT BREAKDOWN:');
                    Object.entries(depotCounts).sort((a, b) => b[1] - a[1]).forEach(([depot, count]) => {
                        const isOperational = operationalDepots.includes(depot);
                        console.log(`  ${depot}: ${count} vehicles ${isOperational ? '✅' : '❌'}`);
                    });
                    
                    // Show some examples
                    console.log('\n📋 SAMPLE DEPOT ASSIGNMENTS:');
                    Object.entries(realDepotAssignments).slice(0, 10).forEach(([fleetNo, data]) => {
                        console.log(`  Fleet ${fleetNo}: ${data.depot} (${data.registration})`);
                    });
                    
                    foundData = true;
                    break;
                }
            }
        }
        
        if (foundData) break;
    }
    
    if (!foundData) {
        console.log('\n❌ Could not find the required columns in any sheet/row.');
        console.log('Looking for columns containing:');
        console.log('  - "Allocated Depot"');
        console.log('  - "FleetNo"');
        console.log('  - "RegNumber"');
        process.exit(1);
    }
    
    // Save the real depot assignments
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(realDepotAssignments, null, 2));
    console.log(`\n✅ SUCCESS! Real depot assignments saved to: ${OUTPUT_FILE}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
