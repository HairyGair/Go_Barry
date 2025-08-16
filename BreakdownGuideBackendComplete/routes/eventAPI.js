// backend/routes/eventAPI.js
// API routes for major event monitoring

import express from 'express';
import eventMonitor from '../services/eventMonitor.js';

const router = express.Router();

// Get active events
router.get('/active', async (req, res) => {
  try {
    const activeEvents = await eventMonitor.getActiveEvents();
    res.json(activeEvents);
  } catch (error) {
    console.error('Error getting active events:', error);
    res.status(500).json({ 
      error: 'Failed to get active events',
      message: error.message 
    });
  }
});

// Get all events
router.get('/all', async (req, res) => {
  try {
    const events = await eventMonitor.getAllEvents();
    res.json({ events });
  } catch (error) {
    console.error('Error getting all events:', error);
    res.status(500).json({ 
      error: 'Failed to get events',
      message: error.message 
    });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const events = await eventMonitor.getUpcomingEvents();
    res.json({ events });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ 
      error: 'Failed to get upcoming events',
      message: error.message 
    });
  }
});

// Get event categories
router.get('/categories', (req, res) => {
  const categories = eventMonitor.constructor.getEventCategories();
  res.json({ categories });
});

// Add new event
router.post('/create', async (req, res) => {
  try {
    const { 
      event, 
      venue, 
      location, 
      startTime, 
      endTime, 
      category, 
      severity,
      description,
      affectedRoutes 
    } = req.body;

    // Validate required fields
    if (!event || !venue || !startTime || !endTime || !category) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['event', 'venue', 'startTime', 'endTime', 'category']
      });
    }

    // Check for conflicts
    const conflicts = await eventMonitor.checkEventConflicts({ 
      venue, 
      location, 
      startTime, 
      endTime 
    });
    
    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Event conflicts detected',
        conflicts 
      });
    }

    const newEvent = await eventMonitor.addEvent({
      event,
      venue,
      location: location || venue,
      startTime,
      endTime,
      category,
      severity: severity || 'MEDIUM',
      description,
      affectedRoutes: affectedRoutes || [],
      time: new Date(startTime).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });

    res.status(201).json({ 
      success: true, 
      event: newEvent 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      message: error.message 
    });
  }
});

// Update event
router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const updatedEvent = await eventMonitor.updateEvent(eventId, updates);
    res.json({ 
      success: true, 
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({ 
      error: 'Failed to update event',
      message: error.message 
    });
  }
});

// Delete event
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const deleted = await eventMonitor.deleteEvent(eventId);
    res.json({ 
      success: true, 
      event: deleted 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({ 
      error: 'Failed to delete event',
      message: error.message 
    });
  }
});

// Check for event conflicts
router.post('/check-conflicts', async (req, res) => {
  try {
    const eventData = req.body;
    const conflicts = await eventMonitor.checkEventConflicts(eventData);
    res.json({ 
      hasConflicts: conflicts.length > 0,
      conflicts 
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ 
      error: 'Failed to check conflicts',
      message: error.message 
    });
  }
});

export default router;