#!/usr/bin/env node
// Script to install Chrome/Chromium for Puppeteer on various platforms

import { execSync } from 'child_process';
import { platform } from 'os';

console.log('🔧 Checking Chrome/Chromium installation for Puppeteer...');

try {
  // Skip if Chrome download is disabled (production servers)
  if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true') {
    console.log('✅ PUPPETEER_SKIP_CHROMIUM_DOWNLOAD is set, using system Chrome');
    
    // Check if system Chrome/Chromium exists
    try {
      execSync('which chromium-browser || which chromium || which google-chrome', { stdio: 'ignore' });
      console.log('✅ System Chrome/Chromium found');
    } catch (e) {
      console.warn('⚠️ System Chrome/Chromium not found - Durham scraper will be disabled');
    }
    
    process.exit(0);
  }

  // For development environments, let Puppeteer download Chrome
  if (process.env.NODE_ENV !== 'production') {
    console.log('🌐 Development environment - Puppeteer will download Chrome automatically');
    process.exit(0);
  }

  // For Render.com or other cloud platforms
  if (process.env.RENDER) {
    console.log('🚀 Detected Render.com environment');
    console.log('⚠️ Chrome installation requires apt-get which may not be available');
    console.log('💡 Durham scraper will be disabled if Chrome is not available');
    process.exit(0);
  }

  // Platform-specific installation (for reference)
  const os = platform();
  
  switch (os) {
    case 'linux':
      console.log('🐧 Linux detected - Chrome should be installed via package manager');
      console.log('   Ubuntu/Debian: apt-get install chromium-browser');
      console.log('   Alpine: apk add chromium');
      console.log('   RHEL/CentOS: yum install chromium');
      break;
      
    case 'darwin':
      console.log('🍎 macOS detected - Chrome will be downloaded by Puppeteer');
      break;
      
    case 'win32':
      console.log('🪟 Windows detected - Chrome will be downloaded by Puppeteer');
      break;
      
    default:
      console.log(`❓ Unknown platform: ${os}`);
  }

} catch (error) {
  console.error('❌ Chrome installation check failed:', error.message);
  console.log('⚠️ Durham scraper may not work without Chrome');
  // Don't fail the install
  process.exit(0);
}
