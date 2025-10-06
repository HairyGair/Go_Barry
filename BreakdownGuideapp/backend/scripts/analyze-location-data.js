#!/usr/bin/env node
/**
 * Script to analyze location data in breakdowns database
 * Examines location formats and coordinate availability
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeLocationData() {
  console.log('🔍 Analyzing location data in breakdowns table...\n');

  try {
    // 1. Get recent active breakdowns
    console.log('📊 Query 1: Recent active breakdowns with location data');
    console.log('─'.repeat(80));

    const { data: activeBreakdowns, error: activeError } = await supabase
      .from('breakdowns')
      .select('breakdown_id, fleet_no, location_description, wizard_assessment_data, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (activeError) {
      console.error('❌ Error:', activeError.message);
    } else {
      console.log(`✅ Found ${activeBreakdowns?.length || 0} active breakdowns\n`);

      if (activeBreakdowns && activeBreakdowns.length > 0) {
        activeBreakdowns.forEach((breakdown, idx) => {
          console.log(`\n${idx + 1}. Breakdown ID: ${breakdown.breakdown_id}`);
          console.log(`   Fleet: ${breakdown.fleet_no}`);
          console.log(`   Status: ${breakdown.status}`);
          console.log(`   Location Description: ${breakdown.location_description || 'N/A'}`);

          if (breakdown.wizard_assessment_data) {
            const wizardData = breakdown.wizard_assessment_data;
            console.log(`   Wizard Data Keys: ${Object.keys(wizardData).join(', ')}`);

            if (wizardData.location_coords) {
              console.log(`   📍 Coordinates: ${JSON.stringify(wizardData.location_coords)}`);
            }
            if (wizardData.location) {
              console.log(`   📍 Location Field: ${JSON.stringify(wizardData.location)}`);
            }
          } else {
            console.log(`   Wizard Data: None`);
          }
        });
      }
    }

    // 2. Check all breakdowns for coordinate patterns
    console.log('\n\n📊 Query 2: All breakdowns (checking for coordinates)');
    console.log('─'.repeat(80));

    const { data: allBreakdowns, error: allError } = await supabase
      .from('breakdowns')
      .select('breakdown_id, fleet_no, location_description, wizard_assessment_data, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (allError) {
      console.error('❌ Error:', allError.message);
    } else {
      console.log(`✅ Analyzing ${allBreakdowns?.length || 0} total breakdowns\n`);

      let totalBreakdowns = allBreakdowns?.length || 0;
      let withLocationDesc = 0;
      let withWizardData = 0;
      let withCoordinates = 0;
      let coordinateFormats = {
        location_coords: 0,
        location: 0,
        embedded_in_description: 0,
        other: 0
      };

      const samples = {
        location_coords: [],
        location: [],
        embedded_in_description: [],
        other: []
      };

      if (allBreakdowns) {
        allBreakdowns.forEach(breakdown => {
          // Check location description
          if (breakdown.location_description) {
            withLocationDesc++;

            // Check if coordinates embedded in description (lat/lng pattern)
            const coordPattern = /\(?\-?\d+\.\d+,\s*\-?\d+\.\d+\)?/;
            if (coordPattern.test(breakdown.location_description)) {
              coordinateFormats.embedded_in_description++;
              if (samples.embedded_in_description.length < 3) {
                samples.embedded_in_description.push({
                  id: breakdown.breakdown_id,
                  location: breakdown.location_description
                });
              }
            }
          }

          // Check wizard assessment data
          if (breakdown.wizard_assessment_data) {
            withWizardData++;
            const wizardData = breakdown.wizard_assessment_data;

            // Check for location_coords field
            if (wizardData.location_coords) {
              withCoordinates++;
              coordinateFormats.location_coords++;
              if (samples.location_coords.length < 3) {
                samples.location_coords.push({
                  id: breakdown.breakdown_id,
                  coords: wizardData.location_coords
                });
              }
            }

            // Check for location field
            if (wizardData.location) {
              coordinateFormats.location++;
              if (samples.location.length < 3) {
                samples.location.push({
                  id: breakdown.breakdown_id,
                  location: wizardData.location
                });
              }
            }

            // Check for other coordinate-like fields
            Object.keys(wizardData).forEach(key => {
              if (key.toLowerCase().includes('coord') ||
                  key.toLowerCase().includes('lat') ||
                  key.toLowerCase().includes('lng') ||
                  key.toLowerCase().includes('geo')) {
                coordinateFormats.other++;
                if (samples.other.length < 3) {
                  samples.other.push({
                    id: breakdown.breakdown_id,
                    field: key,
                    value: wizardData[key]
                  });
                }
              }
            });
          }
        });
      }

      // Print analysis
      console.log('📈 ANALYSIS SUMMARY');
      console.log('─'.repeat(80));
      console.log(`Total Breakdowns Analyzed: ${totalBreakdowns}`);
      console.log(`With Location Description: ${withLocationDesc} (${(withLocationDesc/totalBreakdowns*100).toFixed(1)}%)`);
      console.log(`With Wizard Assessment Data: ${withWizardData} (${(withWizardData/totalBreakdowns*100).toFixed(1)}%)`);
      console.log(`With Coordinates: ${withCoordinates} (${(withCoordinates/totalBreakdowns*100).toFixed(1)}%)`);

      console.log('\n📍 COORDINATE FORMAT BREAKDOWN');
      console.log('─'.repeat(80));
      console.log(`wizard_assessment_data.location_coords: ${coordinateFormats.location_coords}`);
      console.log(`wizard_assessment_data.location: ${coordinateFormats.location}`);
      console.log(`Embedded in location_description: ${coordinateFormats.embedded_in_description}`);
      console.log(`Other fields: ${coordinateFormats.other}`);

      // Print samples
      console.log('\n📋 SAMPLE DATA');
      console.log('─'.repeat(80));

      if (samples.location_coords.length > 0) {
        console.log('\n✅ wizard_assessment_data.location_coords samples:');
        samples.location_coords.forEach(sample => {
          console.log(`   ${sample.id}: ${JSON.stringify(sample.coords)}`);
        });
      }

      if (samples.location.length > 0) {
        console.log('\n✅ wizard_assessment_data.location samples:');
        samples.location.forEach(sample => {
          console.log(`   ${sample.id}: ${JSON.stringify(sample.location)}`);
        });
      }

      if (samples.embedded_in_description.length > 0) {
        console.log('\n✅ Coordinates embedded in location_description:');
        samples.embedded_in_description.forEach(sample => {
          console.log(`   ${sample.id}: ${sample.location}`);
        });
      }

      if (samples.other.length > 0) {
        console.log('\n✅ Other coordinate fields:');
        samples.other.forEach(sample => {
          console.log(`   ${sample.id} - ${sample.field}: ${JSON.stringify(sample.value)}`);
        });
      }

      // Recommendations
      console.log('\n\n💡 RECOMMENDATIONS');
      console.log('─'.repeat(80));

      if (withCoordinates > 0) {
        console.log('✅ USABLE: Coordinate data exists in the database');
        console.log(`   Field Path: wizard_assessment_data.location_coords`);
        console.log(`   Coverage: ${(withCoordinates/totalBreakdowns*100).toFixed(1)}% of breakdowns`);
        console.log(`   Format: ${samples.location_coords.length > 0 ? JSON.stringify(samples.location_coords[0].coords) : 'Unknown'}`);
      } else {
        console.log('⚠️  NO COORDINATES: No structured coordinate data found');
        console.log('   Consider implementing coordinate capture in breakdown wizard');
      }

      if (coordinateFormats.embedded_in_description > 0) {
        console.log('\n⚠️  PARSING NEEDED: Some coordinates embedded in text descriptions');
        console.log('   Consider extracting these with regex parsing');
      }

      console.log('\n');
    }

    // 3. Check database schema
    console.log('\n📊 Query 3: Database schema for breakdowns table');
    console.log('─'.repeat(80));

    const { data: columns, error: schemaError } = await supabase
      .from('breakdowns')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Error:', schemaError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ Breakdowns table columns:');
      Object.keys(columns[0]).forEach(col => {
        const value = columns[0][col];
        const type = typeof value;
        console.log(`   - ${col} (${type})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run the analysis
analyzeLocationData()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
