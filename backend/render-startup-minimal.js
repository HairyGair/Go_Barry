#!/usr/bin/env node
// Minimal render-startup.js for guaranteed Render.com compatibility

import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;
const server = createServer(app);

console.log(`🚀 Go BARRY Minimal Startup - PORT: ${PORT}`);

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Essential endpoints for Go BARRY
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'Go BARRY Backend',
    port: PORT,
    mode: 'minimal_startup'
  });
});

app.get('/api/supervisor/active', (req, res) => {
  console.log('👥 Active supervisors requested');
  res.json({
    success: true,
    activeSupervisors: [],
    count: 0,
    lastUpdated: new Date().toISOString(),
    mode: 'minimal_startup'
  });
});

app.get('/api/supervisor/activity/recent', (req, res) => {
  console.log('📋 Recent activity requested');
  res.json({
    success: true,
    activities: [],
    count: 0,
    lastUpdated: new Date().toISOString(),
    mode: 'minimal_startup'
  });
});

app.get('/api/alerts-enhanced', (req, res) => {
  console.log('🚨 Enhanced alerts requested');
  res.json({
    success: true,
    alerts: [],
    metadata: {
      totalAlerts: 0,
      sources: {},
      lastUpdated: new Date().toISOString(),
      mode: 'minimal_startup'
    }
  });
});

app.post('/api/supervisor/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  res.json({
    success: false,
    error: 'Authentication not available in minimal mode',
    mode: 'minimal_startup'
  });
});

// Catch all
app.use('*', (req, res) => {
  console.log(`📡 Request: ${req.method} ${req.originalUrl}`);
  res.json({
    success: true,
    message: 'Go BARRY Backend - Minimal Mode',
    port: PORT,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    mode: 'minimal_startup'
  });
});

// Start server immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Go BARRY MINIMAL SERVER LISTENING ON PORT ${PORT}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔗 Public: https://go-barry.onrender.com`);
  console.log(`✅ PORT BINDING SUCCESSFUL - RENDER SHOULD DETECT THIS`);
  console.log(`🏥 Health: ${PORT === 10000 ? 'https://go-barry.onrender.com' : 'http://localhost:' + PORT}/api/health`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
