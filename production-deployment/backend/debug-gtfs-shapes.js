// backend/debug-gtfs-shapes.js
// Debug GTFS shapes to see what coordinates we actually have

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugGTFSShapes() {
  try {
    console.log('🔍 Debugging GTFS shapes.txt...');
    
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const shapesData = await fs.readFile(shapesPath, 'utf8');
    
    console.log('📊 Sampling first 20 shape points...');
    
    const samplePoints = [];
    let processed = 0;
    
    Papa.parse(shapesData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      step: (row) => {
        processed++;
        
        if (processed <= 20 && row.data.shape_pt_lat && row.data.shape_pt_lng) {
          samplePoints.push({
            shape_id: row.data.shape_id,
            lat: parseFloat(row.data.shape_pt_lat),
            lng: parseFloat(row.data.shape_pt_lng),
            sequence: row.data.shape_pt_sequence
          });
        }
        
        if (processed >= 20) return false; // Stop parsing
      }
    });
    
    console.log('\n📍 Sample GTFS coordinates:');
    samplePoints.forEach((point, i) => {
      console.log(`   ${i+1}. Shape ${point.shape_id}: ${point.lat}, ${point.lng}`);
    });
    
    // Find coordinate ranges
    console.log('\n🔍 Finding coordinate bounds in GTFS data...');
    
    let minLat = 90, maxLat = -90;
    let minLng = 180, maxLng = -180;
    let totalPoints = 0;
    let northEastPoints = 0;
    
    const fullParse = Papa.parse(shapesData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      step: (row) => {
        totalPoints++;
        
        if (row.data.shape_pt_lat && row.data.shape_pt_lng) {
          const lat = parseFloat(row.data.shape_pt_lat);
          const lng = parseFloat(row.data.shape_pt_lng);
          
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          
          // Count North East points
          if (lat >= 54.0 && lat <= 56.0 && lng >= -3.0 && lng <= 0.0) {
            northEastPoints++;
          }
        }
        
        if (totalPoints % 100000 === 0) {
          console.log(`   Processed ${totalPoints} points...`);
        }
      }
    });
    
    console.log('\n📊 GTFS Coordinate Summary:');
    console.log(`   Total points: ${totalPoints}`);
    console.log(`   North East points: ${northEastPoints}`);
    console.log(`   Latitude range: ${minLat.toFixed(6)} to ${maxLat.toFixed(6)}`);
    console.log(`   Longitude range: ${minLng.toFixed(6)} to ${maxLng.toFixed(6)}`);
    
    // Test specific coordinates
    console.log('\n🎯 Testing specific coordinates...');
    
    const testCoords = [
      { name: "Newcastle Centre", lat: 54.9783, lng: -1.6178 },
      { name: "Coast Road", lat: 55.0200, lng: -1.4200 }
    ];
    
    for (const test of testCoords) {
      console.log(`\n📍 ${test.name} (${test.lat}, ${test.lng})`);
      
      let closest = { distance: Infinity, point: null };
      let matchesWithin500m = 0;
      
      // Re-parse to find closest points
      Papa.parse(shapesData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        step: (row) => {
          if (row.data.shape_pt_lat && row.data.shape_pt_lng) {
            const lat = parseFloat(row.data.shape_pt_lat);
            const lng = parseFloat(row.data.shape_pt_lng);
            
            const distance = calculateDistance(test.lat, test.lng, lat, lng);
            
            if (distance < closest.distance) {
              closest.distance = distance;
              closest.point = { shape_id: row.data.shape_id, lat, lng };
            }
            
            if (distance <= 500) {
              matchesWithin500m++;
            }
          }
        }
      });
      
      console.log(`   Closest GTFS point: ${closest.distance.toFixed(1)}m away`);
      console.log(`   Shape: ${closest.point?.shape_id} at ${closest.point?.lat}, ${closest.point?.lng}`);
      console.log(`   Points within 500m: ${matchesWithin500m}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

debugGTFSShapes();