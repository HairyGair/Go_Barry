// backend/routes/disruptionWorkflowAPI.js
// AI-Powered Disruption Management Workflow API for Go Barry
// Provides comprehensive disruption management endpoints integrating AI services
import express from 'express';
import {
  initializeDisruptionAI,
  suggestDiversion,
  analyzePassengerImpact,
  getNetworkDisruptionInsights,
  getDisruptionAIStats
} from '../services/disruptionAI.js';

import {
  generateDisruptionMessages,
  generateSinglePlatformMessage,
  getMessageGeneratorStats
} from '../services/messageGenerator.js';

import disruptionLogger from '../services/disruptionLogger.js';

const router = express.Router();

/**
 * Initialize the AI disruption management system
 * GET /api/disruption/ai/initialize
 */
router.get('/ai/initialize', async (req, res) => {
  try {
    console.log('🤖 API: Initializing AI disruption management system...');
    const success = await initializeDisruptionAI();
    
    if (success) {
      const stats = getDisruptionAIStats();
      res.json({
        success: true,
        message: 'AI disruption management system initialized',
        stats: stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize AI disruption management system'
      });
    }
  } catch (error) {
    console.error('❌ AI initialization API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get AI-powered diversion suggestions
 * POST /api/disruption/ai/suggest-diversion
 * Body: {
 *   "affectedRoute": "21",
 *   "incidentLocation": "Durham Road, Gateshead", 
 *   "incidentType": "accident",
 *   "additionalInfo": { "estimatedDuration": 45, "severity": "high" }
 * }
 */
router.post('/ai/suggest-diversion', async (req, res) => {
  try {
    const { affectedRoute, incidentLocation, incidentType, additionalInfo } = req.body;
    
    // Validate required parameters
    if (!affectedRoute || !incidentLocation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: affectedRoute, incidentLocation',
        example: {
          affectedRoute: "21",
          incidentLocation: "Durham Road, Gateshead",
          incidentType: "accident",
          additionalInfo: { estimatedDuration: 45 }
        }
      });
    }
    
    console.log(`🔄 API: Generating AI diversion for route ${affectedRoute} at ${incidentLocation}`);
    
    const result = await suggestDiversion(
      affectedRoute,
      incidentLocation,
      incidentType || 'incident',
      additionalInfo || {}
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        availableRoutes: result.availableRoutes
      });
    }
  } catch (error) {
    console.error('❌ AI diversion suggestion API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate multi-platform disruption messages
 * POST /api/disruption/messages/generate
 * Body: {
 *   "incident": {
 *     "id": "INC_001",
 *     "route": "21",
 *     "type": "accident",
 *     "location": "Durham Road, Gateshead",
 *     "estimatedDelay": 15,
 *     "severity": "medium",
 *     "diversion": { "diversionVia": ["A167", "Chester Road"] },
 *     "alternativeRoutes": ["22", "X21"]
 *   }
 * }
 */
router.post('/messages/generate', async (req, res) => {
  try {
    const { incident, options } = req.body;
    
    // Validate incident data
    if (!incident || !incident.route) {
      return res.status(400).json({
        success: false,
        error: 'Missing required incident data: route is required',
        example: {
          incident: {
            route: "21",
            type: "accident",
            location: "Durham Road, Gateshead",
            estimatedDelay: 15
          }
        }
      });
    }
    
    console.log(`📝 API: Generating messages for ${incident.type} on route ${incident.route}`);
    
    const result = await generateDisruptionMessages(incident, options || {});
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        fallbackMessages: result.fallbackMessages
      });
    }
  } catch (error) {
    console.error('❌ Message generation API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate message for a specific platform
 * POST /api/disruption/messages/platform/:platform
 * Platforms: ticketer, blink_display, passenger_cloud, social_media, driver_notification, website_banner
 */
router.post('/messages/platform/:platform', async (req, res) => {
  try {
    const platform = req.params.platform;
    const { incident, options } = req.body;
    
    if (!incident || !incident.route) {
      return res.status(400).json({
        success: false,
        error: 'Missing required incident data: route is required'
      });
    }
    
    console.log(`📱 API: Generating ${platform} message for route ${incident.route}`);
    
    const result = await generateSinglePlatformMessage(incident, platform, options || {});
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        platform: platform,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Single platform message API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze passenger impact for a disruption
 * POST /api/disruption/ai/passenger-impact
 * Body: {
 *   "affectedRoute": "21",
 *   "incidentLocation": "Durham Road, Gateshead",
 *   "estimatedDuration": 45
 * }
 */
router.post('/ai/passenger-impact', async (req, res) => {
  try {
    const { affectedRoute, incidentLocation, estimatedDuration } = req.body;
    
    if (!affectedRoute || !incidentLocation || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: affectedRoute, incidentLocation, estimatedDuration',
        example: {
          affectedRoute: "21",
          incidentLocation: "Durham Road, Gateshead", 
          estimatedDuration: 45
        }
      });
    }
    
    console.log(`👥 API: Analyzing passenger impact for route ${affectedRoute}`);
    
    const result = await analyzePassengerImpact(affectedRoute, incidentLocation, estimatedDuration);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Passenger impact analysis API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get network-wide disruption insights
 * POST /api/disruption/ai/network-insights
 * Body: {
 *   "currentDisruptions": [
 *     { "route": "21", "type": "accident", "severity": "high" },
 *     { "route": "22", "type": "breakdown", "severity": "medium" }
 *   ]
 * }
 */
router.post('/ai/network-insights', async (req, res) => {
  try {
    const { currentDisruptions } = req.body;
    
    console.log(`🌐 API: Analyzing network-wide disruption insights for ${(currentDisruptions || []).length} disruptions`);
    
    const result = await getNetworkDisruptionInsights(currentDisruptions || []);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.insights,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Network insights API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Complete disruption workflow - AI analysis + message generation + logging
 * POST /api/disruption/workflow/complete
 * Body: {
 *   "incident": {
 *     "route": "21",
 *     "type": "accident",
 *     "location": "Durham Road, Gateshead",
 *     "estimatedDelay": 15,
 *     "severity": "medium",
 *     "supervisor_id": "SUP001",
 *     "supervisor_name": "John Smith"
 *   },
 *   "generateMessages": true,
 *   "suggestDiversion": true,
 *   "logDisruption": false
 * }
 */
router.post('/workflow/complete', async (req, res) => {
  try {
    const { incident, generateMessages, suggestDiversion, logDisruption } = req.body;
    
    if (!incident || !incident.route) {
      return res.status(400).json({
        success: false,
        error: 'Missing required incident data: route is required'
      });
    }
    
    console.log(`🔄 API: Running complete disruption workflow for route ${incident.route}`);
    
    const workflow = {
      incident: incident,
      timestamp: new Date().toISOString(),
      results: {}
    };
    
    // Step 1: Generate AI diversion suggestions
    if (suggestDiversion && incident.location) {
      try {
        workflow.results.diversionAnalysis = await suggestDiversion(
          incident.route,
          incident.location,
          incident.type || 'incident',
          { 
            estimatedDuration: incident.estimatedDelay || 30,
            severity: incident.severity || 'medium'
          }
        );
      } catch (error) {
        workflow.results.diversionAnalysis = { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    // Step 2: Generate multi-platform messages
    if (generateMessages) {
      try {
        // Use diversion data if available
        const enrichedIncident = {
          ...incident,
          diversion: workflow.results.diversionAnalysis?.success ? 
            workflow.results.diversionAnalysis.recommendedDiversion : null
        };
        
        workflow.results.messages = await generateDisruptionMessages(enrichedIncident);
      } catch (error) {
        workflow.results.messages = { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    // Step 3: Analyze passenger impact
    if (incident.location) {
      try {
        workflow.results.passengerImpact = await analyzePassengerImpact(
          incident.route,
          incident.location,
          incident.estimatedDelay || 30
        );
      } catch (error) {
        workflow.results.passengerImpact = { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    // Step 4: Log disruption if requested and supervisor info provided
    if (logDisruption && incident.supervisor_id) {
      try {
        const logData = {
          title: `${incident.type} on Route ${incident.route}`,
          description: `${incident.type} at ${incident.location}`,
          type: incident.type,
          location: incident.location,
          supervisor_id: incident.supervisor_id,
          supervisor_name: incident.supervisor_name,
          affected_routes: [incident.route],
          severity_level: incident.severity || 'medium',
          resolution_time_minutes: incident.estimatedDelay,
          actions_taken: workflow.results.diversionAnalysis?.success ? 
            `Diversion implemented: ${workflow.results.diversionAnalysis.recommendedDiversion.diversionVia.join(' > ')}` : 
            'Manual disruption management',
          disruption_started: new Date().toISOString()
        };
        
        workflow.results.logging = await disruptionLogger.logDisruption(logData);
      } catch (error) {
        workflow.results.logging = { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    // Calculate overall workflow success
    const workflowSuccess = Object.values(workflow.results).every(result => 
      !result.hasOwnProperty('success') || result.success
    );
    
    res.json({
      success: workflowSuccess,
      workflow: workflow,
      summary: {
        diversionSuggested: !!workflow.results.diversionAnalysis?.success,
        messagesGenerated: !!workflow.results.messages?.success,
        passengerImpactAnalyzed: !!workflow.results.passengerImpact?.success,
        disruptionLogged: !!workflow.results.logging?.success,
        aiConfidence: workflow.results.diversionAnalysis?.aiConfidence || null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Complete workflow API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get AI and message generation system statistics
 * GET /api/disruption/stats
 */
router.get('/stats', (req, res) => {
  try {
    console.log('📊 API: Getting disruption management system stats');
    
    const aiStats = getDisruptionAIStats();
    const messageStats = getMessageGeneratorStats();
    
    res.json({
      success: true,
      stats: {
        ai: aiStats,
        messageGeneration: messageStats,
        integration: {
          disruptionLogging: 'available',
          routeVisualization: 'integrated',
          serviceFrequency: 'integrated'
        },
        workflow: {
          completeWorkflowAvailable: true,
          platformsSupported: messageStats.supportedPlatforms.length,
          aiFeatures: [
            'route_diversion_suggestions',
            'passenger_impact_analysis', 
            'network_insights',
            'multi_platform_messaging'
          ]
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Disruption stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for disruption management services
 * GET /api/disruption/health
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🔍 API: Health check for disruption management services');
    
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // Check AI service
    try {
      const aiStats = getDisruptionAIStats();
      health.services.ai = {
        status: aiStats.initialized ? 'healthy' : 'not_initialized',
        initialized: aiStats.initialized,
        routeNetworkSize: aiStats.routeNetworkSize
      };
    } catch (error) {
      health.services.ai = { status: 'error', error: error.message };
    }
    
    // Check message generation service
    try {
      const messageStats = getMessageGeneratorStats();
      health.services.messageGeneration = {
        status: 'healthy',
        supportedPlatforms: messageStats.supportedPlatforms.length
      };
    } catch (error) {
      health.services.messageGeneration = { status: 'error', error: error.message };
    }
    
    // Check disruption logger
    try {
      const loggerHealth = await disruptionLogger.healthCheck();
      health.services.disruptionLogger = loggerHealth;
    } catch (error) {
      health.services.disruptionLogger = { status: 'error', error: error.message };
    }
    
    // Overall health status
    const allServicesHealthy = Object.values(health.services).every(service => 
      service.status === 'healthy' || service.status === 'offline'
    );
    
    health.overallStatus = allServicesHealthy ? 'healthy' : 'degraded';
    
    res.json({
      success: true,
      health: health
    });
    
  } catch (error) {
    console.error('❌ Health check API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get example request bodies for API endpoints
 * GET /api/disruption/examples
 */
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    examples: {
      suggestDiversion: {
        endpoint: 'POST /api/disruption/ai/suggest-diversion',
        body: {
          affectedRoute: "21",
          incidentLocation: "Durham Road, Gateshead",
          incidentType: "accident",
          additionalInfo: {
            estimatedDuration: 45,
            severity: "high"
          }
        }
      },
      generateMessages: {
        endpoint: 'POST /api/disruption/messages/generate',
        body: {
          incident: {
            id: "INC_001",
            route: "21",
            type: "accident",
            location: "Durham Road, Gateshead",
            estimatedDelay: 15,
            severity: "medium",
            diversion: {
              diversionVia: ["A167", "Chester Road"]
            },
            alternativeRoutes: ["22", "X21"]
          }
        }
      },
      completeWorkflow: {
        endpoint: 'POST /api/disruption/workflow/complete',
        body: {
          incident: {
            route: "21",
            type: "accident", 
            location: "Durham Road, Gateshead",
            estimatedDelay: 15,
            severity: "medium",
            supervisor_id: "SUP001",
            supervisor_name: "John Smith"
          },
          generateMessages: true,
          suggestDiversion: true,
          logDisruption: false
        }
      }
    },
    availablePlatforms: [
      'ticketer',
      'blink_display', 
      'passenger_cloud',
      'social_media',
      'driver_notification',
      'website_banner'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
