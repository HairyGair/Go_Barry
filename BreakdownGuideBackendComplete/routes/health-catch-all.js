// backend/routes/health.js
// UPDATED: Added catch-all route handler for debugging
import express from 'express';
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0-refactored',
    message: 'BARRY Backend - Newly Organized! 🎉'
  });
});

// Detailed health check
router.get('/detailed', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0-refactored',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    message: 'All systems operational!'
  });
});

// Catch-all health response for unmatched routes (this might be the issue)
router.all('*', (req, res) => {
  console.log(`⚠️ Unmatched route in health: ${req.method} ${req.path}`);
  res.json({
    success: true,
    message: 'Go BARRY Backend is running on Render.com',
    port: process.env.PORT || '3001',
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
    renderOptimized: true,
    warning: 'Route not found - returning health status'
  });
});

export default router;
