#!/usr/bin/env node

/**
 * Fleet Database Update Script
 * Processes Excel spreadsheet and updates the fleet database JSON
 * 
 * Usage: 
 * 1. Place GNE_Fleet_Master.xlsx in the same directory as this script
 * 2. Run: node updateFleetDatabase.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE = 'GNE_Fleet_Master.xlsx';
const OUTPUT_FILE = path.join(__dirname, '../../backend/data/fleet-database.json');

// Depot mappings (normalize depot names)
const DEPOT_MAPPINGS = {
    'PM': 'Percy Main',
    'Percy Main': 'Percy Main',
    'CON': 'Consett',
    'Consett': 'Consett',
    'DEP': 'Deptford',
    'Deptford': 'Deptford',
    'WASH': 'Washington',
    'Washington': 'Washington',
    'RIV': 'Gateshead Riverside',
    'Riverside': 'Gateshead Riverside',
    'Gateshead Riverside': 'Gateshead Riverside',
    'HEX': 'Hexham',
    'Hexham': 'Hexham',
    'CLS': 'Chester-le-Street',
    'Chester-le-Street': 'Chester-le-Street',
    'STAN': 'Stanley',
    'Stanley': 'Stanley',
    'Reserve': 'Go North East Reserve Fleet',
    'Coach': 'Go North East Coach',
    'Stores': 'Saltmeadows Road Stores'
};

// Default capacities by bus type patterns
const CAPACITY_DEFAULTS = {
    'Solo': 30,
    'Versa': 40,
    'StreetLite': 40,
    'Enviro200': 40,
    'Citaro': 35,
    'Enviro400': 85,
    'B7TL': 85,
    'B9TL': 85,
    'Sprinter': 16,
    'Coach': 53,
    'E10': 40,
    'Yutong': 40
};

function getCapacityFromType(busType) {
    for (const [pattern, capacity] of Object.entries(CAPACITY_DEFAULTS)) {
        if (busType.includes(pattern)) {
            return capacity;
        }
    }
    return 40; // Default capacity
}

function normalizeDepot(depot) {
    if (!depot) return 'Unknown';
    
    const depotStr = depot.toString().trim();
    
    // Check mappings
    for (const [key, value] of Object.entries(DEPOT_MAPPINGS)) {
        if (depotStr.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return depotStr;
}

function processExcelFile() {
    try {
        console.log('📊 Reading Excel file...');
        
        // Check if file exists
        if (!fs.existsSync(EXCEL_FILE)) {
            console.error(`❌ Excel file not found: ${EXCEL_FILE}`);
            console.log('Please place GNE_Fleet_Master.xlsx in the scripts directory');
            return;
        }
        
        // Read the Excel file
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find header row (looking for common column names)
        let headerRow = -1;
        const expectedHeaders = ['fleet', 'registration', 'depot', 'type', 'make', 'model'];
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                const rowStr = row.join(',').toLowerCase();
                if (expectedHeaders.some(header => rowStr.includes(header))) {
                    headerRow = i;
                    break;
                }
            }
        }
        
        if (headerRow === -1) {
            console.error('❌ Could not find header row in Excel file');
            return;
        }
        
        console.log(`✅ Found header row at index ${headerRow}`);
        
        // Get column indices
        const headers = data[headerRow].map(h => h ? h.toString().toLowerCase() : '');
        const columns = {
            fleet: headers.findIndex(h => h.includes('fleet')),
            registration: headers.findIndex(h => h.includes('reg')),
            depot: headers.findIndex(h => h.includes('depot')),
            busType: headers.findIndex(h => h.includes('type') || h.includes('model')),
            year: headers.findIndex(h => h.includes('year') || h.includes('age')),
            capacity: headers.findIndex(h => h.includes('capacity') || h.includes('seats'))
        };
        
        console.log('📋 Column mappings:', columns);
        
        // Load existing database
        let fleetDatabase = {};
        if (fs.existsSync(OUTPUT_FILE)) {
            fleetDatabase = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            console.log(`📂 Loaded existing database with ${Object.keys(fleetDatabase).length} vehicles`);
        }
        
        // Process each row
        let processed = 0;
        let skipped = 0;
        
        for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i];
            
            if (!row || row.length === 0) continue;
            
            const fleetNumber = row[columns.fleet]?.toString().trim();
            const registration = row[columns.registration]?.toString().trim();
            
            if (!fleetNumber || !registration) {
                skipped++;
                continue;
            }
            
            // Extract year from registration or year column
            let year = null;
            if (columns.year !== -1 && row[columns.year]) {
                year = parseInt(row[columns.year]);
            } else {
                // Try to extract from registration (e.g., NK69FAF = 2019)
                const regMatch = registration.match(/[A-Z]{2}(\d{2})[A-Z]{3}/);
                if (regMatch) {
                    const yearPart = parseInt(regMatch[1]);
                    if (yearPart >= 51 && yearPart <= 99) {
                        year = 1900 + yearPart;
                    } else if (yearPart >= 0 && yearPart <= 50) {
                        year = 2000 + yearPart;
                    }
                }
            }
            
            // Get bus type
            let busType = 'Unknown';
            if (columns.busType !== -1 && row[columns.busType]) {
                busType = row[columns.busType].toString().trim();
            }
            
            // Get capacity
            let capacity = getCapacityFromType(busType);
            if (columns.capacity !== -1 && row[columns.capacity]) {
                const cap = parseInt(row[columns.capacity]);
                if (!isNaN(cap) && cap > 0) {
                    capacity = cap;
                }
            }
            
            // Create vehicle entry
            fleetDatabase[fleetNumber] = {
                fleetNumber: fleetNumber,
                registration: registration.toUpperCase(),
                depot: normalizeDepot(row[columns.depot]),
                busType: busType,
                capacity: capacity,
                yearOfManufacture: year || new Date().getFullYear()
            };
            
            processed++;
        }
        
        // Save the updated database
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fleetDatabase, null, 2));
        
        console.log(`\n✅ Fleet database updated successfully!`);
        console.log(`📊 Statistics:`);
        console.log(`   - Total vehicles: ${Object.keys(fleetDatabase).length}`);
        console.log(`   - Newly processed: ${processed}`);
        console.log(`   - Skipped rows: ${skipped}`);
        
        // Show depot distribution
        const depotCounts = {};
        Object.values(fleetDatabase).forEach(vehicle => {
            depotCounts[vehicle.depot] = (depotCounts[vehicle.depot] || 0) + 1;
        });
        
        console.log(`\n🏢 Depot Distribution:`);
        Object.entries(depotCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([depot, count]) => {
                console.log(`   - ${depot}: ${count} vehicles`);
            });
            
    } catch (error) {
        console.error('❌ Error processing Excel file:', error);
    }
}

// Check if xlsx module is installed
try {
    require('xlsx');
    processExcelFile();
} catch (error) {
    console.log('📦 Installing required dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install xlsx', { stdio: 'inherit' });
    console.log('✅ Dependencies installed. Running script...\n');
    processExcelFile();
}
