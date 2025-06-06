#!/usr/bin/env node
// backend/start-optimized.js
// Memory-optimized startup script for Go Barry Backend
// Fixes JavaScript heap out of memory errors

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚦 BARRY Backend - Memory Optimized Startup');
console.log('🔧 Applying memory optimizations...');

// Memory optimization settings
const MEMORY_SETTINGS = {
  // Increase Node.js heap size to 2GB (from default 1.4GB)
  maxOldSpaceSize: 2048,
  // Optimize garbage collection
  maxSemiSpaceSize: 64,
  // Enable memory optimization flags
  optimizeForSize: true,
  // Reduce memory fragmentation
  exposeGC: true
};

// Build Node.js arguments with memory optimizations
const nodeArgs = [
  `--max-old-space-size=${MEMORY_SETTINGS.maxOldSpaceSize}`,
  `--max-semi-space-size=${MEMORY_SETTINGS.maxSemiSpaceSize}`,
  '--optimize-for-size',
  '--expose-gc',
  '--enable-source-maps',
  // Additional optimization flags
  '--use-largepages=off', // Reduce memory fragmentation
  '--trace-warnings', // Help debug memory issues
  path.join(__dirname, 'index-optimized.js')
];

console.log('🚀 Starting with optimizations:');
console.log(`   💾 Max heap size: ${MEMORY_SETTINGS.maxOldSpaceSize}MB`);
console.log(`   🗑️ Semi-space size: ${MEMORY_SETTINGS.maxSemiSpaceSize}MB`);
console.log(`   ⚡ Size optimization: enabled`);
console.log(`   🔄 Garbage collection: exposed`);

// Start the optimized process
const child = spawn('node', nodeArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    // Set memory monitoring
    UV_THREADPOOL_SIZE: '4', // Reduce thread pool size
    NODE_OPTIONS: '--enable-source-maps' // Better error traces
  }
});

// Handle process events
child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ BARRY Backend stopped gracefully');
  } else {
    console.error(`❌ BARRY Backend exited with code ${code}`);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start BARRY Backend:', error);
  process.exit(1);
});

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

// Memory monitoring (optional)
if (process.env.MONITOR_MEMORY === 'true') {
  setInterval(() => {
    const used = process.memoryUsage();
    console.log('📊 Memory Usage:');
    for (let key in used) {
      console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
  }, 30000); // Every 30 seconds
}
