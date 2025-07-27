#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔍 Testing Supabase coordinate data directly...');

const { data, error } = await supabase
  .from('streetworks')
  .select('id, sm_reference, sm_easting, sm_northing, latitude, longitude, raw_webhook_data')
  .limit(5);

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} streetworks records`);
  
  data.forEach((item, i) => {
    console.log(`\n--- Record ${i+1} ---`);
    console.log('ID:', item.id);
    console.log('SM Reference:', item.sm_reference);
    console.log('BNG Easting:', item.sm_easting);
    console.log('BNG Northing:', item.sm_northing);
    console.log('WGS84 Latitude:', item.latitude);
    console.log('WGS84 Longitude:', item.longitude);
    console.log('Has raw webhook data:', !!item.raw_webhook_data);
    
    if (item.raw_webhook_data) {
      try {
        const raw = JSON.parse(item.raw_webhook_data);
        const worksCoords = raw.object_data?.works_location_coordinates;
        if (worksCoords) {
          console.log('Works location coordinates:', worksCoords.substring(0, 80) + '...');
        }
      } catch (e) {
        console.log('Failed to parse raw data');
      }
    }
  });
}

console.log('\n✅ Supabase coordinate test complete');