// backend/routes/messageAPI.js
// API endpoints for Message Distribution Centre

import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';

const router = express.Router();

// Get active alerts suitable for messaging
router.get('/active-alerts', async (req, res) => {
  try {
    // This would integrate with your existing alert system
    // For now, returning mock data that matches real scenarios
    
    const mockAlerts = [
      {
        id: 'INC001',
        location: 'A19 Southbound, Tyne Tunnel approach',
        description: 'Multi-vehicle collision',
        severity: 'high',
        timestamp: new Date(),
        duration: '2-3 hours estimated',
        source: 'Traffic England',
        coordinates: { lat: 54.9785, lng: -1.5234 },
        status: 'active',
        affectedRoutes: ['1', '309', '310', '311'],
        lastUpdated: new Date()
      },
      {
        id: 'INC002',
        location: 'Newcastle City Centre, Grey Street',
        description: 'Gas leak emergency - road closure',
        severity: 'high',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        duration: 'Unknown',
        source: 'Emergency Services',
        coordinates: { lat: 54.9738, lng: -1.6131 },
        status: 'active',
        affectedRoutes: ['1', '12', '21', 'Q3', '56', '57'],
        lastUpdated: new Date()
      },
      {
        id: 'INC003',
        location: 'A184 Westbound, Felling',
        description: 'Broken down vehicle',
        severity: 'medium',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
        duration: '30-60 minutes',
        source: 'Traffic Monitoring',
        coordinates: { lat: 54.9514, lng: -1.5789 },
        status: 'active',
        affectedRoutes: ['27', '28', '28A'],
        lastUpdated: new Date()
      }
    ];

    res.json({
      success: true,
      alerts: mockAlerts,
      count: mockAlerts.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts'
    });
  }
});

// Get active roadworks suitable for messaging
router.get('/active-roadworks', async (req, res) => {
  try {
    // This would integrate with your existing StreetManager system
    // For now, returning mock data based on common scenarios
    
    const mockRoadworks = [
      {
        id: 'RW001',
        location: 'High Level Bridge, Newcastle',
        description: 'Police incident causing full closure',
        severity: 'high',
        startDate: new Date(),
        endDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        authority: 'Northumbria Police',
        coordinates: { lat: 54.9693, lng: -1.6102 },
        status: 'active',
        workType: 'emergency',
        affectedRoutes: ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94']
      },
      {
        id: 'RW002', 
        location: 'A1 Northbound, Team Valley',
        description: 'Lane closures for emergency repairs',
        severity: 'medium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        authority: 'National Highways',
        coordinates: { lat: 54.9245, lng: -1.6048 },
        status: 'active',
        workType: 'maintenance',
        affectedRoutes: ['21', 'X21', '309', '310', '311', '685']
      },
      {
        id: 'RW003',
        location: 'Central Station Bridge',
        description: 'Planned maintenance work',
        severity: 'low',
        startDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
        endDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours total
        authority: 'Newcastle City Council',
        coordinates: { lat: 54.9675, lng: -1.6125 },
        status: 'scheduled',
        workType: 'planned',
        affectedRoutes: ['10', '11', '12', '21', '56', '57', '58']
      },
      {
        id: 'RW004',
        location: 'A167 Durham Road, Gateshead',
        description: 'Water main replacement',
        severity: 'medium',
        startDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        endDate: new Date(Date.now() + 22 * 60 * 60 * 1000), // 24 hours total
        authority: 'Northumbrian Water',
        coordinates: { lat: 54.9345, lng: -1.6234 },
        status: 'active',
        workType: 'utilities',
        affectedRoutes: ['21', 'X21', '25', '28', '28A']
      }
    ];

    res.json({
      success: true,
      roadworks: mockRoadworks,
      count: mockRoadworks.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Error fetching active roadworks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active roadworks'
    });
  }
});

// Generate message from alert/roadwork
router.post('/generate', async (req, res) => {
  try {
    const { alertId, alertType, routes, supervisorBadge } = req.body;

    if (!alertId || !alertType) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and type are required'
      });
    }

    // This would integrate with your alert/roadwork data
    // For now, returning a structured response
    
    const generatedMessage = {
      id: `MSG_${Date.now()}`,
      alertId,
      alertType,
      routes: routes || [],
      generatedAt: new Date(),
      generatedBy: supervisorBadge || 'UNKNOWN',
      subject: `Generated message for ${alertType} ${alertId}`,
      content: `This is a generated message for ${alertType} alert ${alertId}`,
      priority: 'normal'
    };

    res.json({
      success: true,
      message: generatedMessage
    });

  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate message'
    });
  }
});

// Get message history
router.get('/history', async (req, res) => {
  try {
    const { supervisorBadge, limit = 50, offset = 0 } = req.query;

    // This would integrate with your Convex message history
    // For now, returning mock history data
    
    const mockHistory = [
      {
        id: 'MSG001',
        type: 'driver',
        subject: 'A1 Closure - All Services',
        content: 'A1 northbound closed at Team Valley. Use A19 diversion.',
        sentAt: new Date(Date.now() - 30 * 60 * 1000),
        sentBy: supervisorBadge || 'AG003',
        platform: 'ticketer',
        recipientCount: 45,
        alertSource: 'RW002'
      },
      {
        id: 'MSG002',
        type: 'customer',
        subject: 'Service 21 Delays',
        content: 'Minor delays on Service 21 due to congestion in Newcastle city centre.',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sentBy: supervisorBadge || 'AG003',
        platform: 'passenger-cloud',
        recipientCount: 0,
        alertSource: null
      }
    ];

    res.json({
      success: true,
      messages: mockHistory.slice(offset, offset + limit),
      total: mockHistory.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message history'
    });
  }
});

// Log message activity
router.post('/log', async (req, res) => {
  try {
    const { 
      type, 
      subject, 
      content, 
      platform, 
      supervisorBadge, 
      alertSource,
      routes 
    } = req.body;

    if (!type || !supervisorBadge) {
      return res.status(400).json({
        success: false,
        error: 'Message type and supervisor badge are required'
      });
    }

    // This would log to your Convex message history
    // For now, just acknowledge the log
    
    const logEntry = {
      id: `LOG_${Date.now()}`,
      type,
      subject,
      content,
      platform,
      supervisorBadge,
      alertSource,
      routes: routes || [],
      timestamp: new Date(),
      status: 'logged'
    };

    console.log('📨 Message logged:', logEntry);

    res.json({
      success: true,
      logId: logEntry.id,
      message: 'Message activity logged successfully'
    });

  } catch (error) {
    console.error('Error logging message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log message activity'
    });
  }
});

// Get route analysis for location
router.post('/analyze-routes', async (req, res) => {
  try {
    const { location, coordinates, radius = 500 } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    // This would integrate with your GTFS route analysis
    // For now, returning mock route suggestions based on common patterns
    
    const routeMap = {
      'High Level Bridge': ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
      'A1': ['21', 'X21', '309', '310', '311', '685'],
      'Central Station': ['10', '11', '12', '21', '56', '57', '58'],
      'A19': ['1', '309', '310', '311', '19'],
      'Grey Street': ['1', '12', '21', 'Q3', '56', '57'],
      'Team Valley': ['21', 'X21', '685'],
      'A167': ['21', 'X21', '25', '28', '28A'],
      'A184': ['27', '28', '28A']
    };

    const suggestions = [];
    Object.entries(routeMap).forEach(([locationKey, routes]) => {
      if (location.toLowerCase().includes(locationKey.toLowerCase())) {
        suggestions.push(...routes);
      }
    });

    // Remove duplicates and sort
    const uniqueSuggestions = [...new Set(suggestions)].sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return a.localeCompare(b);
    });

    res.json({
      success: true,
      location,
      suggestedRoutes: uniqueSuggestions.slice(0, 12), // Limit to 12
      confidence: suggestions.length > 0 ? 'high' : 'low',
      analysisMethod: 'location_keyword_matching'
    });

  } catch (error) {
    console.error('Error analyzing routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze routes'
    });
  }
});

export default router;