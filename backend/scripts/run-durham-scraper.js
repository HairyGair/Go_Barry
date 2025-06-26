#!/usr/bin/env node
// Durham Council Roadworks Scraper Runner
// Usage: node scripts/run-durham-scraper.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import Durham scraper
import durhamRoadworks from '../services/durhamRoadworks.js';

async function runDurhamScraper() {
  console.log('🚧 Starting Durham Council Roadworks Scraper...');
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌐 Target URL: https://www.durham.gov.uk/roadworks');
  console.log('');

  try {
    const startTime = Date.now();
    
    // Fetch Durham roadworks data
    const roadworks = await durhamRoadworks.fetchRoadworks();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Durham scraper completed successfully!');
    console.log(`📊 Results: Found ${roadworks.length} active roadworks`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('');
    
    if (roadworks.length > 0) {
      console.log('📋 Sample roadworks:');
      roadworks.slice(0, 3).forEach((rw, index) => {
        console.log(`  ${index + 1}. ${rw.title || rw.location}`);
        console.log(`     📍 Location: ${rw.location}`);
        console.log(`     🚦 Severity: ${rw.severity}`);
        console.log(`     🚌 Affected Routes: ${rw.affectedRoutes?.join(', ') || 'None identified'}`);
        console.log('');
      });
      
      if (roadworks.length > 3) {
        console.log(`   ... and ${roadworks.length - 3} more roadworks`);
        console.log('');
      }
    } else {
      console.log('ℹ️  No active roadworks found in Durham County Council system');
    }
    
    console.log('🔄 To run continuously, use:');
    console.log('   npm run durham-scraper:watch');
    console.log('');
    console.log('🌐 To view in Go BARRY:');
    console.log('   Supervisor App → Alerts → Filter: Durham Council');
    
  } catch (error) {
    console.error('❌ Durham scraper failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Navigation timeout')) {
      console.error('💡 Suggestion: Check internet connection and Durham Council website availability');
    } else if (error.message.includes('Browser not found')) {
      console.error('💡 Suggestion: Run "npm install" to ensure Puppeteer browser is installed');
    } else if (error.message.includes('memory')) {
      console.error('💡 Suggestion: Close other applications to free up memory for browser');
    }
    
    console.error('');
    console.error('🔧 For troubleshooting:');
    console.error('   1. Check Durham Council website: https://www.durham.gov.uk/roadworks');
    console.error('   2. Verify Puppeteer installation: npm list puppeteer');
    console.error('   3. Check available memory (scraper needs ~500MB)');
    
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Durham scraper interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Durham scraper terminated');
  process.exit(0);
});

// Run the scraper
runDurhamScraper().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});