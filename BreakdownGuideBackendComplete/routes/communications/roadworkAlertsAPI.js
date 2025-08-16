import express from 'express';
import { RoadworkAlertService } from '../../services/communications/roadworkAlertService.js';
import { EmailGroupService } from '../../services/communications/emailGroupService.js';

const router = express.Router();
const roadworkAlertService = new RoadworkAlertService();
const emailGroupService = new EmailGroupService();

// Get all roadwork alerts
router.get('/', async (req, res) => {
  try {
    const { status, priority, supervisorId, limit = 50 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (supervisorId) filters.supervisorId = supervisorId;
    
    const alerts = await roadworkAlertService.getAlerts(filters, parseInt(limit));
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('❌ Error fetching roadwork alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create roadwork alert
router.post('/', async (req, res) => {
  try {
    const {
      location,
      description,
      severity,
      priority,
      scheduledStart,
      scheduledEnd,
      affectedRoutes,
      emailGroups,
      supervisorId,
      supervisorName
    } = req.body;
    
    // Validation
    if (!location || !description || !severity || !priority) {
      return res.status(400).json({ 
        success: false, 
        error: 'Location, description, severity, and priority are required' 
      });
    }
    
    if (!supervisorId || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor information required' 
      });
    }

    // Create alert
    const alert = await roadworkAlertService.createAlert({
      location,
      description,
      severity,
      priority,
      scheduledStart,
      scheduledEnd,
      affectedRoutes: affectedRoutes || [],
      status: 'reported',
      supervisorId,
      supervisorName,
      createdAt: new Date().toISOString()
    });

    // Send email notifications if groups specified
    if (emailGroups && emailGroups.length > 0) {
      try {
        await roadworkAlertService.sendNotification(alert.id, emailGroups);
        alert.notificationSent = true;
        alert.notifiedGroups = emailGroups;
      } catch (emailError) {
        console.error('⚠️ Email notification failed:', emailError);
        // Don't fail the whole request if email fails
        alert.notificationSent = false;
        alert.notificationError = emailError.message;
      }
    }

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error('❌ Error creating roadwork alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update roadwork status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes, supervisorId, supervisorName } = req.body;
    
    if (!status || !supervisorId || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status and supervisor information required' 
      });
    }

    const validStatuses = ['reported', 'assessing', 'planning', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const updated = await roadworkAlertService.updateStatus(
      req.params.id,
      status,
      supervisorId,
      supervisorName,
      notes
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating roadwork status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send/resend notification
router.post('/:id/notify', async (req, res) => {
  try {
    const { emailGroups, supervisorId, supervisorName } = req.body;
    
    if (!emailGroups || !Array.isArray(emailGroups) || emailGroups.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email groups array required' 
      });
    }

    if (!supervisorId || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supervisor information required' 
      });
    }

    const result = await roadworkAlertService.sendNotification(
      req.params.id,
      emailGroups,
      supervisorId,
      supervisorName
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await roadworkAlertService.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('❌ Error fetching alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available email groups (convenience endpoint)
router.get('/email-groups/available', async (req, res) => {
  try {
    const groups = await emailGroupService.getActiveGroups();
    const simplified = groups.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.members.length
    }));
    res.json({ success: true, data: simplified });
  } catch (error) {
    console.error('❌ Error fetching email groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
