#!/usr/bin/env node

// Fleet Data Import Script
// Import vehicle data from CSV into the breakdown analytics database

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV mapping configuration
const CSV_FIELD_MAPPING = {
  // CSV Header -> Database Field
  'Fleet Number': 'fleet_number',
  'Fleet_Number': 'fleet_number',
  'fleet_number': 'fleet_number',
  'FleetNo': 'fleet_number',
  'Vehicle': 'fleet_number',
  
  'Registration': 'registration',
  'Reg': 'registration',
  'RegNo': 'registration',
  'registration': 'registration',
  
  'Type': 'vehicle_type',
  'Vehicle Type': 'vehicle_type',
  'vehicle_type': 'vehicle_type',
  'VehicleType': 'vehicle_type',
  
  'Manufacturer': 'manufacturer',
  'Make': 'manufacturer',
  'manufacturer': 'manufacturer',
  
  'Model': 'model',
  'model': 'model',
  
  'Depot': 'depot',
  'depot': 'depot',
  'Location': 'depot',
  'Base': 'depot',
  
  'Year': 'year_of_manufacture',
  'YOM': 'year_of_manufacture',
  'year_of_manufacture': 'year_of_manufacture',
  'Year of Manufacture': 'year_of_manufacture',
  
  'Status': 'in_service',
  'Active': 'in_service',
  'In Service': 'in_service',
  'in_service': 'in_service'
};

// Depot name standardization
const DEPOT_MAPPING = {
  'washington': 'Washington',
  'wash': 'Washington',
  'w': 'Washington',
  'consett': 'Consett',
  'cons': 'Consett',
  'c': 'Consett',
  'hexham': 'Hexham',
  'hex': 'Hexham',
  'h': 'Hexham',
  'riverside': 'Riverside',
  'river': 'Riverside',
  'r': 'Riverside',
  'percy main': 'Percy Main',
  'percy': 'Percy Main',
  'pm': 'Percy Main',
  'gateshead': 'Gateshead',
  'gate': 'Gateshead',
  'g': 'Gateshead'
};

// Vehicle type standardization
const VEHICLE_TYPE_MAPPING = {
  'dd': 'Double Decker',
  'double': 'Double Decker',
  'decker': 'Double Decker',
  'sd': 'Single Decker',
  'single': 'Single Decker',
  'mb': 'Minibus',
  'mini': 'Minibus',
  'coach': 'Coach',
  'artic': 'Articulated',
  'articulated': 'Articulated'
};

function standardizeDepot(depot) {
  if (!depot) return 'Unknown';
  const key = depot.toLowerCase().trim();
  return DEPOT_MAPPING[key] || depot;
}

function standardizeVehicleType(type) {
  if (!type) return 'Unknown';
  const key = type.toLowerCase().trim();
  return VEHICLE_TYPE_MAPPING[key] || type;
}

function parseInService(value) {
  if (value === undefined || value === null || value === '') return true;
  const str = value.toString().toLowerCase().trim();
  return str !== 'false' && str !== 'no' && str !== '0' && str !== 'inactive' && str !== 'disposal';
}

async function importFleetData(csvFilePath) {
  console.log('\n📁 Reading CSV file:', csvFilePath);
  
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim()
    });
    
    if (parseResult.errors.length > 0) {
      console.error('❌ CSV parsing errors:', parseResult.errors);
    }
    
    console.log(`📊 Found ${parseResult.data.length} rows in CSV`);
    
    // Process each row
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const [index, row] of parseResult.data.entries()) {
      try {
        // Map CSV fields to database fields
        const vehicleData = {};
        
        // Map fields using our mapping configuration
        for (const [csvField, dbField] of Object.entries(CSV_FIELD_MAPPING)) {
          if (row[csvField] !== undefined && row[csvField] !== null && row[csvField] !== '') {
            vehicleData[dbField] = row[csvField];
          }
        }
        
        // Validate required fields
        if (!vehicleData.fleet_number) {
          throw new Error(`Row ${index + 2}: Missing fleet number`);
        }
        
        // Standardize fields
        if (vehicleData.depot) {
          vehicleData.depot = standardizeDepot(vehicleData.depot);
        } else {
          vehicleData.depot = 'Unknown';
        }
        
        if (vehicleData.vehicle_type) {
          vehicleData.vehicle_type = standardizeVehicleType(vehicleData.vehicle_type);
        }
        
        // Handle in_service field
        if ('in_service' in vehicleData) {
          vehicleData.in_service = parseInService(vehicleData.in_service);
        } else {
          vehicleData.in_service = true; // Default to active
        }
        
        // Clean up fleet number
        vehicleData.fleet_number = vehicleData.fleet_number.toString().trim();
        
        // Clean up registration
        if (vehicleData.registration) {
          vehicleData.registration = vehicleData.registration.toString().trim().toUpperCase();
        }
        
        // Ensure year is a number
        if (vehicleData.year_of_manufacture) {
          vehicleData.year_of_manufacture = parseInt(vehicleData.year_of_manufacture);
          if (isNaN(vehicleData.year_of_manufacture)) {
            delete vehicleData.year_of_manufacture;
          }
        }
        
        console.log(`\n🚌 Processing vehicle ${vehicleData.fleet_number}...`);
        
        // Upsert to database
        const { error } = await supabase
          .from('fleet_vehicles')
          .upsert(vehicleData, { 
            onConflict: 'fleet_number',
            ignoreDuplicates: false 
          });
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ ${vehicleData.fleet_number} - ${vehicleData.depot}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Row ${index + 2} error:`, error.message);
        errors.push({ row: index + 2, error: error.message, data: row });
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} vehicles`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach(({ row, error }) => {
        console.log(`   Row ${row}: ${error}`);
      });
    }
    
    // Verify import
    const { data: totalVehicles, error: countError } = await supabase
      .from('fleet_vehicles')
      .select('count');
    
    if (!countError && totalVehicles) {
      console.log(`\n📈 Total vehicles in database: ${totalVehicles[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Example CSV generator
function generateExampleCSV() {
  const examplePath = path.join(__dirname, 'example-fleet-data.csv');
  
  const exampleData = `Fleet Number,Registration,Vehicle Type,Manufacturer,Model,Depot,Year,Status
6301,NK72 FHE,Double Decker,Wright,StreetDeck,Washington,2022,Active
6302,NK72 FHF,Double Decker,Wright,StreetDeck,Washington,2022,Active
5481,YX68 UWR,Double Decker,ADL,Enviro400,Consett,2018,Active
5482,YX68 UWS,Double Decker,ADL,Enviro400,Consett,2018,Active
701,NK14 TGU,Single Decker,Optare,Solo,Hexham,2014,Active
702,NK14 TGV,Single Decker,Optare,Solo,Hexham,2014,Active
4812,NK09 FLP,Single Decker,Wright,Eclipse,Riverside,2009,Active
4813,NK09 FLR,Single Decker,Wright,Eclipse,Riverside,2009,Active
3901,NK57 DWA,Double Decker,Volvo,B9TL,Gateshead,2007,Inactive
3902,NK57 DWB,Double Decker,Volvo,B9TL,Percy Main,2007,Active`;
  
  fs.writeFileSync(examplePath, exampleData);
  console.log(`📄 Example CSV created at: ${examplePath}`);
  
  return examplePath;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📋 Fleet Data Import Tool');
  console.log('\nUsage:');
  console.log('  node import-fleet-data.js <csv-file-path>');
  console.log('  node import-fleet-data.js --example');
  console.log('\nCSV should have columns like:');
  console.log('  Fleet Number, Registration, Vehicle Type, Manufacturer, Model, Depot, Year');
  process.exit(0);
}

if (args[0] === '--example') {
  console.log('📝 Generating and importing example data...');
  const examplePath = generateExampleCSV();
  importFleetData(examplePath).then(() => {
    console.log('\n✨ Example import complete!');
    process.exit(0);
  });
} else {
  const csvPath = args[0];
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  importFleetData(csvPath).then(() => {
    console.log('\n✨ Import complete!');
    process.exit(0);
  });
}