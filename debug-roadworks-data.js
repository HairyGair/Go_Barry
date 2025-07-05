// Debug script to test roadworks data processing

async function debugRoadworksData() {
  try {
    console.log('🔍 Fetching Street Manager data...');
    const response = await fetch('https://go-barry.onrender.com/api/street-manager-roadworks');
    const data = await response.json();
    
    const roadworks = data.roadworks || [];
    console.log('📊 Total roadworks:', roadworks.length);
    
    // Count by status
    const statusCounts = {};
    const severityCounts = {};
    
    roadworks.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
    });
    
    console.log('📊 Status counts:', statusCounts);
    console.log('📊 Severity counts:', severityCounts);
    
    // Test the same logic as the frontend
    const active = roadworks.filter(r => r.status === 'active').length;
    const planned = roadworks.filter(r => r.status === 'planned').length;
    const critical = roadworks.filter(r => r.severity === 'critical').length;
    
    console.log('📊 Frontend logic results:');
    console.log('  - Active:', active);
    console.log('  - Planned:', planned);
    console.log('  - Critical:', critical);
    console.log('  - Total:', roadworks.length);
    
    // Sample data structure
    console.log('📋 Sample roadwork:');
    console.log(JSON.stringify(roadworks[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugRoadworksData();