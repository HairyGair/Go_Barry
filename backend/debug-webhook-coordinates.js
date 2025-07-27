// debug-webhook-coordinates.js
// Analyze StreetManager webhook data structure for coordinate information

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🔍 Fetching sample StreetManager webhook data to analyze coordinate structure...');

try {
  const { data, error } = await supabase
    .from('streetworks')
    .select('id, sm_reference, sm_easting, sm_northing, latitude, longitude, sm_location_description, sm_street_name, sm_area_name, raw_webhook_data')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ No webhook data found in database');
    process.exit(1);
  }

  console.log(`📊 Analyzing ${data.length} webhook records for coordinate information:\n`);

  data.forEach((item, i) => {
    console.log(`--- Sample ${i+1} (ID: ${item.id}) ---`);
    console.log('SM Reference:', item.sm_reference);
    console.log('Location:', item.sm_location_description || item.sm_street_name || 'Unknown');
    console.log('Area:', item.sm_area_name);
    console.log('🗺️ BNG Coordinates (Easting/Northing):', item.sm_easting, item.sm_northing);
    console.log('🌐 WGS84 Coordinates (Lat/Lng):', item.latitude, item.longitude);
    
    if (item.raw_webhook_data) {
      try {
        const raw = typeof item.raw_webhook_data === 'string' ? 
          JSON.parse(item.raw_webhook_data) : item.raw_webhook_data;
        
        console.log('Raw webhook structure:');
        console.log('  Top-level keys:', Object.keys(raw));
        
        // Check for coordinates in various locations
        const checkForCoordinates = (obj, path = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            const fullPath = path ? `${path}.${key}` : key;
            
            // Check if this looks like coordinate data
            if (key.toLowerCase().includes('coord') || 
                key.toLowerCase().includes('lat') || 
                key.toLowerCase().includes('lng') || 
                key.toLowerCase().includes('lon') ||
                key.toLowerCase().includes('geometry') ||
                key.toLowerCase().includes('easting') ||
                key.toLowerCase().includes('northing') ||
                key.toLowerCase().includes('x') ||
                key.toLowerCase().includes('y')) {
              console.log(`  📍 ${fullPath}:`, value);
            }
            
            // Recursively check nested objects
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              checkForCoordinates(value, fullPath);
            }
          });
        };
        
        checkForCoordinates(raw);
        
        // Special focus on object_data
        if (raw.object_data) {
          console.log('  Object data analysis:');
          console.log('    Keys:', Object.keys(raw.object_data));
          
          // Look for geometry-specific fields
          if (raw.object_data.geometry) {
            console.log('    🗺️ Geometry found:', raw.object_data.geometry);
          }
          
          // Look for coordinate arrays or objects
          Object.keys(raw.object_data).forEach(key => {
            const value = raw.object_data[key];
            if (Array.isArray(value) && value.length >= 2 && 
                typeof value[0] === 'number' && typeof value[1] === 'number') {
              console.log(`    🎯 Potential coordinate array in ${key}:`, value);
            }
          });
        }
        
      } catch (parseError) {
        console.log('  ❌ Failed to parse raw_webhook_data:', parseError.message);
      }
    }
    
    console.log(''); // Empty line between records
  });

} catch (error) {
  console.error('❌ Database query failed:', error);
  process.exit(1);
}

console.log('✅ Coordinate analysis complete');