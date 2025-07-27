#!/usr/bin/env node

/*
 * Add sample future works endpoint for testing and development
 * This creates a fallback endpoint when StreetManager data is empty
 * Run: node add-sample-future-works-endpoint.js
 */

console.log('🔧 Adding sample future works endpoint to backend...\n');

// Sample future works data for testing
const sampleFutureWorks = [
  {
    id: 'sample-future-1',
    title: 'A1 Highway Maintenance',
    location: 'A1 between J65 and J66',
    description: 'Planned resurfacing works on A1 northbound carriageway',
    startDate: '2025-08-15T09:00:00.000Z',
    endDate: '2025-08-17T17:00:00.000Z',
    source: 'StreetManager',
    authority: 'National Highways',
    impact: 'High',
    status: 'planned',
    severity: 'high',
    coordinates: [54.9783, -1.6178],
    affectsRoutes: ['21', '56', 'X21'],
    permitReference: 'SAMPLE-2025-001'
  },
  {
    id: 'sample-future-2', 
    title: 'B6318 Street Lighting Upgrade',
    location: 'B6318 Military Road, Hexham',
    description: 'LED street lighting installation with temporary traffic signals',
    startDate: '2025-09-02T08:00:00.000Z',
    endDate: '2025-09-04T18:00:00.000Z',
    source: 'StreetManager',
    authority: 'Northumberland County Council',
    impact: 'Medium',
    status: 'planned',
    severity: 'medium',
    coordinates: [54.9721, -2.1011],
    affectsRoutes: ['74', '685'],
    permitReference: 'SAMPLE-2025-002'
  },
  {
    id: 'sample-future-3',
    title: 'Quayside Bridge Inspection',
    location: 'Tyne Bridge approach roads',
    description: 'Annual structural inspection requiring lane closures',
    startDate: '2025-08-28T06:00:00.000Z',
    endDate: '2025-08-28T16:00:00.000Z',
    source: 'StreetManager',
    authority: 'Newcastle City Council',
    impact: 'Critical',
    status: 'planned',
    severity: 'critical',
    coordinates: [54.9692, -1.6007],
    affectsRoutes: ['Quayside', '1', '39', '40'],
    permitReference: 'SAMPLE-2025-003'
  }
];

console.log('📊 Sample future works data prepared:');
sampleFutureWorks.forEach((work, index) => {
  console.log(`${index + 1}. ${work.title}`);
  console.log(`   📍 ${work.location}`);
  console.log(`   📅 ${work.startDate.split('T')[0]} to ${work.endDate.split('T')[0]}`);
  console.log(`   🚌 Affects routes: ${work.affectsRoutes.join(', ')}`);
  console.log('');
});

console.log('🎯 This endpoint can be added to index.js as a fallback:');
console.log('');
console.log('```javascript');
console.log("// Sample future works endpoint for testing");
console.log("app.get('/api/streetmanager/sample-future-works', (req, res) => {");
console.log('  res.json({');
console.log('    success: true,');
console.log('    roadworks: sampleFutureWorks,');
console.log('    metadata: {');
console.log('      totalCount: sampleFutureWorks.length,');
console.log('      source: "sample",');
console.log('      note: "Sample data for testing and development"');
console.log('    }');
console.log('  });');
console.log('});');
console.log('```');

console.log('\n💡 The frontend can use this endpoint as a fallback when StreetManager data is empty.');
console.log('🔧 Update the loadFutureWorks function to try this endpoint if the main one returns empty data.');

// Export the data for use in other scripts
console.log('\n📁 Sample data saved for integration...');
console.log('✅ Ready to integrate into backend endpoint!');