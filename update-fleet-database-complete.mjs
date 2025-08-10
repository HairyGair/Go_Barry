#!/usr/bin/env node

/**
 * Script to update the fleet database with complete data from Excel
 * This will ensure fleet 5804 and all other vehicles are included
 */

import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateFleetDatabase() {
    try {
        console.log('📊 Reading Excel file...');
        const excelPath = path.join(__dirname, 'GNE_Fleet_Master.xlsx');
        const excelData = await fs.readFile(excelPath);
        
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
        
        console.log(`📋 Processing ${jsonData.length} rows from Excel...`);
        
        // Process the data to create fleet database
        const fleetDatabase = {};
        let processedCount = 0;
        let skippedCount = 0;
        
        // Skip header row, start from row 1
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Check if row has data and fleet number
            if (row && row.length > 3 && row[3]) {
                const fleetNumber = String(row[3]).trim();
                
                // Only process if we have a valid fleet number
                if (fleetNumber && !isNaN(fleetNumber)) {
                    // Extract year from registration if possible (UK format)
                    const registration = row[4] ? String(row[4]).trim() : '';
                    let yearOfManufacture = null;
                    
                    // UK registration format parsing (simplified)
                    if (registration) {
                        const match = registration.match(/^[A-Z]{2}(\d{2})/);
                        if (match) {
                            const yearCode = parseInt(match[1]);
                            if (yearCode >= 51 && yearCode <= 99) {
                                yearOfManufacture = 2000 + yearCode;
                            } else if (yearCode >= 0 && yearCode <= 50) {
                                yearOfManufacture = 2000 + yearCode;
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
                        depotCode: row[2] ? String(row[2]).trim() : '',
                        busType: busType,
                        vehicleCategory: vehicleCategory,
                        licenseType: row[7] ? String(row[7]).trim() : '',
                        shortType: row[9] ? String(row[9]).trim() : '',
                        typeCode: row[10] ? String(row[10]).trim() : '',
                        capacity: capacity,
                        yearOfManufacture: yearOfManufacture
                    };
                    
                    processedCount++;
                    
                    // Check if 5804 is included
                    if (fleetNumber === '5804') {
                        console.log('✅ Fleet 5804 found and included!');
                        console.log('   Registration:', registration);
                        console.log('   Depot:', fleetDatabase[fleetNumber].depot);
                        console.log('   Type:', busType);
                    }
                } else {
                    skippedCount++;
                }
            } else {
                skippedCount++;
            }
        }
        
        console.log(`\n📊 Statistics:`);
        console.log(`   - Processed: ${processedCount} vehicles`);
        console.log(`   - Skipped: ${skippedCount} rows (empty or invalid)`);
        
        // Check for 5800 series vehicles
        console.log('\n🚌 5800 Series Vehicles Found:');
        for (let i = 5800; i <= 5810; i++) {
            if (fleetDatabase[String(i)]) {
                const vehicle = fleetDatabase[String(i)];
                console.log(`   - Fleet ${i}: ${vehicle.registration} (${vehicle.depot})`);
            }
        }
        
        // Save the database
        const databasePath = path.join(__dirname, 'Go_BARRY', 'public', 'backend', 'data', 'fleet-database.json');
        
        // Create backup of existing database
        try {
            const existingData = await fs.readFile(databasePath, 'utf-8');
            const backupPath = databasePath.replace('.json', `-backup-${Date.now()}.json`);
            await fs.writeFile(backupPath, existingData);
            console.log(`\n💾 Backup created: ${path.basename(backupPath)}`);
        } catch (error) {
            console.log('\n⚠️  No existing database to backup');
        }
        
        // Write the new database
        await fs.writeFile(databasePath, JSON.stringify(fleetDatabase, null, 2));
        console.log(`✅ Fleet database updated successfully!`);
        console.log(`   Path: ${databasePath}`);
        console.log(`   Total vehicles: ${Object.keys(fleetDatabase).length}`);
        
        // Verify 5804 is in the final database
        if (fleetDatabase['5804']) {
            console.log('\n🎉 SUCCESS: Fleet 5804 is now in the database!');
        } else {
            console.log('\n❌ WARNING: Fleet 5804 was not found in the Excel data');
        }
        
    } catch (error) {
        console.error('❌ Error updating fleet database:', error);
        process.exit(1);
    }
}

// Run the update
updateFleetDatabase();
