#!/usr/bin/env node

/**
 * Test script to verify fleet 5804 is available after update
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Fleet 5804 availability...\n');

// Check GNE Fleet Database
const gnePath = path.join(__dirname, 'Go_BARRY', 'public', 'gne-fleet-database.json');
try {
    const gneData = JSON.parse(fs.readFileSync(gnePath, 'utf-8'));
    console.log(`📊 GNE Fleet Database:`);
    console.log(`   Total vehicles: ${gneData.fleet.length}`);
    
    const fleet5804 = gneData.fleet.find(v => v.fleetNumber === '5804');
    if (fleet5804) {
        console.log(`   ✅ Fleet 5804 found:`, fleet5804);
    } else {
        console.log(`   ❌ Fleet 5804 NOT found`);
    }
} catch (error) {
    console.log(`   ❌ Error reading GNE database:`, error.message);
}

console.log('');

// Check Backend Fleet Database
const backendPath = path.join(__dirname, 'Go_BARRY', 'public', 'backend', 'data', 'fleet-database.json');
try {
    const backendData = JSON.parse(fs.readFileSync(backendPath, 'utf-8'));
    console.log(`📊 Backend Fleet Database:`);
    console.log(`   Total vehicles: ${Object.keys(backendData).length}`);
    
    if (backendData['5804']) {
        console.log(`   ✅ Fleet 5804 found:`, backendData['5804']);
    } else {
        console.log(`   ❌ Fleet 5804 NOT found`);
    }
} catch (error) {
    console.log(`   ❌ Error reading backend database:`, error.message);
}
