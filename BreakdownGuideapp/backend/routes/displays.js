/**
 * Display Control API Routes
 * Manage remote control of engineering displays
 *
 * Allows managers and SDC operators to:
 * - View active displays
 * - Control display filters
 * - Highlight specific breakdowns
 * - Change depot views
 * - Force display refresh
 */

import express from 'express';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

// =====================================================
// DISPLAY INFORMATION ENDPOINTS
// =====================================================

/**
 * GET /api/displays/active
 * Get list of all active displays
 */
router.get('/active', (req, res) => {
  try {
    const displays = webSocketHandler.getActiveDisplays();

    res.json({
      success: true,
      count: displays.length,
      displays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching active displays:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active displays',
      message: error.message
    });
  }
});

/**
 * GET /api/displays/depot/:depot
 * Get displays for a specific depot
 */
router.get('/depot/:depot', (req, res) => {
  try {
    const { depot } = req.params;
    const displays = webSocketHandler.getDisplaysByDepot(depot);

    res.json({
      success: true,
      depot,
      count: displays.length,
      displays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching displays for depot ${req.params.depot}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot displays',
      message: error.message
    });
  }
});

/**
 * GET /api/displays/:displayId
 * Get information about a specific display
 */
router.get('/:displayId', (req, res) => {
  try {
    const { displayId } = req.params;
    const display = webSocketHandler.getDisplayInfo(displayId);

    if (!display) {
      return res.status(404).json({
        success: false,
        error: 'Display not found',
        displayId
      });
    }

    res.json({
      success: true,
      display,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching display ${req.params.displayId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch display information',
      message: error.message
    });
  }
});

// =====================================================
// DISPLAY CONTROL ENDPOINTS
// =====================================================

/**
 * POST /api/displays/control
 * Send control command to one or more displays
 *
 * Body examples:
 * 1. Highlight breakdown:
 *    { displayId: 'yard1', command: 'highlight', breakdownId: 'BRK-20251106-001' }
 *
 * 2. Change filters:
 *    { displayId: 'yard1', command: 'filter', filters: { status: ['pending'], depot: 'Washington' } }
 *
 * 3. Change depot:
 *    { displayId: 'yard1', command: 'change_depot', depot: 'Riverside' }
 *
 * 4. Force refresh:
 *    { displayId: 'yard1', command: 'refresh' }
 *
 * 5. Broadcast to all displays in depot:
 *    { depot: 'Washington', command: 'refresh' }
 */
router.post('/control', (req, res) => {
  try {
    const { displayId, depot, command, breakdownId, filters, ...otherParams } = req.body;

    // Validation
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
        validCommands: ['highlight', 'filter', 'change_depot', 'refresh']
      });
    }

    if (!displayId && !depot) {
      return res.status(400).json({
        success: false,
        error: 'Either displayId or depot is required'
      });
    }

    let success = false;
    let result = {};

    // Handle depot-wide broadcasts
    if (depot && !displayId) {
      console.log(`📡 Broadcasting ${command} to all displays in ${depot}`);

      let commandObject = { type: `display_${command}` };

      switch (command) {
        case 'refresh':
          commandObject.action = 'refresh';
          break;
        case 'filter':
          if (!filters) {
            return res.status(400).json({
              success: false,
              error: 'Filters required for filter command'
            });
          }
          commandObject.filters = filters;
          break;
        case 'change_depot':
          if (!otherParams.newDepot) {
            return res.status(400).json({
              success: false,
              error: 'newDepot required for change_depot command'
            });
          }
          commandObject.depot = otherParams.newDepot;
          break;
        case 'highlight':
          if (!breakdownId) {
            return res.status(400).json({
              success: false,
              error: 'breakdownId required for highlight command'
            });
          }
          commandObject.breakdownId = breakdownId;
          commandObject.action = 'highlight';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid command',
            validCommands: ['highlight', 'filter', 'change_depot', 'refresh']
          });
      }

      const count = webSocketHandler.broadcastToDepotDisplays(depot, commandObject);
      success = count > 0;
      result = {
        depot,
        displaysNotified: count,
        command
      };
    }
    // Handle single display commands
    else if (displayId) {
      console.log(`🎯 Sending ${command} to display ${displayId}`);

      switch (command) {
        case 'highlight':
          if (!breakdownId) {
            return res.status(400).json({
              success: false,
              error: 'breakdownId is required for highlight command'
            });
          }
          success = webSocketHandler.displayHighlight(displayId, breakdownId);
          result = { displayId, command, breakdownId };
          break;

        case 'filter':
          if (!filters) {
            return res.status(400).json({
              success: false,
              error: 'filters object is required for filter command'
            });
          }
          success = webSocketHandler.displayChangeFilters(displayId, filters);
          result = { displayId, command, filters };
          break;

        case 'change_depot':
          const newDepot = depot || otherParams.newDepot;
          if (!newDepot) {
            return res.status(400).json({
              success: false,
              error: 'depot or newDepot is required for change_depot command'
            });
          }
          success = webSocketHandler.displayChangeDepot(displayId, newDepot);
          result = { displayId, command, depot: newDepot };
          break;

        case 'refresh':
          success = webSocketHandler.displayRefresh(displayId);
          result = { displayId, command };
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid command',
            validCommands: ['highlight', 'filter', 'change_depot', 'refresh']
          });
      }
    }

    if (success) {
      res.json({
        success: true,
        message: 'Command sent successfully',
        result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Display not found or command failed',
        result
      });
    }

  } catch (error) {
    console.error('Error sending display control command:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send control command',
      message: error.message
    });
  }
});

/**
 * POST /api/displays/:displayId/highlight
 * Shorthand endpoint to highlight a breakdown on a specific display
 */
router.post('/:displayId/highlight', (req, res) => {
  try {
    const { displayId } = req.params;
    const { breakdownId } = req.body;

    if (!breakdownId) {
      return res.status(400).json({
        success: false,
        error: 'breakdownId is required'
      });
    }

    const success = webSocketHandler.displayHighlight(displayId, breakdownId);

    if (success) {
      res.json({
        success: true,
        message: 'Breakdown highlighted on display',
        displayId,
        breakdownId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Display not found',
        displayId
      });
    }
  } catch (error) {
    console.error('Error highlighting breakdown on display:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to highlight breakdown',
      message: error.message
    });
  }
});

/**
 * POST /api/displays/:displayId/refresh
 * Shorthand endpoint to force refresh a specific display
 */
router.post('/:displayId/refresh', (req, res) => {
  try {
    const { displayId } = req.params;
    const success = webSocketHandler.displayRefresh(displayId);

    if (success) {
      res.json({
        success: true,
        message: 'Display refresh command sent',
        displayId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Display not found',
        displayId
      });
    }
  } catch (error) {
    console.error('Error refreshing display:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh display',
      message: error.message
    });
  }
});

/**
 * PUT /api/displays/:displayId/filters
 * Update filters for a specific display
 */
router.put('/:displayId/filters', (req, res) => {
  try {
    const { displayId } = req.params;
    const { filters } = req.body;

    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid filters object is required',
        example: { status: ['pending', 'in-progress'], depot: 'Washington' }
      });
    }

    const success = webSocketHandler.displayChangeFilters(displayId, filters);

    if (success) {
      res.json({
        success: true,
        message: 'Display filters updated',
        displayId,
        filters,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Display not found',
        displayId
      });
    }
  } catch (error) {
    console.error('Error updating display filters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update filters',
      message: error.message
    });
  }
});

/**
 * PUT /api/displays/:displayId/depot
 * Change which depot a display shows
 */
router.put('/:displayId/depot', (req, res) => {
  try {
    const { displayId } = req.params;
    const { depot } = req.body;

    if (!depot) {
      return res.status(400).json({
        success: false,
        error: 'depot is required'
      });
    }

    const success = webSocketHandler.displayChangeDepot(displayId, depot);

    if (success) {
      res.json({
        success: true,
        message: 'Display depot changed',
        displayId,
        depot,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Display not found',
        displayId
      });
    }
  } catch (error) {
    console.error('Error changing display depot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change depot',
      message: error.message
    });
  }
});

// =====================================================
// DEPOT-WIDE CONTROL ENDPOINTS
// =====================================================

/**
 * POST /api/displays/depot/:depot/refresh
 * Refresh all displays in a specific depot
 */
router.post('/depot/:depot/refresh', (req, res) => {
  try {
    const { depot } = req.params;
    const count = webSocketHandler.broadcastToDepotDisplays(depot, {
      type: 'display_refresh',
      action: 'refresh'
    });

    if (count > 0) {
      res.json({
        success: true,
        message: `Refresh sent to ${count} display(s)`,
        depot,
        displaysNotified: count,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No displays found for depot',
        depot
      });
    }
  } catch (error) {
    console.error('Error refreshing depot displays:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh depot displays',
      message: error.message
    });
  }
});

/**
 * POST /api/displays/depot/:depot/highlight
 * Highlight a breakdown on all displays in a depot
 */
router.post('/depot/:depot/highlight', (req, res) => {
  try {
    const { depot } = req.params;
    const { breakdownId } = req.body;

    if (!breakdownId) {
      return res.status(400).json({
        success: false,
        error: 'breakdownId is required'
      });
    }

    const count = webSocketHandler.broadcastToDepotDisplays(depot, {
      type: 'display_highlight',
      breakdownId,
      action: 'highlight'
    });

    if (count > 0) {
      res.json({
        success: true,
        message: `Highlight sent to ${count} display(s)`,
        depot,
        breakdownId,
        displaysNotified: count,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No displays found for depot',
        depot
      });
    }
  } catch (error) {
    console.error('Error highlighting breakdown on depot displays:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to highlight breakdown',
      message: error.message
    });
  }
});

export default router;
