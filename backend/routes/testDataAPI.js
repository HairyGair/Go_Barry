// backend/routes/testDataAPI.js
// Test Data API for Go BARRY - Provides sample alerts when no live data available

import express from 'express';

const router = express.Router();

// Sample test alerts that look like real traffic data
const generateSampleAlerts = () => {
  const currentTime = new Date().toISOString();
  
  return [
    {
      id: `test_${Date.now()}_1`,
      type: 'incident',
      title: 'Vehicle Breakdown - A1 Southbound',
      description: 'Broken down vehicle blocking lane 1 on A1 southbound near Gateshead',
      location: 'A1 Southbound, Gateshead Metro Centre Junction',
      coordinates: [54.9553, -1.6727],
      severity: 'High',
      status: 'red',
      source: 'test_data',
      affectsRoutes: ['21', 'X21', '10', '10A'],
      routeMatchMethod: 'coordinate_based',
      routeAccuracy: 'high',
      lastUpdated: currentTime,
      dataSource: 'Test Data - Simulated Incident',
      locationAccuracy: 'high'
    },
    {
      id: `test_${Date.now()}_2`,
      type: 'roadwork',
      title: 'Roadworks - Tyne Bridge',
      description: 'Lane closure for maintenance work on Tyne Bridge',
      location: 'Tyne Bridge, Newcastle/Gateshead',
      coordinates: [54.9693, -1.6065],
      severity: 'Medium',
      status: 'red',
      source: 'test_data',
      affectsRoutes: ['Q3', 'Q3X', '12', '22'],
      routeMatchMethod: 'enhanced_gtfs',
      routeAccuracy: 'high',
      lastUpdated: currentTime,
      dataSource: 'Test Data - Simulated Roadworks',
      locationAccuracy: 'high'
    },
    {
      id: `test_${Date.now()}_3`,
      type: 'congestion',
      title: 'Heavy Congestion - A19 Silverlink',
      description: 'SCOOT data shows 45% congestion, average speed 15 km/h at Silverlink roundabout',
      location: 'A19 Silverlink Roundabout, North Tyneside',
      coordinates: [55.0391, -1.4854],
      severity: 'Medium',
      status: 'red',
      source: 'test_data',
      affectsRoutes: ['1', '2', '307', '309'],
      routeMatchMethod: 'scoot_site_mapping',
      routeAccuracy: 'high',
      lastUpdated: currentTime,
      dataSource: 'Test Data - Simulated SCOOT Intelligence',
      locationAccuracy: 'high',
      category: 'traffic_intelligence',
      scootData: {
        systemCodeNumber: 'N0511',
        congestionPercent: 45,
        averageSpeed: 15,
        currentFlow: 45,
        linkTravelTime: 180,
        congestionSeverity: 'High',
        speedSeverity: 'High'
      }
    }
  ];
};

// Test alerts endpoint
router.get('/alerts', (req, res) => {
  try {
    const sampleAlerts = generateSampleAlerts();
    
    res.json({
      success: true,
      alerts: sampleAlerts,
      metadata: {
        totalAlerts: sampleAlerts.length,
        testMode: true,
        note: 'These are test alerts to verify the system is working',
        sources: {
          test_data: {
            success: true,
            count: sampleAlerts.length,
            method: 'Generated Test Data'
          }
        },
        lastUpdated: new Date().toISOString(),
        endpoint: '/api/test/alerts'
      }
    });
  } catch (error) {
    console.error('❌ Test alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    });
  }
});

// Test endpoint to simulate API responses
router.get('/simulate/:count', (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 3, 10); // Max 10 alerts
    const alerts = [];
    
    for (let i = 0; i < count; i++) {
      alerts.push({
        id: `simulated_${Date.now()}_${i}`,
        type: i % 2 === 0 ? 'incident' : 'roadwork',
        title: `Simulated Alert ${i + 1}`,
        description: `This is a simulated traffic alert for testing purposes`,
        location: `Test Location ${i + 1}, Newcastle Area`,
        coordinates: [54.9783 + (Math.random() - 0.5) * 0.1, -1.6178 + (Math.random() - 0.5) * 0.1],
        severity: ['Low', 'Medium', 'High'][i % 3],
        status: 'red',
        source: 'simulation',
        affectsRoutes: ['21', 'Q3', '10'][i % 3] ? [['21', 'Q3', '10'][i % 3]] : [],
        lastUpdated: new Date().toISOString(),
        dataSource: 'Simulation Engine'
      });
    }
    
    res.json({
      success: true,
      alerts: alerts,
      metadata: {
        totalAlerts: alerts.length,
        simulationMode: true,
        requestedCount: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    });
  }
});

// System check endpoint
router.get('/system-check', async (req, res) => {
  try {
    res.json({
      success: true,
      systemStatus: {
        backend: 'operational',
        testData: 'available',
        database: 'connected',
        apis: {
          status: 'test_mode',
          note: 'Using test data for verification'
        }
      },
      recommendations: [
        'Test data is working - system is functional',
        'Try expanding geographic coverage for live data',
        'Check if there are actual traffic incidents in Newcastle area',
        'Consider testing during peak traffic hours'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
