/*
 * Breakdown Guide Service - Standalone server for Go BARRY Breakdown Guide
 * Separated service for better log isolation and monitoring
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    'https://gobarry.co.uk',
    'https://www.gobarry.co.uk',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8082',
    process.env.BACKEND_URL || 'https://go-barry.onrender.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[BREAKDOWN-GUIDE] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'breakdown-guide',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from the breakdown guide directory
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/components', express.static(path.join(__dirname, 'public/components')));
app.use('/services', express.static(path.join(__dirname, 'public/services')));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));

// Proxy API requests to main backend
const BACKEND_URL = process.env.BACKEND_URL || 'https://go-barry.onrender.com';

// Proxy breakdown-related API endpoints
const proxyEndpoints = [
  '/api/breakdown-analytics',
  '/api/breakdowns',
  '/api/breakdown-assessments',
  '/api/admin-breakdowns',
  '/api/fleet-database',
  '/api/supervisor/login',
  '/api/supervisor/verify',
  '/api/supervisor/state'
];

proxyEndpoints.forEach(endpoint => {
  app.all(endpoint + '*', async (req, res) => {
    try {
      const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
      console.log(`[PROXY] Forwarding ${req.method} ${req.originalUrl} to ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          'Content-Type': 'application/json',
          'X-Forwarded-For': req.ip,
          'X-Forwarded-Host': req.hostname,
          'X-Forwarded-Proto': req.protocol
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error(`[PROXY-ERROR] ${endpoint}:`, error.message);
      res.status(500).json({ 
        error: 'Proxy error', 
        message: error.message,
        endpoint: endpoint 
      });
    }
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     BREAKDOWN GUIDE SERVICE STARTED        ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                              
║  Backend: ${BACKEND_URL}
║  Environment: ${process.env.NODE_ENV || 'production'}
║  Time: ${new Date().toISOString()}
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, closing server...');
  process.exit(0);
});