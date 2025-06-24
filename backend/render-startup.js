#!/usr/bin/env node
// Quick fix for Render.com port binding issue

import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;
const server = createServer(app);

console.log('🚀 Starting Go BARRY Backend - Render Optimized...');
console.log(`📍 PORT configured: ${PORT}`);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Basic health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'Go BARRY Backend',
    port: PORT,
    renderOptimized: true
  });
});

// Supervisor activity endpoint
app.get('/api/supervisor/activity/recent', (req, res) => {
  res.json({
    success: true,
    activities: [],
    count: 0,
    lastUpdated: new Date().toISOString()
  });
});

// Supervisor login endpoint
app.post('/api/supervisor/login', (req, res) => {
  const { supervisorId, badge } = req.body;
  
  console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
  
  // Simple fallback authentication
  const validSupervisors = {
    'supervisor001': { name: 'Alex Woodcock', badge: 'AW001' },
    'supervisor002': { name: 'Andrew Cowley', badge: 'AC002' },
    'supervisor003': { name: 'Anthony Gair', badge: 'AG003' },
    'supervisor004': { name: 'Claire Fiddler', badge: 'CF004' },
    'supervisor005': { name: 'David Hall', badge: 'DH005' },
    'supervisor006': { name: 'James Daglish', badge: 'JD006' },
    'supervisor007': { name: 'John Paterson', badge: 'JP007' },
    'supervisor008': { name: 'Simon Glass', badge: 'SG008' },
    'supervisor009': { name: 'Barry Perryman', badge: 'BP009' }
  };
  
  const supervisor = validSupervisors[supervisorId];
  
  if (supervisor && supervisor.badge === badge) {
    const sessionId = `session_${supervisorId}_${Date.now()}`;
    
    console.log(`✅ Auth successful: ${supervisor.name}`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      sessionId,
      supervisor: {
        id: supervisorId,
        name: supervisor.name,
        badge: supervisor.badge,
        role: 'Supervisor',
        permissions: ['dismiss-alerts', 'create-incidents']
      }
    });
  } else {
    console.log(`❌ Auth failed: ${supervisorId}`);
    res.status(401).json({
      success: false,
      error: 'Invalid supervisor credentials'
    });
  }
});

// Active supervisors endpoint
app.get('/api/supervisor/active', (req, res) => {
  res.json({
    success: true,
    activeSupervisors: [],
    count: 0,
    lastUpdated: new Date().toISOString()
  });
});

// Basic alerts endpoint
app.get('/api/alerts-enhanced', (req, res) => {
  res.json({
    success: true,
    alerts: [],
    metadata: {
      totalAlerts: 0,
      sources: {},
      lastUpdated: new Date().toISOString(),
      mode: 'render_startup_mode'
    }
  });
});

// Note: Removed catch-all to allow actual backend routes to work

// RENDER FIX: Start listening immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Go BARRY Backend LISTENING on PORT ${PORT}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔗 Public: https://go-barry.onrender.com`);
  console.log(`✅ PORT BINDING SUCCESSFUL FOR RENDER.COM`);
  console.log(`📡 Health check: https://go-barry.onrender.com/api/health`);
  
  // Load full backend after port is bound
  setTimeout(() => {
    console.log('🔄 Loading full backend functionality...');
    import('./index.js').then(() => {
      console.log('✅ Full backend loaded');
    }).catch(error => {
      console.warn('⚠️ Full backend failed to load:', error.message);
      console.log('🚨 Running in minimal mode');
    });
  }, 5000); // 5 second delay
});

export default app;
