// Script to convert Excel fleet data to JSON
// This helps convert the Fleet Master spreadsheet to fleet-database.json

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXCEL_FILE = process.argv[2]; // Pass Excel file path as argument
const OUTPUT_FILE = path.join(__dirname, '../backend/data/fleet-database.json');

// Depot detection based on fleet number ranges (from existing detectDepot function)
function detectDepot(fleetNumber) {
    const num = parseInt(fleetNumber);
    
    // GNE depot ranges
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
    if (num >= 6176 && num <= 6307) return 'Unknown';
    if (num >= 6308 && num <= 6332) return 'Consett';
    if (num >= 6333 && num <= 6337) return 'Washington';
    if (num >= 6338 && num <= 6355) return 'Percy Main';
    if (num >= 6356 && num <= 6376) return 'Riverside';
    if (num >= 6377 && num <= 6916) return 'Unknown';
    if (num >= 6917 && num <= 6923) return 'Percy Main';
    if (num >= 6924 && num <= 6931) return 'Riverside';
    if (num >= 6932 && num <= 6949) return 'Percy Main';
    if (num >= 6950 && num <= 6964) return 'Washington';
    if (num >= 6965 && num <= 6970) return 'Percy Main';
    if (num >= 6971 && num <= 6999) return 'Riverside';
    if (num >= 8306 && num <= 8309) return 'Chester-le-Street';
    if (num >= 8310 && num <= 8319) return 'Stanley';
    if (num >= 8320 && num <= 8324) return 'Chester-le-Street';
    if (num >= 8325 && num <= 8327) return 'Stanley';
    if (num >= 8328 && num <= 8338) return 'Chester-le-Street';
    if (num >= 8339 && num <= 8346) return 'Stanley';
    
    return 'Unknown';
}

async function convertExcelToJSON() {
    try {
        if (!EXCEL_FILE) {
            console.error('❌ Please provide Excel file path as argument');
            console.log('Usage: node convert-fleet-excel.mjs /path/to/fleet-master.xlsx');
            process.exit(1);
        }

        console.log('📊 Reading Excel file:', EXCEL_FILE);
        
        // Read the Excel file
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`✅ Found ${data.length} fleet records`);
        
        // Transform to our desired format
        const fleetDatabase = {};
        
        data.forEach(row => {
            // Adjust these field names based on your Excel columns
            const fleetNumber = row['Fleet Number'] || row['Fleet No'] || row['fleet_no'];
            const registration = row['Registration'] || row['Reg'] || row['vehicle_reg'];
            const busType = row['Bus Type'] || row['Type'] || row['Vehicle Type'] || 'Unknown';
            const capacity = row['Capacity'] || row['Seats'] || 44;
            const year = row['Year'] || row['YOM'] || new Date().getFullYear();
            
            if (fleetNumber) {
                const fleetStr = fleetNumber.toString();
                fleetDatabase[fleetStr] = {
                    fleetNumber: fleetStr,
                    registration: registration || 'Unknown',
                    busType: busType,
                    depot: detectDepot(fleetStr),
                    capacity: parseInt(capacity) || 44,
                    yearOfManufacture: parseInt(year) || new Date().getFullYear()
                };
            }
        });
        
        // Write to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fleetDatabase, null, 2));
        
        console.log('✅ Fleet database created successfully!');
        console.log(`📁 Output: ${OUTPUT_FILE}`);
        console.log(`📊 Total vehicles: ${Object.keys(fleetDatabase).length}`);
        
        // Show depot distribution
        const depotCounts = {};
        Object.values(fleetDatabase).forEach(vehicle => {
            depotCounts[vehicle.depot] = (depotCounts[vehicle.depot] || 0) + 1;
        });
        console.log('\n📍 Depot Distribution:');
        Object.entries(depotCounts).forEach(([depot, count]) => {
            console.log(`   ${depot}: ${count} vehicles`);
        });
        
    } catch (error) {
        console.error('❌ Error converting Excel to JSON:', error);
        process.exit(1);
    }
}

// Run the conversion
convertExcelToJSON();
