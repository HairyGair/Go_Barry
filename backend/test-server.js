#!/usr/bin/env node
// test-server.js
// Simple test server for incidents

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Mock endpoints
app.get('/api/incidents', async (req, res) => {
  console.log('📋 Manual incidents requested');
  res.json({
    success: true,
    incidents: []
  });
});

app.get('/api/traffic-incidents', async (req, res) => {
  console.log('🚨 Traffic incidents requested');
  try {
    const mockData = await fs.readFile(path.join(__dirname, 'mock-traffic-incidents.json'), 'utf8');
    res.json(JSON.parse(mockData));
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      incidents: []
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'test-server' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📋 Endpoints:');
  console.log(`   - http://localhost:${PORT}/api/incidents`);
  console.log(`   - http://localhost:${PORT}/api/traffic-incidents`);
  console.log(`   - http://localhost:${PORT}/api/health`);
});