// backend/debug-gtfs-bounds.js
// Quick debug script to check GTFS stop coordinates

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugStopCoordinates() {
  try {
    console.log('🔍 Debugging GTFS stop coordinates...');
    
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const stopsData = await fs.readFile(stopsPath, 'utf8');
    
    const parsed = Papa.parse(stopsData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    console.log(`📊 Total stops in file: ${parsed.data.length}`);
    
    // Check first 10 stops to see coordinate ranges
    const sampleStops = parsed.data.slice(0, 10).filter(stop => 
      stop.stop_lat && stop.stop_lng && stop.stop_name
    );
    
    console.log('📍 Sample stop coordinates:');
    sampleStops.forEach((stop, i) => {
      console.log(`   ${i+1}. ${stop.stop_name}: ${stop.stop_lat}, ${stop.stop_lng}`);
    });
    
    // Find coordinate ranges
    const validStops = parsed.data.filter(stop => 
      stop.stop_lat && stop.stop_lng && 
      typeof stop.stop_lat === 'number' && typeof stop.stop_lng === 'number'
    );
    
    if (validStops.length > 0) {
      const lats = validStops.map(s => s.stop_lat);
      const lngs = validStops.map(s => s.stop_lng);
      
      const bounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs)
      };
      
      console.log('🗺️ Actual coordinate bounds in data:');
      console.log(`   Latitude: ${bounds.minLat.toFixed(4)} to ${bounds.maxLat.toFixed(4)}`);
      console.log(`   Longitude: ${bounds.minLng.toFixed(4)} to ${bounds.maxLng.toFixed(4)}`);
      
      console.log('⚠️ Current bounding box: 53.8-55.8 lat, -2.8--0.3 lng');
      console.log('💡 Suggested expanded bounding box:');
      console.log(`   Latitude: ${bounds.minLat - 0.1} to ${bounds.maxLat + 0.1}`);
      console.log(`   Longitude: ${bounds.minLng - 0.1} to ${bounds.maxLng + 0.1}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugStopCoordinates();