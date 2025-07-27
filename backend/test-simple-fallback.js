#!/usr/bin/env node

/*
 * Simple test for StreetManager fallback JSON data
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSimpleFallback() {
  console.log('🧪 Testing StreetManager fallback JSON file...\n');

  try {
    const fallbackPath = path.join(__dirname, 'data/streetmanager_fallback.json');
    console.log(`📁 Reading from: ${fallbackPath}`);
    
    const fileContent = await fs.readFile(fallbackPath, 'utf8');
    const parsedContent = JSON.parse(fileContent);
    
    console.log('📊 File structure:');
    console.log(`  Has data array: ${!!parsedContent.data}`);
    console.log(`  Data count: ${parsedContent.data?.length || 0}`);
    console.log(`  Last update: ${parsedContent.lastUpdate}`);
    console.log(`  Source: ${parsedContent.source}`);
    
    if (parsedContent.data?.length > 0) {
      console.log('\n✅ Sample records:');
      parsedContent.data.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ${record.title}`);
        console.log(`   📍 ${record.location_description}`);
        console.log(`   📅 ${record.actual_start_date_time?.split('T')[0]} to ${record.proposed_end_date_time?.split('T')[0]}`);
        console.log(`   🚨 ${record.severity} | ${record.status}`);
        console.log('');
      });
      
      console.log('🎯 JSON fallback data is available and properly formatted!');
      console.log('📝 The issue might be in the unified API not properly calling the fallback.');
      
    } else {
      console.log('❌ No data found in fallback file');
    }

  } catch (error) {
    console.error('❌ Error reading fallback file:', error.message);
  }
}

testSimpleFallback().catch(console.error);