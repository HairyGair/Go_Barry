#!/usr/bin/env node
// Durham Council Roadworks Scraper - Continuous Runner
// Usage: node scripts/run-durham-scraper-continuous.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import Durham scraper
import durhamRoadworks from '../services/durhamRoadworks.js';

// Configuration
const SCRAPE_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

let isRunning = false;
let consecutiveErrors = 0;
let totalRuns = 0;
let totalRoadworks = 0;

async function scrapeDurhamData() {
  if (isRunning) {
    console.log('⚠️  Skipping run - previous scrape still in progress');
    return;
  }

  isRunning = true;
  const runNumber = ++totalRuns;
  const startTime = Date.now();

  try {
    console.log(`\n🚧 Durham Scraper Run #${runNumber}`);
    console.log(`📅 ${new Date().toISOString()}`);
    
    const roadworks = await durhamRoadworks.fetchRoadworks();
    const duration = Date.now() - startTime;
    
    totalRoadworks = roadworks.length;
    consecutiveErrors = 0; // Reset error counter on success
    
    console.log(`✅ Run #${runNumber} completed successfully`);
    console.log(`📊 Found ${roadworks.length} roadworks in ${(duration / 1000).toFixed(2)}s`);
    
    if (roadworks.length > 0) {
      // Show brief summary of new/updated roadworks
      const recentRoadworks = roadworks.filter(rw => {
        const updatedTime = new Date(rw.lastUpdated || rw.startDate || Date.now());
        const hourAgo = Date.now() - (60 * 60 * 1000);
        return updatedTime.getTime() > hourAgo;
      });
      
      if (recentRoadworks.length > 0) {
        console.log(`🔄 ${recentRoadworks.length} recently updated roadworks`);
      }
    }
    
  } catch (error) {
    consecutiveErrors++;
    const duration = Date.now() - startTime;
    
    console.error(`❌ Run #${runNumber} failed after ${(duration / 1000).toFixed(2)}s`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Consecutive errors: ${consecutiveErrors}/${MAX_RETRIES}`);
    
    if (consecutiveErrors >= MAX_RETRIES) {
      console.error('🚨 Maximum consecutive errors reached. Stopping continuous scraper.');
      console.error('💡 Check Durham Council website and restart manually.');
      process.exit(1);
    }
  } finally {
    isRunning = false;
  }
}

function scheduleNextRun() {
  const nextRun = new Date(Date.now() + SCRAPE_INTERVAL);
  console.log(`⏰ Next run scheduled for: ${nextRun.toLocaleString()}`);
  console.log(`📈 Statistics: ${totalRuns} runs, ${totalRoadworks} current roadworks, ${consecutiveErrors} consecutive errors`);
  
  setTimeout(async () => {
    await scrapeDurhamData();
    scheduleNextRun();
  }, SCRAPE_INTERVAL);
}

// Graceful shutdown handling
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🛑 Received ${signal}, shutting down Durham scraper gracefully...`);
  console.log(`📊 Final Statistics:`);
  console.log(`   • Total runs: ${totalRuns}`);
  console.log(`   • Current roadworks: ${totalRoadworks}`);
  console.log(`   • Consecutive errors: ${consecutiveErrors}`);
  console.log(`   • Uptime: ${(process.uptime() / 3600).toFixed(2)} hours`);
  
  if (isRunning) {
    console.log('⏳ Waiting for current scrape to complete...');
    const checkInterval = setInterval(() => {
      if (!isRunning) {
        clearInterval(checkInterval);
        console.log('✅ Durham scraper stopped successfully');
        process.exit(0);
      }
    }, 1000);
    
    // Force exit after 30 seconds
    setTimeout(() => {
      console.log('⚠️  Force stopping after timeout');
      process.exit(1);
    }, 30000);
  } else {
    console.log('✅ Durham scraper stopped successfully');
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the continuous scraper
console.log('🚀 Starting Durham Council Continuous Scraper');
console.log(`⏱️  Interval: ${SCRAPE_INTERVAL / 60000} minutes`);
console.log(`🔄 Max retries: ${MAX_RETRIES}`);
console.log(`🌐 Target: https://www.durham.gov.uk/roadworks`);
console.log('');
console.log('💡 Press Ctrl+C to stop gracefully');
console.log('=' .repeat(50));

// Run initial scrape immediately
scrapeDurhamData().then(() => {
  scheduleNextRun();
}).catch((error) => {
  console.error('💥 Initial run failed:', error.message);
  console.error('🔄 Will retry in 5 minutes...');
  setTimeout(() => {
    scrapeDurhamData().then(() => {
      scheduleNextRun();
    });
  }, RETRY_DELAY);
});