/*
 * Simple Breakdown Test API
 * Minimal implementation to verify routing works
 */

import express from 'express';

const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Breakdown route is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple POST test
router.post('/start', (req, res) => {
  const { fleet_number, supervisor_badge } = req.body;
  
  res.json({
    success: true,
    message: 'Breakdown start endpoint reached',
    received: {
      fleet_number,
      supervisor_badge
    },
    breakdown_id: `BD-2025-TEST-${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// List endpoint
router.get('/live', (req, res) => {
  res.json({
    success: true,
    breakdowns: [],
    message: 'Live endpoint working'
  });
});

export default router;
