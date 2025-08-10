#!/usr/bin/env node

/**
 * Generate complete GNE Fleet Database from Excel
 * This will include ALL vehicles including fleet 5804
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Generating complete GNE Fleet Database from Excel...');

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

// Process the data to create fleet array
const fleetArray = [];
let processedCount = 0;
let found5804 = false;

// Skip header row, start from row 1
for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    // Check if row has data and fleet number
    if (row && row.length > 3 && row[3]) {
        const fleetNumber = String(row[3]).trim();
        
        // Only process if we have a valid fleet number
        if (fleetNumber && !isNaN(fleetNumber)) {
            const registration = row[4] ? String(row[4]).trim() : '';
            const depot = row[1] ? String(row[1]).trim() : row[0] ? String(row[0]).trim() : '';
            const busType = row[5] ? String(row[5]).trim() : '';
            const vehicleCategory = row[6] ? String(row[6]).trim() : '';
            
            // Extract manufacturer from busType
            let manufacturer = 'Unknown';
            const busTypeLower = busType.toLowerCase();
            if (busTypeLower.includes('volvo')) manufacturer = 'Volvo';
            else if (busTypeLower.includes('wright')) manufacturer = 'Wrightbus';
            else if (busTypeLower.includes('adl') || busTypeLower.includes('alexander')) manufacturer = 'Alexander Dennis';
            else if (busTypeLower.includes('optare')) manufacturer = 'Optare';
            else if (busTypeLower.includes('yutong')) manufacturer = 'Yutong';
            else if (busTypeLower.includes('mercedes') || busTypeLower.includes('benz')) manufacturer = 'Mercedes-Benz';
            else if (busTypeLower.includes('scania')) manufacturer = 'Scania';
            else if (busTypeLower.includes('byd')) manufacturer = 'BYD';
            
            // Extract year from registration
            let yearOfManufacture = null;
            if (registration) {
                const match = registration.match(/^[A-Z]{2}(\d{2})/);
                if (match) {
                    const yearCode = parseInt(match[1]);
                    // UK registration year codes
                    if (yearCode >= 51 && yearCode <= 99) {
                        yearOfManufacture = 2000 + yearCode;
                    } else if (yearCode >= 1 && yearCode <= 50) {
                        yearOfManufacture = 2000 + yearCode;
                    } else if (yearCode >= 70 && yearCode <= 74) {
                        // Special handling for 2020+ registrations
                        yearOfManufacture = 2020 + (yearCode - 70);
                    }
                }
                // Handle newer style registrations (20, 21, 22, 23, 24, etc.)
                const newStyleMatch = registration.match(/^[A-Z]{2}(20|21|22|23|24|25)/);
                if (newStyleMatch) {
                    yearOfManufacture = 2000 + parseInt(newStyleMatch[1]);
                }
                // Handle 70+ plate registrations (Sept 2020 onwards)
                const septMatch = registration.match(/^[A-Z]{2}(7[0-4])/);
                if (septMatch) {
                    const code = parseInt(septMatch[1]);
                    yearOfManufacture = 2020 + (code - 70);
                }
            }
            
            // Estimate capacity based on vehicle type
            let capacity = 50; // Default
            if (vehicleCategory.toLowerCase().includes('double')) {
                capacity = 80;
            } else if (vehicleCategory.toLowerCase().includes('minibus') || 
                       busType.toLowerCase().includes('solo')) {
                capacity = 30;
            } else if (vehicleCategory.toLowerCase().includes('single')) {
                capacity = 50;
            }
            
            // Create the vehicle object in the format expected by the app
            const vehicleData = {
                fleetNumber: fleetNumber,
                regNo: registration,
                depot: depot,
                vehicleType: busType,
                manufacturer: manufacturer,
                capacity: capacity,
                yearOfManufacture: yearOfManufacture
            };
            
            fleetArray.push(vehicleData);
            processedCount++;
            
            // Check for 5804
            if (fleetNumber === '5804') {
                found5804 = true;
                console.log('✅ Fleet 5804 found!');
                console.log('   Registration:', registration);
                console.log('   Depot:', depot);
                console.log('   Type:', busType);
            }
        }
    }
}

console.log(`\n📊 Processed ${processedCount} vehicles`);

// Sort fleet array by fleet number
fleetArray.sort((a, b) => parseInt(a.fleetNumber) - parseInt(b.fleetNumber));

// Create the final database object
const database = {
    metadata: {
        createdAt: new Date().toISOString(),
        source: "Complete GNE Fleet Database from Excel",
        totalVehicles: fleetArray.length,
        conversionVersion: "3.0",
        description: "Complete Go North East Fleet Database with ALL vehicles including 5804"
    },
    fleet: fleetArray
};

// Check for 5800 series
console.log('\n🚌 5800 Series Vehicles in Database:');
fleetArray.forEach(vehicle => {
    const num = parseInt(vehicle.fleetNumber);
    if (num >= 5800 && num <= 5810) {
        console.log(`   Fleet ${vehicle.fleetNumber}: ${vehicle.regNo} (${vehicle.depot})`);
    }
});

// Write the database to the public folder
const outputPath = path.join(__dirname, 'Go_BARRY', 'public', 'gne-fleet-database.json');

// Backup existing
try {
    const existing = fs.readFileSync(outputPath, 'utf-8');
    const backupPath = outputPath.replace('.json', `-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, existing);
    console.log(`\n💾 Backup created`);
} catch (e) {
    console.log('\n⚠️  No existing database to backup');
}

// Write new database
fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));

console.log(`\n✅ GNE Fleet Database generated successfully!`);
console.log(`   Path: ${outputPath}`);
console.log(`   Total vehicles: ${fleetArray.length}`);

if (found5804) {
    console.log('\n🎉 SUCCESS: Fleet 5804 is included in the database!');
} else {
    console.log('\n❌ WARNING: Fleet 5804 was not found in the Excel data');
}

// Also update the backend fleet-database.json for consistency
const backendPath = path.join(__dirname, 'Go_BARRY', 'public', 'backend', 'data', 'fleet-database.json');
const backendDatabase = {};

// Convert to backend format
fleetArray.forEach(vehicle => {
    backendDatabase[vehicle.fleetNumber] = {
        fleetNumber: vehicle.fleetNumber,
        registration: vehicle.regNo,
        depot: vehicle.depot,
        busType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        yearOfManufacture: vehicle.yearOfManufacture
    };
});

fs.writeFileSync(backendPath, JSON.stringify(backendDatabase, null, 2));
console.log('\n✅ Backend fleet-database.json also updated');
