/*
 * Go Barry - VoIP API Routes
 * Handles 8x8 VoIP integration endpoints
 */

import express from 'express';
import { voipService } from '../services/communications/voipService.js';
import { authenticateSupervisor } from '../middleware/communicationsAuth.js';
import { validateRequest } from '../middleware/requestValidator.js';

const router = express.Router();

// Get call history for supervisor
router.get('/history',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const supervisorId = req.supervisor.id;
      const result = await voipService.getCallHistory(supervisorId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get contacts for supervisor
router.get('/contacts',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const supervisorId = req.supervisor.id;
      const result = await voipService.getContacts(supervisorId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Search contacts
router.get('/contacts/search',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { query } = req.query;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }
      
      const result = await voipService.searchContacts(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Add new contact
router.post('/contacts',
  authenticateSupervisor,
  validateRequest({
    body: {
      name: { type: 'string', required: true },
      number: { type: 'string', required: true },
      department: { type: 'string' },
      email: { type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const result = await voipService.addContact(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Make a call
router.post('/call',
  authenticateSupervisor,
  validateRequest({
    body: {
      to: { type: 'string', required: true },
      from: { type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const supervisorId = req.supervisor.id;
      const callData = {
        ...req.body,
        supervisorId,
        from: req.body.from || req.supervisor.phoneNumber || '+441912775000'
      };
      
      const result = await voipService.makeCall(callData);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// End a call
router.post('/call/:sessionId/end',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const result = await voipService.endCall(sessionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Update call status
router.put('/call/:sessionId/status',
  authenticateSupervisor,
  validateRequest({
    body: {
      status: { 
        type: 'string', 
        required: true,
        enum: ['initiating', 'ringing', 'connected', 'on-hold', 'ended']
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      const result = await voipService.updateCallStatus(sessionId, status);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get active call for supervisor
router.get('/call/active',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const supervisorId = req.supervisor.id;
      const result = await voipService.getActiveCall(supervisorId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get call statistics
router.get('/statistics',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const supervisorId = req.supervisor.id;
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      };
      
      const result = await voipService.getCallStatistics(supervisorId, dateRange);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Health check
router.get('/health',
  async (req, res, next) => {
    try {
      const health = await voipService.healthCheck();
      res.json({
        success: true,
        ...health
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;