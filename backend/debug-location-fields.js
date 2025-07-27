// debug-location-fields.js
// Check actual location field values in streetworks table

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🔍 Analyzing location fields in streetworks table...\n');

try {
  const { data, error } = await supabase
    .from('streetworks')
    .select('id, sm_reference, sm_location_description, sm_street_name, sm_area_name, raw_webhook_data')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log(`📊 Analyzing ${data.length} streetworks records:\n`);

  data.forEach((item, i) => {
    console.log(`--- Record ${i+1} (ID: ${item.id}) ---`);
    console.log('SM Reference:', item.sm_reference);
    console.log('SM Location Description:', item.sm_location_description);
    console.log('SM Street Name:', item.sm_street_name);
    console.log('SM Area Name:', item.sm_area_name);
    
    if (item.raw_webhook_data) {
      try {
        const raw = typeof item.raw_webhook_data === 'string' ? 
          JSON.parse(item.raw_webhook_data) : item.raw_webhook_data;
        
        if (raw.object_data) {
          console.log('Object Data Location Fields:');
          console.log('  street_name:', raw.object_data.street_name);
          console.log('  area_name:', raw.object_data.area_name);
          console.log('  town:', raw.object_data.town);
          
          // Build the location string as the frontend expects
          const primaryLocation = item.sm_location_description || item.sm_street_name || raw.object_data.street_name || 'Unknown location';
          const areaInfo = item.sm_area_name || raw.object_data.area_name || raw.object_data.town;
          const fullLocation = areaInfo ? `${primaryLocation}, ${areaInfo}` : primaryLocation;
          
          console.log('📍 Computed Location String:', fullLocation);
        }
      } catch (e) {
        console.log('❌ Failed to parse raw webhook data');
      }
    }
    
    console.log(''); // Empty line between records
  });

} catch (error) {
  console.error('❌ Query failed:', error);
}

console.log('✅ Location field analysis complete');