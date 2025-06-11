#!/usr/bin/env node

// disable-failing-apis.js
// Temporarily disable failing APIs to keep system working

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

console.log('🛠️ BARRY API Fallback Configuration');
console.log('===================================');

async function disableFailingAPIs() {
  const dataSourcePath = join(process.cwd(), 'backend/services/enhancedDataSourceManager.js');
  
  try {
    let content = await readFile(dataSourcePath, 'utf8');
    
    // Find and update the enabled sources configuration
    const updatedContent = content.replace(
      /const\s+enabledSources\s*=\s*\{[^}]+\}/s,
      `const enabledSources = {
  tomtom: true,           // ✅ Working - 15 alerts
  here: false,           // 🚫 Disabled - Auth issues  
  mapquest: false,       // 🚫 Disabled - Auth issues
  nationalHighways: false, // 🚫 Disabled - Auth issues
  manual_incidents: true  // ✅ Always enabled
}`
    );
    
    await writeFile(dataSourcePath, updatedContent, 'utf8');
    
    console.log('✅ Updated enhancedDataSourceManager.js');
    console.log('📊 Active sources: TomTom + Manual Incidents only');
    console.log('⚡ This ensures BARRY keeps working while fixing auth issues');
    
  } catch (error) {
    console.error('❌ Failed to update data source manager:', error.message);
  }
}

async function createStatusEndpoint() {
  const statusContent = `// Temporary status endpoint showing disabled APIs
export function getAPIStatus() {
  return {
    working: ['tomtom', 'manual_incidents'],
    disabled: ['here', 'mapquest', 'nationalHighways'],
    reason: 'Authentication issues - being resolved',
    lastUpdate: '${new Date().toISOString()}',
    performance: 'System operational with reduced sources'
  };
}`;

  try {
    await writeFile(join(process.cwd(), 'backend/utils/apiStatus.js'), statusContent, 'utf8');
    console.log('✅ Created API status tracking');
  } catch (error) {
    console.error('⚠️ Could not create status endpoint:', error.message);
  }
}

console.log('🔧 Applying fallback configuration...\n');

await disableFailingAPIs();
await createStatusEndpoint();

console.log('\n🎯 Fallback Complete:');
console.log('   • TomTom API: ✅ Active (working)');
console.log('   • HERE API: 🚫 Disabled (temp)');
console.log('   • MapQuest API: 🚫 Disabled (temp)');
console.log('   • National Highways: 🚫 Disabled (temp)');
console.log('   • Manual Incidents: ✅ Active');
console.log('\n⚡ BARRY will continue working with TomTom data');
console.log('🔄 Re-enable APIs after fixing auth: git checkout HEAD -- backend/services/enhancedDataSourceManager.js');
