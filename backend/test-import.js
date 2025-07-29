// Test if we can import the route files
console.log('🔍 Testing route file imports...');

const files = [
  './routes/incidentAlertsAPI.js',
  './routes/roadworksAPI.js'
];

for (const file of files) {
  try {
    console.log(`\nTesting import: ${file}`);
    const module = await import(file);
    console.log(`✅ ${file} - Imported successfully`);
    console.log(`   Default export type: ${typeof module.default}`);
    console.log(`   Has router: ${!!module.default}`);
  } catch (error) {
    console.log(`❌ ${file} - Import failed: ${error.message}`);
  }
}

console.log('\n🏁 Import testing complete');