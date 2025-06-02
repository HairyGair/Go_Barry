// backend/debug-gtfs-format.js
// Debug script to examine the actual format of GTFS data

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugGTFSFormat() {
  console.log('🔍 GTFS Format Debugger - Examining raw data structure...\n');
  
  const dataDir = path.join(__dirname, 'data');
  
  try {
    // Check what GTFS files exist
    const files = await fs.readdir(dataDir);
    const gtfsFiles = files.filter(f => f.endsWith('.txt'));
    
    console.log('📁 Available GTFS files:', gtfsFiles);
    console.log('');
    
    // Examine shapes.txt specifically
    const shapesPath = path.join(dataDir, 'shapes.txt');
    
    if (!gtfsFiles.includes('shapes.txt')) {
      console.log('❌ shapes.txt not found!');
      console.log('📂 Available files:', files);
      return;
    }
    
    console.log('📊 Examining shapes.txt format...');
    
    // Read first few lines to understand format
    const shapesContent = await fs.readFile(shapesPath, 'utf8');
    const lines = shapesContent.split('\n').slice(0, 10);
    
    console.log('📄 First 10 lines of shapes.txt:');
    console.log('----------------------------------------');
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index}: ${line}`);
      }
    });
    
    console.log('----------------------------------------\n');
    
    // Parse header and sample data
    if (lines.length > 1) {
      const headers = lines[0].split(',').map(h => h.trim());
      console.log('📋 Headers found:', headers);
      
      // Check if we have the expected coordinate columns
      const hasShapeLat = headers.includes('shape_pt_lat');
      const hasShapeLon = headers.includes('shape_pt_lon');
      const hasShapeId = headers.includes('shape_id');
      
      console.log(`✅ Has shape_id: ${hasShapeId}`);
      console.log(`✅ Has shape_pt_lat: ${hasShapeLat}`);  
      console.log(`✅ Has shape_pt_lon: ${hasShapeLon}`);
      
      if (!hasShapeLat || !hasShapeLon) {
        console.log('❌ Missing required coordinate columns!');
        console.log('🔍 Available columns:', headers);
        return;
      }
      
      // Parse a few sample data rows
      console.log('\n📊 Sample coordinate data:');
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const data = {};
          headers.forEach((header, idx) => {
            data[header] = values[idx];
          });
          
          console.log(`Row ${i}:`);
          console.log(`   shape_id: ${data.shape_id}`);
          console.log(`   shape_pt_lat: ${data.shape_pt_lat}`);
          console.log(`   shape_pt_lon: ${data.shape_pt_lon}`);
          
          // Test coordinate parsing
          const lat = parseFloat(data.shape_pt_lat);
          const lon = parseFloat(data.shape_pt_lon);
          
          console.log(`   Parsed lat: ${lat} (valid: ${!isNaN(lat)})`);
          console.log(`   Parsed lon: ${lon} (valid: ${!isNaN(lon)})`);
          
          // Check if it's in North East region
          const isNorthEast = lat >= 54.5 && lat <= 55.5 && lon >= -2.5 && lon <= -1.0;
          console.log(`   In North East: ${isNorthEast}`);
          console.log('');
        }
      }
    }
    
    // Check file size and line count
    const stats = await fs.stat(shapesPath);
    const lineCount = shapesContent.split('\n').length;
    
    console.log(`📊 File statistics:`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Lines: ${lineCount.toLocaleString()}`);
    console.log(`   Non-empty lines: ${shapesContent.split('\n').filter(l => l.trim()).length.toLocaleString()}`);
    
    // Test coordinate bounds with proper parsing
    console.log('\n🧮 Testing coordinate bounds...');
    await testCoordinateBounds(shapesPath);
    
  } catch (error) {
    console.error('❌ Error examining GTFS format:', error.message);
  }
}

async function testCoordinateBounds(shapesPath) {
  try {
    const content = await fs.readFile(shapesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      console.log('❌ Not enough data in shapes.txt');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const latIndex = headers.indexOf('shape_pt_lat');
    const lonIndex = headers.indexOf('shape_pt_lon');
    
    if (latIndex === -1 || lonIndex === -1) {
      console.log('❌ Cannot find coordinate columns');
      return;
    }
    
    let minLat = 90, maxLat = -90;
    let minLon = 180, maxLon = -180;
    let validCoords = 0;
    let northEastCoords = 0;
    
    // Sample every 1000th line for speed
    for (let i = 1; i < lines.length; i += 1000) {
      if (lines[i] && lines[i].trim()) {
        const values = lines[i].split(',');
        
        const lat = parseFloat(values[latIndex]);
        const lon = parseFloat(values[lonIndex]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          validCoords++;
          
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          
          // Check for North East coordinates
          if (lat >= 54.5 && lat <= 55.5 && lon >= -2.5 && lon <= -1.0) {
            northEastCoords++;
            if (northEastCoords <= 5) {
              console.log(`   Found NE coord: ${lat}, ${lon} (line ${i})`);
            }
          }
        }
      }
    }
    
    console.log(`📍 Coordinate bounds (sampled every 1000th line):`);
    console.log(`   Valid coordinates: ${validCoords}`);
    console.log(`   Latitude: ${minLat.toFixed(6)} to ${maxLat.toFixed(6)}`);
    console.log(`   Longitude: ${minLon.toFixed(6)} to ${maxLon.toFixed(6)}`);
    console.log(`   North East coordinates: ${northEastCoords}`);
    
    if (northEastCoords === 0) {
      console.log('\n❌ PROBLEM: No North East coordinates found!');
      console.log('🔍 This suggests the GTFS data might be for a different region');
      console.log('🎯 Expected North East bounds: lat 54.5-55.5, lon -2.5 to -1.0');
    } else {
      console.log(`\n✅ Found ${northEastCoords} North East coordinates in sample`);
    }
    
  } catch (error) {
    console.error('❌ Error testing coordinate bounds:', error.message);
  }
}

// Run the debugger
debugGTFSFormat();