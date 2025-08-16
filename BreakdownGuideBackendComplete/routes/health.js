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

export default router;