// check-supabase-schema.js
// Check if we need any SQL updates for the enhanced coordinate system

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🔍 Checking Supabase schema for coordinate system requirements...\n');

async function checkSchema() {
  try {
    // Check streetworks table structure
    console.log('📊 Analyzing streetworks table structure:');
    const { data: sample, error } = await supabase
      .from('streetworks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing streetworks table:', error.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log(`✅ Table has ${columns.length} columns`);
      
      // Check for required coordinate fields
      const requiredFields = [
        'sm_easting',
        'sm_northing', 
        'latitude',
        'longitude',
        'raw_webhook_data'
      ];
      
      console.log('\n🗺️ Coordinate field analysis:');
      requiredFields.forEach(field => {
        const exists = columns.includes(field);
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
      
      // Check data quality
      console.log('\n📈 Data quality analysis:');
      const { data: coordData, error: coordError } = await supabase
        .from('streetworks')
        .select('id, sm_easting, sm_northing, latitude, longitude, raw_webhook_data')
        .limit(10);
      
      if (!coordError && coordData) {
        const withBNG = coordData.filter(row => row.sm_easting && row.sm_northing).length;
        const withWGS84 = coordData.filter(row => row.latitude && row.longitude).length;
        const withRawData = coordData.filter(row => row.raw_webhook_data).length;
        
        console.log(`  BNG coordinates: ${withBNG}/${coordData.length} records`);
        console.log(`  WGS84 coordinates: ${withWGS84}/${coordData.length} records`);
        console.log(`  Raw webhook data: ${withRawData}/${coordData.length} records`);
        
        // Analyze raw webhook data structure
        if (withRawData > 0) {
          const sampleRaw = coordData.find(row => row.raw_webhook_data);
          if (sampleRaw) {
            try {
              const parsed = JSON.parse(sampleRaw.raw_webhook_data);
              const hasWorksLocationCoords = parsed.object_data && parsed.object_data.works_location_coordinates;
              console.log(`  works_location_coordinates in raw data: ${hasWorksLocationCoords ? 'YES' : 'NO'}`);
              
              if (hasWorksLocationCoords) {
                console.log(`  Sample geometry: ${parsed.object_data.works_location_coordinates.substring(0, 50)}...`);
              }
            } catch (e) {
              console.log('  Raw data parsing: FAILED');
            }
          }
        }
      }
      
      // Check if we need any new indexes or constraints
      console.log('\n🔧 Recommendations:');
      
      const missingFields = requiredFields.filter(field => !columns.includes(field));
      if (missingFields.length > 0) {
        console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
        console.log('   → SQL UPDATE REQUIRED');
        
        // Generate SQL for missing fields
        console.log('\n📝 Required SQL:');
        missingFields.forEach(field => {
          let sqlType = 'TEXT';
          if (field === 'sm_easting' || field === 'sm_northing' || field === 'latitude' || field === 'longitude') {
            sqlType = 'DECIMAL(12,8)';
          } else if (field === 'raw_webhook_data') {
            sqlType = 'JSONB';
          }
          console.log(`ALTER TABLE streetworks ADD COLUMN IF NOT EXISTS ${field} ${sqlType};`);
        });
      } else {
        console.log('✅ All required fields exist');
        
        // Check if we should add indexes for performance
        console.log('\n🚀 Performance optimization suggestions:');
        console.log('-- Add spatial indexes for coordinate fields (if not exist):');
        console.log('CREATE INDEX IF NOT EXISTS idx_streetworks_coordinates ON streetworks (latitude, longitude);');
        console.log('CREATE INDEX IF NOT EXISTS idx_streetworks_bng ON streetworks (sm_easting, sm_northing);');
        console.log('CREATE INDEX IF NOT EXISTS idx_streetworks_webhook_time ON streetworks (webhook_received_at);');
        console.log('-- Add GIN index for raw webhook data JSON queries:');
        console.log('CREATE INDEX IF NOT EXISTS idx_streetworks_raw_data ON streetworks USING GIN (raw_webhook_data);');
      }
      
    } else {
      console.log('❌ No data found in streetworks table');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

await checkSchema();
console.log('\n✅ Schema analysis complete');