/*
 * Go Barry - Traffic Intelligence Platform Backend (MINIMAL VERSION)
 * © 2024-2025 Anthony Gair. All rights reserved.
 * anthonygair@icloud.com
 */

// backend/index.js - Go BARRY Backend (Minimal to fix syntax errors)

// Essential imports only
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

console.log('🌟 index.js: Minimal module loading started at', new Date().toISOString());

// Environment variable compatibility fix
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_KEY');
}

// Get the app instance from global (set by render-startup.js)
const app = global.goBarryApp;
if (!app) {
  console.error('❌ FATAL: No app instance found! render-startup.js must run first.');
  throw new Error('App not initialized by render-startup.js');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`🚀 Go BARRY Backend Starting (MINIMAL MODE) - PORT: ${process.env.PORT || 3001}`);

// Basic routes only
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running in minimal mode',
    timestamp: new Date().toISOString()
  });
});

// Enhanced alerts endpoint (minimal version)
app.get('/api/alerts-enhanced', async (req, res) => {
  res.json({
    success: true,
    alerts: [],
    metadata: {
      totalAlerts: 0,
      sources: { minimal: { success: true, count: 0 } },
      lastUpdated: new Date().toISOString(),
      mode: 'minimal',
      message: 'Backend running in minimal mode due to syntax errors'
    }
  });
});

// Main alerts endpoint (minimal version)
app.get('/api/alerts', async (req, res) => {
  res.json({
    success: true,
    alerts: [],
    metadata: {
      totalAlerts: 0,
      sources: { minimal: { success: true, count: 0 } },
      lastUpdated: new Date().toISOString(),
      mode: 'minimal'
    }
  });
});

// Operations stats endpoint (minimal)
app.get('/api/operations/stats', async (req, res) => {
  res.json({
    success: true,
    incidents: { active: 0, total: 0 },
    roadworks: { planned: 0, active: 0, total: 0 },
    disruptions: { active: 0, total: 0 },
    statistics: { total: 0 },
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Minimal backend initialized successfully');
console.log('⚠️ Running in MINIMAL MODE - most features disabled');
console.log('⚠️ Fix syntax errors in routes/intelligenceAPINew.js and other files to restore full functionality');

export default app;
