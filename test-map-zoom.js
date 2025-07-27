#!/usr/bin/env node

// Test script to verify map auto-zoom functionality
import fetch from 'node-fetch';

const testMapZoom = async () => {
  console.log('🔍 Testing map auto-zoom data flow...\n');
  
  try {
    // Test roadworks endpoint
    console.log('📡 Testing roadworks endpoint...');
    const response = await fetch('http://localhost:3001/api/roadworks/unified?source=StreetManager');
    
    if (!response.ok) {
      console.log('❌ Backend not running or endpoint unavailable');
      console.log('To test: Start backend with `npm run dev` in /backend directory');
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.roadworks?.length || 0} roadworks`);
    
    if (data.roadworks && data.roadworks.length > 0) {
      console.log('\n🗺️ Coordinate analysis:');
      
      data.roadworks.slice(0, 5).forEach((work, i) => {
        console.log(`\n--- Roadwork ${i + 1} ---`);
        console.log(`ID: ${work.id}`);
        console.log(`Location: ${work.location}`);
        console.log(`Coordinates: ${JSON.stringify(work.coordinates)}`);
        console.log(`Coordinate Source: ${work.coordinateSource}`);
        
        if (work.coordinates) {
          if (Array.isArray(work.coordinates)) {
            const [coord1, coord2] = work.coordinates;
            console.log(`  Array format: [${coord1}, ${coord2}]`);
            
            // Validate coordinates
            if (typeof coord1 === 'number' && typeof coord2 === 'number') {
              // Check if they look like UK coordinates
              if (coord1 >= 49 && coord1 <= 61 && coord2 >= -8 && coord2 <= 2) {
                console.log(`  ✅ Valid UK latitude: ${coord1}`);
              } else if (coord2 >= 49 && coord2 <= 61 && coord1 >= -8 && coord1 <= 2) {
                console.log(`  ⚠️ Coordinates may be reversed: lat=${coord2}, lng=${coord1}`);
              } else {
                console.log(`  ❌ Coordinates outside UK bounds`);
              }
            }
          } else if (work.coordinates.lat && work.coordinates.lng) {
            console.log(`  Object format: lat=${work.coordinates.lat}, lng=${work.coordinates.lng}`);
          }
        } else {
          console.log(`  ❌ No coordinates available`);
        }
      });
      
      // Summary
      const withCoords = data.roadworks.filter(w => w.coordinates && 
        ((Array.isArray(w.coordinates) && w.coordinates.length >= 2) ||
         (w.coordinates.lat && w.coordinates.lng))
      );
      
      const coordPercentage = Math.round((withCoords.length / data.roadworks.length) * 100);
      console.log(`\n📊 Summary: ${withCoords.length}/${data.roadworks.length} (${coordPercentage}%) roadworks have coordinates`);
      
      if (withCoords.length > 0) {
        console.log('\n🎯 Auto-zoom should work for:');
        withCoords.slice(0, 3).forEach((work, i) => {
          const coords = Array.isArray(work.coordinates) ? 
            work.coordinates : [work.coordinates.lat, work.coordinates.lng];
          console.log(`  ${i + 1}. ${work.location} at [${coords[0]}, ${coords[1]}]`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTo run this test:');
    console.log('1. Start backend: cd backend && npm run dev');
    console.log('2. Ensure StreetManager webhook data is available');
    console.log('3. Run this test again');
  }
};

testMapZoom().then(() => {
  console.log('\n✅ Map zoom test complete');
});