// emergency-minimal-index.js
// Minimal working backend to get system back online

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚨 EMERGENCY MINIMAL BACKEND STARTING...');

// Basic middleware
app.use(cors({
  origin: ['https://gobarry.co.uk', 'https://www.gobarry.co.uk', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check - MUST work
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'EMERGENCY_MODE',
    timestamp: new Date().toISOString(),
    message: 'Minimal backend online'
  });
});

// Basic alerts endpoint with sample data
app.get('/api/alerts-enhanced', (req, res) => {
  const sampleAlerts = [
    {
      id: 'emergency_001',
      title: 'Emergency Mode - Limited Service',
      description: 'Backend running in emergency mode with sample data',
      location: 'Newcastle City Centre',
      coordinates: [54.9783, -1.6178],
      severity: 'Medium',
      status: 'amber',
      source: 'emergency_system',
      affectsRoutes: ['21', 'Q3', '10'],
      lastUpdated: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    alerts: sampleAlerts,
    metadata: {
      totalAlerts: sampleAlerts.length,
      mode: 'EMERGENCY_MINIMAL',
      sources: {
        emergency: { success: true, count: 1 }
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

// Basic supervisor endpoint
app.get('/api/supervisor/active', (req, res) => {
  res.json({
    success: true,
    activeSupervisors: [],
    count: 0,
    mode: 'EMERGENCY'
  });
});

// Catch all for debugging
app.use('*', (req, res) => {
  console.log(`📍 Emergency backend received: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Emergency mode - limited endpoints available',
    availableEndpoints: ['/api/health', '/api/alerts-enhanced', '/api/supervisor/active']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 EMERGENCY BACKEND ONLINE`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Available endpoints:`);
  console.log(`   /api/health`);
  console.log(`   /api/alerts-enhanced`);
  console.log(`   /api/supervisor/active`);
  console.log(`✅ Ready for emergency operation`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
