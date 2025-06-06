// backend/index-simple.js
// ULTRA-SIMPLE version with no Node.js flags needed

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚦 BARRY Backend Starting (Ultra-Simple - No Memory Flags Needed)...');

const app = express();
const PORT = process.env.PORT || 3001;

// Log memory at startup
const startMemory = process.memoryUsage();
console.log(`💾 Startup memory: ${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`);

// Basic middleware
app.use(express.json({ limit: '1mb' })); // Limit JSON payload size
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Essential endpoints only
app.get('/', (req, res) => {
  res.json({
    message: 'BARRY Traffic Intelligence API',
    status: 'operational',
    mode: 'ultra-simple',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
  });
});

app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'operational',
    mode: 'ultra-simple',
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
    },
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/alerts',
      '/api/alerts-enhanced', 
      '/api/alerts-test',
      '/api/health',
      '/api/status'
    ]
  });
});

// Sample alerts for testing (realistic North East data)
const sampleAlerts = [
  {
    id: 'sample_001',
    type: 'incident',
    title: 'Traffic Incident - A1 Northbound',
    description: 'Lane 1 blocked due to vehicle breakdown between Junction 65 and Junction 66. Recovery vehicle en route.',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    coordinates: [54.9783, -1.6178],
    severity: 'High',
    status: 'red',
    affectsRoutes: ['21', '22', 'X21', '25', '28'],
    lastUpdated: new Date().toISOString(),
    source: 'sample_data',
    authority: 'National Highways'
  },
  {
    id: 'sample_002', 
    type: 'roadwork',
    title: 'Roadworks - Central Station',
    description: 'Temporary traffic lights in operation due to planned maintenance works. Expect delays.',
    location: 'Central Station, Newcastle upon Tyne',
    coordinates: [54.9686, -1.6174],
    severity: 'Medium',
    status: 'amber',
    affectsRoutes: ['10', '10A', '12', 'Q3', 'Q3X'],
    lastUpdated: new Date().toISOString(),
    source: 'sample_data',
    authority: 'Newcastle City Council'
  },
  {
    id: 'sample_003',
    type: 'incident', 
    title: 'Traffic Congestion - Tyne Tunnel',
    description: 'Heavy traffic reported in both directions. Allow extra time for your journey.',
    location: 'Tyne Tunnel, North Shields',
    coordinates: [55.0174, -1.4234],
    severity: 'Medium',
    status: 'amber',
    affectsRoutes: ['1', '2', '308', '309', '317'],
    lastUpdated: new Date().toISOString(),
    source: 'sample_data',
    authority: 'TT2 Limited'
  }
];

app.get('/api/alerts', (req, res) => {
  console.log('📊 Serving sample alerts (ultra-simple mode)');
  res.json({
    success: true,
    alerts: sampleAlerts,
    metadata: {
      totalAlerts: sampleAlerts.length,
      activeAlerts: sampleAlerts.filter(a => a.status === 'red').length,
      mode: 'ultra-simple-sample-data',
      lastUpdated: new Date().toISOString(),
      coverage: 'North East England',
      note: 'Sample data for testing - real traffic APIs disabled for memory safety'
    }
  });
});

app.get('/api/alerts-enhanced', (req, res) => {
  console.log('📊 Serving enhanced sample alerts');
  const enhancedAlerts = sampleAlerts.map(alert => ({
    ...alert,
    locationAccuracy: 'high',
    routeMatchMethod: 'enhanced',
    enhanced: true,
    calculatedSeverity: alert.severity,
    routeMatchAccuracy: 95
  }));
  
  res.json({
    success: true,
    alerts: enhancedAlerts,
    metadata: {
      totalAlerts: enhancedAlerts.length,
      enhancedLocations: enhancedAlerts.length,
      enhancedRoutes: enhancedAlerts.length,
      averageRouteAccuracy: 95,
      locationAccuracyRate: 100,
      routeAccuracyRate: 100,
      mode: 'ultra-simple-enhanced-sample',
      lastUpdated: new Date().toISOString(),
      enhancement: 'Sample data with enhanced fields for testing'
    }
  });
});

app.get('/api/alerts-test', (req, res) => {
  res.json({
    success: true,
    alerts: sampleAlerts,
    metadata: {
      count: sampleAlerts.length,
      source: 'test-data',
      mode: 'ultra-simple'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational', 
    mode: 'ultra-simple',
    services: {
      api: 'online',
      alerts: 'sample-data',
      memory: 'optimized'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      mode: 'ultra-simple',
      alertsEnabled: true,
      enhancedProcessing: false,
      realTimeData: false,
      sampleDataOnly: true
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    mode: 'ultra-simple',
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/alerts',
      '/api/alerts-enhanced', 
      '/api/alerts-test',
      '/api/status',
      '/api/config'
    ],
    tip: 'Use /api/alerts for main alerts feed'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const finalMemory = process.memoryUsage();
  console.log(`\n🚦 BARRY Backend Started Successfully!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`💾 Memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB used`);
  console.log(`\n✅ Ultra-Simple Features:`);
  console.log(`   🔒 No Node.js flags required`);
  console.log(`   🔒 No GTFS processing`);
  console.log(`   🔒 No external dependencies`);
  console.log(`   ✅ Sample alerts for testing`);
  console.log(`   ✅ All API endpoints working`);
  console.log(`\n📡 Test Endpoints:`);
  console.log(`   🎯 https://go-barry.onrender.com/api/alerts`);
  console.log(`   🧪 https://go-barry.onrender.com/api/alerts-test`);
  console.log(`   💚 https://go-barry.onrender.com/api/health`);
  console.log(`\n🎯 Perfect for team testing with zero crash risk!`);
});

export default app;
