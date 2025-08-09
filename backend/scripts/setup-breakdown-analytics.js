#!/usr/bin/env node

// Setup script for Breakdown Analytics Database
// Run this to create all necessary tables in Supabase

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function runSetup() {
  console.log('🚀 Starting Breakdown Analytics Database Setup...\n');
  
  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/breakdown_analytics_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Reading schema from:', schemaPath);
    
    // Execute the schema
    // Note: Supabase doesn't have a direct SQL execution method, 
    // so we'll need to use the Supabase dashboard or CLI for the full schema
    console.log('\n⚠️  IMPORTANT: The full schema needs to be executed via:');
    console.log('   1. Supabase Dashboard SQL Editor, or');
    console.log('   2. Supabase CLI: supabase db push\n');
    
    // We can check if tables exist
    console.log('🔍 Checking existing tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('fleet_vehicles')
      .select('count')
      .limit(1);
    
    if (tablesError?.code === '42P01') {
      console.log('❌ Tables not found. Please run the schema SQL first.');
      console.log('\n📋 Copy the contents of breakdown_analytics_schema.sql and run it in:');
      console.log('   https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1] + '/sql/new\n');
    } else if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
    } else {
      console.log('✅ fleet_vehicles table exists');
      
      // Check other tables
      const tablesToCheck = ['breakdown_events', 'breakdown_categories', 'pattern_alerts', 'go_barry_sessions'];
      
      for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error?.code === '42P01') {
          console.log(`❌ ${table} table not found`);
        } else if (error) {
          console.log(`⚠️  ${table} check error:`, error.message);
        } else {
          console.log(`✅ ${table} table exists`);
        }
      }
    }
    
    // Add sample vehicles if needed
    console.log('\n🚌 Checking for sample vehicles...');
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .limit(5);
    
    if (!vehiclesError && vehicles?.length === 0) {
      console.log('📝 No vehicles found. Would you like to add sample data?');
      console.log('   Run: npm run setup-breakdown-analytics -- --sample-data\n');
    } else if (vehicles?.length > 0) {
      console.log(`✅ Found ${vehicles.length} vehicles in the database`);
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

async function addSampleData() {
  console.log('\n📝 Adding sample fleet data...');
  
  const sampleVehicles = [
    { fleet_number: '6301', registration: 'NK72 FHE', vehicle_type: 'Double Decker', manufacturer: 'Wright', model: 'StreetDeck', depot: 'Washington', year_of_manufacture: 2022 },
    { fleet_number: '6302', registration: 'NK72 FHF', vehicle_type: 'Double Decker', manufacturer: 'Wright', model: 'StreetDeck', depot: 'Washington', year_of_manufacture: 2022 },
    { fleet_number: '5481', registration: 'YX68 UWR', vehicle_type: 'Double Decker', manufacturer: 'ADL', model: 'Enviro400', depot: 'Consett', year_of_manufacture: 2018 },
    { fleet_number: '5482', registration: 'YX68 UWS', vehicle_type: 'Double Decker', manufacturer: 'ADL', model: 'Enviro400', depot: 'Consett', year_of_manufacture: 2018 },
    { fleet_number: '701', registration: 'NK14 TGU', vehicle_type: 'Single Decker', manufacturer: 'Optare', model: 'Solo', depot: 'Hexham', year_of_manufacture: 2014 },
    { fleet_number: '702', registration: 'NK14 TGV', vehicle_type: 'Single Decker', manufacturer: 'Optare', model: 'Solo', depot: 'Hexham', year_of_manufacture: 2014 },
    { fleet_number: '4812', registration: 'NK09 FLP', vehicle_type: 'Single Decker', manufacturer: 'Wright', model: 'Eclipse', depot: 'Riverside', year_of_manufacture: 2009 },
    { fleet_number: '4813', registration: 'NK09 FLR', vehicle_type: 'Single Decker', manufacturer: 'Wright', model: 'Eclipse', depot: 'Riverside', year_of_manufacture: 2009 }
  ];
  
  for (const vehicle of sampleVehicles) {
    const { error } = await supabase
      .from('fleet_vehicles')
      .upsert(vehicle, { onConflict: 'fleet_number' });
    
    if (error) {
      console.log(`❌ Error adding ${vehicle.fleet_number}:`, error.message);
    } else {
      console.log(`✅ Added vehicle ${vehicle.fleet_number}`);
    }
  }
  
  console.log('\n📝 Adding sample breakdown events...');
  
  // Add some sample breakdowns for pattern detection
  const sampleBreakdowns = [
    // Cooling system pattern at Consett
    { fleet_number: '5481', depot: 'Consett', breakdown_category: 'Cooling System', specific_issue: 'Coolant leak', severity: 'STOP', vehicle_off_road: true },
    { fleet_number: '5482', depot: 'Consett', breakdown_category: 'Cooling System', specific_issue: 'Overheating', severity: 'AMBER', changeover_required: true },
    { fleet_number: '5481', depot: 'Consett', breakdown_category: 'Cooling System', specific_issue: 'Coolant leak', severity: 'STOP', vehicle_off_road: true },
    
    // Repeat offender vehicle
    { fleet_number: '6301', depot: 'Washington', breakdown_category: 'Electrical', specific_issue: 'Battery failure', severity: 'AMBER' },
    { fleet_number: '6301', depot: 'Washington', breakdown_category: 'Doors', specific_issue: 'Door not closing', severity: 'CONTINUE' },
    { fleet_number: '6301', depot: 'Washington', breakdown_category: 'Electrical', specific_issue: 'Alternator', severity: 'STOP', vehicle_off_road: true },
    { fleet_number: '6301', depot: 'Washington', breakdown_category: 'Cooling System', specific_issue: 'Low water', severity: 'AMBER' },
    
    // Normal operations
    { fleet_number: '701', depot: 'Hexham', breakdown_category: 'Brakes', specific_issue: 'Brake light', severity: 'CONTINUE' },
    { fleet_number: '4812', depot: 'Riverside', breakdown_category: 'Wipers', specific_issue: 'Wiper blade', severity: 'CONTINUE' }
  ];
  
  for (const breakdown of sampleBreakdowns) {
    breakdown.reported_by = 'Sample Data';
    breakdown.source = 'SETUP_SCRIPT';
    
    const { error } = await supabase
      .from('breakdown_events')
      .insert(breakdown);
    
    if (error) {
      console.log(`❌ Error adding breakdown:`, error.message);
    } else {
      console.log(`✅ Added breakdown for ${breakdown.fleet_number} - ${breakdown.breakdown_category}`);
    }
  }
}

// Main execution
const args = process.argv.slice(2);
const shouldAddSampleData = args.includes('--sample-data');

runSetup().then(async () => {
  if (shouldAddSampleData) {
    await addSampleData();
  }
  
  console.log('\n✨ Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. If tables are missing, run the schema SQL in Supabase dashboard');
  console.log('2. Update backend/index.js to include the breakdownAnalyticsAPI route');
  console.log('3. Update GO BARRY wizards to send data to the API');
  console.log('4. Deploy the analytics dashboard\n');
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});