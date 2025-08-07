// Consolidated Supervisor Routes
// Combines all supervisor-related endpoints into one file

import express from 'express';
import ApiResponse, { asyncHandler } from '../../utils/ApiResponse.js';
import cacheManager, { CacheStrategies } from '../../services/cacheManager.js';
import supervisorManager from '../../services/supervisorManager.js';

const router = express.Router();

// === AUTHENTICATION ===

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { badgeNumber, password } = req.body;
  
  if (!badgeNumber || !password) {
    return res.status(400).json(
      ApiResponse.error('Badge number and password required', 400)
    );
  }

  const result = await supervisorManager.authenticate(badgeNumber, password);
  
  if (!result.success) {
    return res.status(401).json(
      ApiResponse.error(result.error || 'Authentication failed', 401)
    );
  }

  res.json(ApiResponse.success(result, { action: 'login' }));
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const { supervisorId } = req.body;
  
  if (!supervisorId) {
    return res.status(400).json(
      ApiResponse.error('Supervisor ID required', 400)
    );
  }

  await supervisorManager.logout(supervisorId);
  await cacheManager.delete(`supervisor:session:${supervisorId}`);
  
  res.json(ApiResponse.success({ message: 'Logged out successfully' }));
}));

// Validate session
router.get('/session/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  
  // Check cache first
  const cacheKey = `supervisor:session:${supervisorId}`;
  const cached = await cacheManager.get(cacheKey);
  
  if (cached) {
    return res.json(ApiResponse.cached(cached.value, {
      timestamp: new Date().toISOString()
    }));
  }
  
  const session = await supervisorManager.getSession(supervisorId);
  
  if (!session) {
    return res.status(404).json(
      ApiResponse.error('Session not found', 404)
    );
  }
  
  // Cache for session duration
  await cacheManager.set(cacheKey, session, CacheStrategies.SHORT.ttl);
  
  res.json(ApiResponse.success(session));
}));

// === SUPERVISOR MANAGEMENT ===

// Get all supervisors
router.get('/', asyncHandler(async (req, res) => {
  const supervisors = await supervisorManager.getAllSupervisors();
  res.json(ApiResponse.success(supervisors));
}));

// Get supervisor by ID
router.get('/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  const supervisor = await supervisorManager.getSupervisor(supervisorId);
  
  if (!supervisor) {
    return res.status(404).json(
      ApiResponse.error('Supervisor not found', 404)
    );
  }
  
  res.json(ApiResponse.success(supervisor));
}));

// Update supervisor
router.put('/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  const updates = req.body;
  
  const updated = await supervisorManager.updateSupervisor(supervisorId, updates);
  
  if (!updated) {
    return res.status(404).json(
      ApiResponse.error('Supervisor not found', 404)
    );
  }
  
  // Clear related caches
  await cacheManager.delete(`supervisor:${supervisorId}`);
  await cacheManager.delete(`supervisor:session:${supervisorId}`);
  
  res.json(ApiResponse.success(updated, { action: 'updated' }));
}));

// === ACTIONS ===

// Dismiss alert
router.post('/dismiss-alert', asyncHandler(async (req, res) => {
  const { supervisorId, alertId, reason } = req.body;
  
  if (!supervisorId || !alertId) {
    return res.status(400).json(
      ApiResponse.error('Supervisor ID and Alert ID required', 400)
    );
  }
  
  const result = await supervisorManager.dismissAlert(supervisorId, alertId, reason);
  
  // Clear alert caches
  const keys = await cacheManager.memoryCache.keys();
  const alertKeys = keys.filter(k => k.includes('alerts'));
  for (const key of alertKeys) {
    await cacheManager.delete(key);
  }
  
  res.json(ApiResponse.success(result, { action: 'dismissed' }));
}));

// Get dismissed alerts
router.get('/dismissed-alerts/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  const dismissed = await supervisorManager.getDismissedAlerts(supervisorId);
  
  res.json(ApiResponse.success(dismissed));
}));

// === STATISTICS ===

// Get supervisor statistics
router.get('/stats/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  
  const stats = await supervisorManager.getStatistics(supervisorId);
  
  res.json(ApiResponse.success(stats));
}));

// Get activity log
router.get('/activity/:supervisorId', asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  const activities = await supervisorManager.getActivityLog(supervisorId, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  res.json(ApiResponse.success(activities));
}));

// === ADMIN FUNCTIONS ===

// Reset password (admin only)
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { adminId, targetSupervisorId, newPassword } = req.body;
  
  // Check if requester is admin
  if (!['AG003', 'BP009'].includes(adminId)) {
    return res.status(403).json(
      ApiResponse.error('Admin access required', 403)
    );
  }
  
  const result = await supervisorManager.resetPassword(targetSupervisorId, newPassword);
  
  res.json(ApiResponse.success(result, { action: 'password_reset' }));
}));

// Get all sessions (admin only)
router.get('/sessions/all', asyncHandler(async (req, res) => {
  const { adminId } = req.query;
  
  if (!['AG003', 'BP009'].includes(adminId)) {
    return res.status(403).json(
      ApiResponse.error('Admin access required', 403)
    );
  }
  
  const sessions = await supervisorManager.getAllActiveSessions();
  
  res.json(ApiResponse.success(sessions));
}));

export default router;
