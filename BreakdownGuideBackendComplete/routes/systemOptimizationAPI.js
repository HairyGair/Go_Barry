// System Optimization API
// Provides endpoints for system performance management and optimization

import express from 'express';
import systemHealthMonitor from '../services/systemHealthMonitor.js';
import alertProcessingOptimizer from '../services/alertProcessingOptimizer.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Performance Management
router.get('/performance', requireAdmin, async (req, res) => {
  const report = await systemHealthMonitor.runDiagnostics();
  res.json(report);
});

router.post('/optimize', requireAdmin, async (req, res) => {
  // Trigger system-wide optimization
  // ...implement optimization logic...
  res.json({ status: 'optimization triggered' });
});

router.get('/memory-usage', requireAdmin, (req, res) => {
  res.json(systemHealthMonitor.getMemoryUsage());
});

router.post('/cache/clear', requireAdmin, (req, res) => {
  alertProcessingOptimizer.clearAlertCache();
  res.json({ status: 'cache cleared' });
});

router.get('/bottlenecks', requireAdmin, (req, res) => {
  // ...implement bottleneck detection...
  res.json({ bottlenecks: [] });
});

// Alert Processing Optimization
router.get('/alerts/processing-stats', requireAdmin, (req, res) => {
  res.json(alertProcessingOptimizer.getAlertProcessingStats());
});

router.post('/alerts/optimize', requireAdmin, async (req, res) => {
  // ...implement alert optimization logic...
  res.json({ status: 'alert optimization triggered' });
});

router.get('/alerts/queue-status', requireAdmin, async (req, res) => {
  const queue = await systemHealthMonitor.checkAlertQueue();
  res.json(queue);
});

router.post('/alerts/queue/clear', requireAdmin, (req, res) => {
  // ...implement queue clearing logic...
  res.json({ status: 'alert queue cleared' });
});

// Service Management
router.get('/services/status', requireAdmin, async (req, res) => {
  const report = await systemHealthMonitor.runDiagnostics();
  res.json({
    api: report.apiStatus,
    db: report.dbStatus,
    convex: report.convexSync,
    alertQueue: report.alertQueue,
  });
});

router.post('/services/restart', requireAdmin, (req, res) => {
  // ...implement service restart logic...
  res.json({ status: 'service restart triggered' });
});

router.get('/services/performance', requireAdmin, async (req, res) => {
  const report = await systemHealthMonitor.runDiagnostics();
  res.json({
    memory: report.memory,
    responseTimes: report.responseTimes,
    errorRates: report.errorRates,
  });
});

router.post('/services/optimize', requireAdmin, (req, res) => {
  // ...implement service-specific optimization...
  res.json({ status: 'service optimization triggered' });
});

export default router;
