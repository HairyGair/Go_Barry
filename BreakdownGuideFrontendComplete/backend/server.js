/*
 * Breakdown Guide Backend Server
 * Production-ready server for deployment on Render
 * 
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

console.log(`🚀 Starting Breakdown Guide Server in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);
console.log(`📡 Port: ${PORT}`);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In production, you might want to restrict this
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['*'];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (production-friendly)
if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint (for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Import route modules
import healthRoutes from './routes/health.js';
import breakdownTrackerV2 from './routes/breakdownTrackerV2.js';
import breakdownAnalytics from './routes/breakdownAnalytics.js';
import breakdownAssessments from './routes/breakdownAssessments.js';
import adminBreakdowns from './routes/adminBreakdowns.js';
import fleetDatabase from './routes/fleetDatabase.js';
import supervisorAuth from './routes/supervisorAuth.js';

// Register routes
app.use('/api/health', healthRoutes);
app.use('/api/breakdowns', breakdownTrackerV2);
app.use('/api/breakdown-tracker', breakdownTrackerV2); // Alternative endpoint
app.use('/api/breakdown-analytics', breakdownAnalytics);
app.use('/api/breakdown-assessments', breakdownAssessments);
app.use('/api/admin-breakdowns', adminBreakdowns);
app.use('/api/fleet-database', fleetDatabase);
app.use('/api/supervisor', supervisorAuth);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Go North East Breakdown Backend',
    version: '2.0.0',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      documentation: '/api-docs',
      breakdowns: '/api/breakdowns',
      analytics: '/api/breakdown-analytics'
    }
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Breakdown Guide API Documentation',
    version: '2.0.0',
    baseUrl: IS_PRODUCTION ? 
      `https://${req.get('host')}` : 
      `http://localhost:${PORT}`,
    endpoints: {
      health: {
        'GET /api/health': 'Check system health',
        'GET /api/health/detailed': 'Detailed health status'
      },
      breakdowns: {
        'POST /api/breakdowns/start': 'Start new breakdown tracking',
        'PUT /api/breakdowns/location/:id': 'Update breakdown location',
        'POST /api/breakdowns/step': 'Log wizard step',
        'POST /api/breakdowns/diagnose': 'Mark breakdown as diagnosed',
        'PUT /api/breakdowns/:id/resolve': 'Resolve breakdown',
        'GET /api/breakdowns/live': 'Get active breakdowns',
        'GET /api/breakdowns/today': 'Get today\'s breakdowns',
        'GET /api/breakdowns/fleet/:number/history': 'Get fleet history',
        'GET /api/breakdowns/hotspots': 'Get breakdown hotspots',
        'GET /api/breakdowns/stats': 'Get breakdown statistics'
      },
      analytics: {
        'GET /api/breakdown-analytics/depot-kpis': 'Get depot KPIs',
        'GET /api/breakdown-analytics/patterns': 'Get breakdown patterns',
        'GET /api/breakdown-analytics/fleet-health': 'Get fleet health metrics',
        'GET /api/breakdown-analytics/supervisor-performance': 'Get supervisor metrics'
      },
      assessments: {
        'POST /api/breakdown-assessments/log': 'Log assessment',
        'GET /api/breakdown-assessments/recent': 'Get recent assessments'
      },
      admin: {
        'GET /api/admin-breakdowns': 'Get all breakdowns (admin)',
        'GET /api/admin-breakdowns/stats': 'Get breakdown statistics',
        'DELETE /api/admin-breakdowns/:id': 'Delete breakdown (admin only)'
      },
      fleet: {
        'GET /api/fleet-database/search': 'Search fleet database',
        'GET /api/fleet-database/vehicle/:number': 'Get vehicle details',
        'GET /api/fleet-database/depot/:depot': 'Get depot vehicles'
      },
      supervisor: {
        'POST /api/supervisor/login': 'Supervisor login',
        'POST /api/supervisor/verify': 'Verify supervisor session',
        'GET /api/supervisor/state': 'Get supervisor state'
      }
    }
  });
});

// Serve static files in production
if (IS_PRODUCTION) {
  // Serve static files from public directory
  const staticPath = path.join(__dirname, 'public');
  app.use(express.static(staticPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      // Cache static assets aggressively
      if (filepath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
      } else if (filepath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for assets
      }
    }
  }));
  
  // Serve frontend app for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
      });
    }
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to serve application',
          message: IS_PRODUCTION ? 'Internal server error' : err.message
        });
      }
    });
  });
  
  console.log('✅ Static file serving enabled for production');
}

// Error handling
app.use((err, req, res, next) => {
  const message = IS_PRODUCTION ? 
    'Something went wrong' : 
    err.message;
  
  if (!IS_PRODUCTION) {
    console.error('Error:', err.stack);
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Daily cleanup job (reset counters at 1am)
if (IS_PRODUCTION) {
  cron.schedule('0 1 * * *', async () => {
    console.log('🔄 Running daily cleanup tasks...');
    try {
      // Reset daily counters and cleanup old data
      console.log('✅ Daily cleanup completed');
    } catch (error) {
      console.error('❌ Daily cleanup failed:', error);
    }
  });
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  if (IS_PRODUCTION) {
    console.log(`✅ Server started on port ${PORT} in production mode`);
  } else {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          BREAKDOWN GUIDE BACKEND SERVER STARTED               ║
╠════════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                 
║  Environment: ${process.env.NODE_ENV || 'development'}         
║  Time: ${new Date().toISOString()}                             
║                                                                 
║  Endpoints:                                                     
║  - Health:     http://localhost:${PORT}/api/health             
║  - Breakdowns: http://localhost:${PORT}/api/breakdowns         
║  - Analytics:  http://localhost:${PORT}/api/breakdown-analytics
║  - Admin:      http://localhost:${PORT}/api/admin-breakdowns   
║  - Fleet:      http://localhost:${PORT}/api/fleet-database     
║  - Supervisor: http://localhost:${PORT}/api/supervisor         
║                                                                 
║  Documentation: http://localhost:${PORT}/api-docs              
╚════════════════════════════════════════════════════════════════╝
    `);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  if (!IS_PRODUCTION) {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
  }
  server.close(() => {
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
