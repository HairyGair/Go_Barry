// ADD THIS CODE TO YOUR backend/simple-server.js
// Insert this BEFORE the main '/api/alerts' endpoint (around line 180)

// Sample test data for immediate testing
const sampleTestAlerts = [
  {
    id: 'test_001',
    type: 'incident',
    title: 'Vehicle Breakdown - A1 Northbound',
    description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66. Recovery vehicle en route. Expect delays of 10-15 minutes.',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    authority: 'National Highways',
    source: 'national_highways',
    severity: 'High',
    status: 'red',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['21', '22', 'X21', '25', '28'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - National Highways Simulation'
  },
  {
    id: 'test_002', 
    type: 'congestion',
    title: 'Heavy Traffic - Tyne Tunnel Approach',
    description: 'Severe congestion approaching Tyne Tunnel southbound due to high traffic volume. Delays of 15+ minutes expected.',
    location: 'A19 Southbound, Tyne Tunnel Approach',
    authority: 'Highways England',
    source: 'traffic_monitoring',
    severity: 'Medium',
    status: 'red',
    congestionLevel: 9,
    delayMinutes: 18,
    currentSpeed: 15,
    freeFlowSpeed: 70,
    startDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    affectsRoutes: ['1', '2', '308', '309', '311', '317'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Traffic Intelligence'
  },
  {
    id: 'test_003',
    type: 'roadwork', 
    title: 'Street Works - High Street, Newcastle',
    description: 'Gas main replacement works with temporary traffic lights. Lane closures in effect 9am-4pm weekdays only.',
    location: 'High Street, Newcastle City Centre (near Monument)',
    authority: 'Newcastle City Council',
    source: 'streetmanager',
    severity: 'Medium',
    status: 'amber',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Street Manager'
  },
  {
    id: 'test_004',
    type: 'incident',
    title: 'Road Traffic Collision Cleared - A167',
    description: 'Multi-vehicle collision has been cleared. All lanes now open but expect residual delays for next 30 minutes.',
    location: 'A167 Durham Road, Gateshead (near MetroCentre)',
    authority: 'Northumbria Police',
    source: 'police_reports',
    severity: 'Low',
    status: 'green',
    startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    affectsRoutes: ['21', '22', 'X21', '6', '7'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Police Feed'
  },
  {
    id: 'test_005',
    type: 'roadwork',
    title: 'Major Roadworks - Central Motorway East',
    description: 'Overnight carriageway resurfacing works. Road closure 10pm-6am. Significant delays expected during closure.',
    location: 'A167(M) Central Motorway East, Newcastle',
    authority: 'National Highways', 
    source: 'national_highways',
    severity: 'High',
    status: 'red',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Major Works Programme'
  },
  {
    id: 'test_006',
    type: 'incident',
    title: 'Broken Down Vehicle - Coast Road',
    description: 'Large vehicle broken down in inside lane. Traffic flowing in outside lane but delays building.',
    location: 'A1058 Coast Road, Newcastle (near Gosforth)',
    authority: 'Newcastle Highways',
    source: 'traffic_monitoring',
    severity: 'Medium',
    status: 'red',
    delayMinutes: 8,
    startDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    affectsRoutes: ['1', '2', '308', '309', '317'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Traffic Cameras'
  },
  {
    id: 'test_007',
    type: 'roadwork',
    title: 'Planned Works - Washington Highway',
    description: 'Planned road maintenance starting next week. Lane restrictions during peak hours for 5 days.',
    location: 'A1231 Washington Highway, Washington',
    authority: 'Sunderland Council',
    source: 'streetmanager',
    severity: 'Low',
    status: 'green',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['61', '62', '63', '64', '65'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Planned Works'
  }
];

// TEST ENDPOINT - Add this endpoint to provide sample data immediately
app.get('/api/alerts-test', async (req, res) => {
  console.log('🧪 Serving test alerts data for development...');
  
  const testResponse = {
    success: true,
    alerts: sampleTestAlerts,
    metadata: {
      totalAlerts: sampleTestAlerts.length,
      sources: {
        nationalHighways: { 
          success: true, 
          count: sampleTestAlerts.filter(a => a.source === 'national_highways').length,
          method: 'Test Data'
        },
        streetManager: { 
          success: true, 
          count: sampleTestAlerts.filter(a => a.source === 'streetmanager').length,
          method: 'Test Data'
        },
        trafficMonitoring: {
          success: true,
          count: sampleTestAlerts.filter(a => a.source === 'traffic_monitoring').length,
          method: 'Test Data'
        }
      },
      statistics: {
        totalAlerts: sampleTestAlerts.length,
        activeAlerts: sampleTestAlerts.filter(a => a.status === 'red').length,
        upcomingAlerts: sampleTestAlerts.filter(a => a.status === 'amber').length,
        plannedAlerts: sampleTestAlerts.filter(a => a.status === 'green').length,
        highSeverity: sampleTestAlerts.filter(a => a.severity === 'High').length,
        mediumSeverity: sampleTestAlerts.filter(a => a.severity === 'Medium').length,
        lowSeverity: sampleTestAlerts.filter(a => a.severity === 'Low').length,
        totalIncidents: sampleTestAlerts.filter(a => a.type === 'incident').length,
        totalCongestion: sampleTestAlerts.filter(a => a.type === 'congestion').length,
        totalRoadworks: sampleTestAlerts.filter(a => a.type === 'roadwork').length
      },
      lastUpdated: new Date().toISOString(),
      processingTime: '50ms',
      testMode: true,
      note: 'This is test data for development purposes'
    }
  };
  
  res.json(testResponse);
});

console.log('🧪 Test endpoint configured: /api/alerts-test');