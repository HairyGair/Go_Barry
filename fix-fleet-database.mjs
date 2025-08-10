import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting fleet database update...');

// Read the Excel file
const excelPath = path.join(__dirname, 'GNE_Fleet_Master.xlsx');
const excelData = fs.readFileSync(excelPath);

const workbook = XLSX.read(excelData, {
    cellStyles: true,
    cellFormulas: true,
    cellDates: true,
    cellNF: true,
    sheetStubs: true
});

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: ''
});

console.log(`📊 Processing ${jsonData.length} rows from Excel...`);

// Process the data to create fleet database
const fleetDatabase = {};
let processedCount = 0;

// Skip header row, start from row 1
for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    // Check if row has data and fleet number
    if (row && row.length > 3 && row[3]) {
        const fleetNumber = String(row[3]).trim();
        
        // Only process if we have a valid fleet number
        if (fleetNumber && !isNaN(fleetNumber)) {
            // Extract year from registration if possible
            const registration = row[4] ? String(row[4]).trim() : '';
            let yearOfManufacture = null;
            
            // UK registration format parsing
            if (registration) {
                // New style: XX## XXX (e.g., NL72 ETV)
                const match = registration.match(/^[A-Z]{2}(\d{2})/);
                if (match) {
                    const yearCode = parseInt(match[1]);
                    if (yearCode >= 51 && yearCode <= 99) {
                        yearOfManufacture = 2000 + yearCode;
                    } else if (yearCode >= 1 && yearCode <= 50) {
                        yearOfManufacture = 2000 + yearCode;
                    } else if (yearCode === 70 || yearCode === 71 || yearCode === 72 || yearCode === 73 || yearCode === 74) {
                        yearOfManufacture = 2020 + (yearCode - 70);
                    }
                }
            }
            
            // Estimate capacity based on vehicle type
            let capacity = 50; // Default
            const busType = row[5] ? String(row[5]).trim() : '';
            const vehicleCategory = row[6] ? String(row[6]).trim() : '';
            
            if (vehicleCategory.toLowerCase().includes('double')) {
                capacity = 80;
            } else if (vehicleCategory.toLowerCase().includes('minibus') || 
                       busType.toLowerCase().includes('solo')) {
                capacity = 30;
            } else if (vehicleCategory.toLowerCase().includes('single')) {
                capacity = 50;
            }
            
            fleetDatabase[fleetNumber] = {
                fleetNumber: fleetNumber,
                registration: registration,
                depot: row[1] ? String(row[1]).trim() : row[0] ? String(row[0]).trim() : '',
                busType: busType,
                capacity: capacity,
                yearOfManufacture: yearOfManufacture
            };
            
            processedCount++;
            
            // Check for 5804
            if (fleetNumber === '5804') {
                console.log('✅ Fleet 5804 found!');
                console.log('   Details:', JSON.stringify(fleetDatabase[fleetNumber], null, 2));
            }
        }
    }
}

console.log(`\n📊 Processed ${processedCount} vehicles`);

// Check for 5800 series
console.log('\n🚌 5800 Series Vehicles:');
for (let i = 5800; i <= 5810; i++) {
    if (fleetDatabase[String(i)]) {
        console.log(`   Fleet ${i}: ${fleetDatabase[String(i)].registration}`);
    }
}

// Write the database
const databasePath = path.join(__dirname, 'Go_BARRY', 'public', 'backend', 'data', 'fleet-database.json');

// Backup existing
try {
    const existing = fs.readFileSync(databasePath, 'utf-8');
    const backupPath = databasePath.replace('.json', `-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, existing);
    console.log(`\n💾 Backup created`);
} catch (e) {
    console.log('\n⚠️  No existing database to backup');
}

// Write new database
fs.writeFileSync(databasePath, JSON.stringify(fleetDatabase, null, 2));
console.log(`\n✅ Fleet database updated!`);
console.log(`   Total vehicles: ${Object.keys(fleetDatabase).length}`);

if (fleetDatabase['5804']) {
    console.log('\n🎉 SUCCESS: Fleet 5804 is now in the database!');
}
