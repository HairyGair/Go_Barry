// backend/index-minimal.js
// ULTRA-MINIMAL version that bypasses all memory-heavy components

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY Backend Starting (Ultra-Minimal for Memory Safety)...');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
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

// Minimal logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Essential endpoints only
app.get('/', (req, res) => {
  res.json({
    message: 'BARRY Traffic Intelligence API - Ultra-Minimal Mode',
    status: 'operational',
    mode: 'memory-safe',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    mode: 'ultra-minimal',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    endpoints: {
      alerts: '/api/alerts',
      test: '/api/alerts-test',
      health: '/api/health'
    }
  });
});

// Sample alerts for testing
const sampleAlerts = [
  {
    id: 'sample_001',
    type: 'incident',
    title: 'Traffic Incident - A1 Northbound',
    description: 'Lane closure due to incident between J65 and J66',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    coordinates: [54.9783, -1.6178],
    severity: 'High',
    status: 'red',
    affectsRoutes: ['21', '22', 'X21'],
    lastUpdated: new Date().toISOString(),
    source: 'sample_data'
  },
  {
    id: 'sample_002',
    type: 'roadwork',
    title: 'Roadworks - Central Station',
    description: 'Temporary traffic lights in operation',
    location: 'Central Station, Newcastle',
    coordinates: [54.9686, -1.6174],
    severity: 'Medium',
    status: 'amber',
    affectsRoutes: ['10', '12', 'Q3'],
    lastUpdated: new Date().toISOString(),
    source: 'sample_data'
  }
];

app.get('/api/alerts', (req, res) => {
  console.log('📊 Serving sample alerts (ultra-minimal mode)');
  res.json({
    success: true,
    alerts: sampleAlerts,
    metadata: {
      totalAlerts: sampleAlerts.length,
      mode: 'ultra-minimal-sample-data',
      lastUpdated: new Date().toISOString(),
      note: 'Sample data - real traffic APIs disabled for memory safety'
    }
  });
});

app.get('/api/alerts-enhanced', (req, res) => {
  console.log('📊 Serving enhanced sample alerts');
  const enhancedAlerts = sampleAlerts.map(alert => ({
    ...alert,
    locationAccuracy: 'high',
    routeMatchMethod: 'sample',
    enhanced: true
  }));
  
  res.json({
    success: true,
    alerts: enhancedAlerts,
    metadata: {
      totalAlerts: enhancedAlerts.length,
      enhancedLocations: enhancedAlerts.length,
      enhancedRoutes: enhancedAlerts.length,
      mode: 'ultra-minimal-enhanced-sample',
      lastUpdated: new Date().toISOString()
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
      mode: 'ultra-minimal'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    mode: 'ultra-minimal',
    services: {
      api: 'online',
      alerts: 'sample-data',
      memory: 'optimized'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    mode: 'ultra-minimal',
    availableEndpoints: [
      '/',
      '/api/health', 
      '/api/alerts',
      '/api/alerts-enhanced',
      '/api/alerts-test',
      '/api/status'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const memUsage = process.memoryUsage();
  console.log(`\n🚦 BARRY Backend Started (Ultra-Minimal Mode)`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`💾 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used`);
  console.log(`\n✅ Memory-Safe Features:`);
  console.log(`   🔒 No GTFS processing (prevents memory overflow)`);
  console.log(`   🔒 No route visualization (prevents crashes)`);
  console.log(`   🔒 No external API calls (reduces memory)`);
  console.log(`   ✅ Sample alerts data for testing`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 /api/alerts - Sample traffic alerts`);
  console.log(`   🧪 /api/alerts-test - Test data`);
  console.log(`   💚 /api/health - System health`);
  console.log(`   🔍 /api/status - Service status`);
  console.log(`\n🎯 Perfect for team testing with guaranteed stability!`);
});

export default app;
