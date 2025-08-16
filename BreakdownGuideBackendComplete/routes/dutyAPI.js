// backend/routes/dutyAPI.js
// Duty Management API for Go BARRY
// Tracks supervisor duty periods and operations

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';
import supervisorActivityLogger from '../services/supervisorActivityLogger.js';

const router = express.Router();

// In-memory duty storage (in production, use Supabase)
const activeDuties = new Map(); // supervisorId -> duty info

// Updated duty numbers for Go North East
const DUTY_NUMBERS = {
  // Standard duties
  100: { name: 'Early Morning Duty', startTime: '05:15', endTime: '14:45', days: 'Mon-Fri' },
  '100-weekend': { name: 'Early Morning Duty (Weekend)', startTime: '06:00', endTime: '15:30', days: 'Sat-Sun' },
  200: { name: 'Daytime Duty', startTime: '07:30', endTime: '17:00' },
  400: { name: 'Afternoon/Evening Duty', startTime: '12:30', endTime: '22:00' },
  500: { name: 'Late Evening Duty', startTime: '14:45', endTime: '00:15' },
  
  // Special duty
  'XOps': { name: 'Ops Support', startTime: 'Variable', endTime: 'Variable', description: 'Whenever Ops Support is Required' }
};

// POST /api/duty/start - Start a duty period
router.post('/start', async (req, res) => {
  try {
    const { sessionId, dutyNumber } = req.body;

    if (!sessionId || !dutyNumber) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and duty number are required'
      });
    }

    // Validate supervisor session
    const sessionValidation = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Check if supervisor already has an active duty
    if (activeDuties.has(supervisor.id)) {
      const currentDuty = activeDuties.get(supervisor.id);
      return res.status(400).json({
        success: false,
        error: `Already on duty ${currentDuty.dutyNumber} since ${new Date(currentDuty.startTime).toLocaleTimeString()}`,
        currentDuty
      });
    }

    // Get duty details
    const dutyInfo = DUTY_NUMBERS[dutyNumber] || { 
      name: `Custom Duty ${dutyNumber}`, 
      startTime: 'Custom', 
      endTime: 'Custom' 
    };

    // Create duty record
    const duty = {
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      supervisorBadge: supervisor.badge,
      dutyNumber: parseInt(dutyNumber),
      dutyName: dutyInfo.name,
      scheduledStart: dutyInfo.startTime,
      scheduledEnd: dutyInfo.endTime,
      actualStart: new Date().toISOString(),
      actualEnd: null,
      status: 'active'
    };

    // Store active duty
    activeDuties.set(supervisor.id, duty);

    // Log duty start
    await supervisorActivityLogger.logDutyStart(
      supervisor.badge,
      supervisor.name,
      dutyNumber
    );

    console.log(`✅ ${supervisor.name} started duty ${dutyNumber} - ${dutyInfo.name}`);

    res.json({
      success: true,
      message: `Started duty ${dutyNumber} - ${dutyInfo.name}`,
      duty
    });

  } catch (error) {
    console.error('❌ Duty start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start duty'
    });
  }
});

// POST /api/duty/end - End current duty
router.post('/end', async (req, res) => {
  try {
    const { sessionId, notes } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Validate supervisor session
    const sessionValidation = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Check if supervisor has an active duty
    if (!activeDuties.has(supervisor.id)) {
      return res.status(400).json({
        success: false,
        error: 'No active duty found'
      });
    }

    // Get and end duty
    const duty = activeDuties.get(supervisor.id);
    duty.actualEnd = new Date().toISOString();
    duty.status = 'completed';
    duty.endNotes = notes || '';

    // Calculate duration
    const startTime = new Date(duty.actualStart);
    const endTime = new Date(duty.actualEnd);
    const durationMs = endTime - startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    duty.duration = `${hours}h ${minutes}m`;

    // Remove from active duties
    activeDuties.delete(supervisor.id);

    // Log duty end
    await supervisorActivityLogger.logDutyEnd(
      supervisor.badge,
      supervisor.name,
      duty.dutyNumber
    );

    console.log(`✅ ${supervisor.name} ended duty ${duty.dutyNumber} - Duration: ${duty.duration}`);

    res.json({
      success: true,
      message: `Ended duty ${duty.dutyNumber} after ${duty.duration}`,
      duty
    });

  } catch (error) {
    console.error('❌ Duty end error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end duty'
    });
  }
});

// GET /api/duty/status - Get current duty status for a supervisor
router.get('/status', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Validate supervisor session
    const sessionValidation = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Check for active duty
    const activeDuty = activeDuties.get(supervisor.id);

    res.json({
      success: true,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge
      },
      activeDuty: activeDuty || null,
      onDuty: !!activeDuty
    });

  } catch (error) {
    console.error('❌ Duty status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get duty status'
    });
  }
});

// GET /api/duty/active - Get all supervisors on duty
router.get('/active', async (req, res) => {
  try {
    const activeDutiesList = Array.from(activeDuties.values())
      .map(duty => ({
        supervisorId: duty.supervisorId,
        supervisorName: duty.supervisorName,
        supervisorBadge: duty.supervisorBadge,
        dutyNumber: duty.dutyNumber,
        dutyName: duty.dutyName,
        startTime: duty.actualStart,
        duration: calculateDuration(duty.actualStart)
      }));

    res.json({
      success: true,
      activeDuties: activeDutiesList,
      count: activeDutiesList.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get active duties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active duties'
    });
  }
});

// GET /api/duty/types - Get available duty types
router.get('/types', async (req, res) => {
  try {
    const dutyTypes = Object.entries(DUTY_NUMBERS).map(([number, info]) => ({
      dutyNumber: parseInt(number),
      name: info.name,
      scheduledStart: info.startTime,
      scheduledEnd: info.endTime
    }));

    res.json({
      success: true,
      dutyTypes,
      count: dutyTypes.length
    });

  } catch (error) {
    console.error('❌ Get duty types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get duty types'
    });
  }
});

// Helper function to calculate duration
function calculateDuration(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const durationMs = now - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default router;
