#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔍 Testing coordinate extraction fix...');

const { data, error } = await supabase
  .from('streetworks')
  .select('*')
  .not('latitude', 'is', null)
  .limit(3);

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} streetworks with latitude`);
  
  data.forEach((streetwork, i) => {
    console.log(`\n--- Testing streetwork ${i + 1} ---`);
    console.log('ID:', streetwork.id);
    console.log('Raw lat/lng:', streetwork.latitude, streetwork.longitude);
    
    // Test coordinate extraction function
    const extractCoordinatesFromWebhook = (streetwork) => {
      if (streetwork.latitude && streetwork.longitude) {
        const lat = parseFloat(streetwork.latitude);
        const lng = parseFloat(streetwork.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`✅ Found pre-converted WGS84: ${lat}, ${lng}`);
          return {
            lat,
            lng,
            source: 'streetworks_wgs84'
          };
        }
      }
      return null;
    };
    
    const coords = extractCoordinatesFromWebhook(streetwork);
    console.log('Extracted coordinates:', coords);
    
    if (coords) {
      // Test coordinate format for TomTom
      const tomtomFormat = [coords.lat, coords.lng];
      console.log('TomTom format [lat, lng]:', tomtomFormat);
      
      // Validate UK coordinates
      if (coords.lat >= 49 && coords.lat <= 61 && coords.lng >= -8 && coords.lng <= 2) {
        console.log('✅ Valid UK coordinates');
      } else {
        console.log('❌ Coordinates outside UK bounds');
      }
    }
  });
}

console.log('\n✅ Coordinate extraction test complete');