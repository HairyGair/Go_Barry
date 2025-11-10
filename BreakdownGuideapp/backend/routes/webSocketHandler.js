/**
 * WebSocket Handler for Real-time Breakdown Updates
 * Manages WebSocket connections and broadcasts real-time updates to SDC Dashboard
 *
 * MIGRATED TO MYSQL - Replaced Supabase real-time subscriptions with MySQL queries
 */

import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { from, query } from '../utils/queryHelpers.js';
import { activityLogger } from '../services/activityLogger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data file paths
const BREAKDOWN_COUNTER_PATH = join(__dirname, '../data/breakdown-counter.json');

class WebSocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.channels = new Map();
    this.lastActivityTimestamp = null;
    this.fileWatchers = new Map();

    // Display Management
    this.displays = new Map(); // Track registered displays: displayId -> { clientId, depot, filters, registeredAt, lastSeen }
    this.displaysByDepot = new Map(); // Track displays by depot: depot -> Set<displayId>
  }

  // Initialize WebSocket server
  initialize(server) {
    console.log('🔌 Initializing WebSocket server for real-time breakdown updates');

    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    // DISABLED: File watchers can trigger WebAssembly issues on shared hosting
    // File watchers are not critical for API functionality
    // this.setupFileWatchers();

    console.log('✅ WebSocket server initialized (file watchers disabled for shared hosting)');
  }

  // Handle new WebSocket connection
  async handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const url = new URL(request.url, `http://${request.headers.host}`);

    // Extract channel from path (e.g., /ws/sdc-dashboard) or query parameter
    const pathParts = url.pathname.split('/').filter(Boolean);
    const channel = url.searchParams.get('channel') ||
                   (pathParts.length > 1 ? pathParts[1] : 'general');
    const token = url.searchParams.get('token');

    console.log(`🔗 New WebSocket connection attempt: ${clientId} on channel: ${channel}`);

    // Authenticate WebSocket connection - ALWAYS required
    let user = null;
    let supervisor = null;

    // Protected channels require authentication (control-room, defect-intelligence, and engineering-display are public)
    const protectedChannels = ['sdc-dashboard', 'breakdowns', 'assessment-progress'];
    const publicChannels = ['control-room', 'defect-intelligence', 'engineering-display'];

    if (protectedChannels.includes(channel)) {
      if (!token) {
          console.warn(`❌ WebSocket authentication required for channel: ${channel}`);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Authentication required for this channel',
            code: 'WS_AUTH_REQUIRED',
            timestamp: new Date().toISOString()
          }));
          ws.close();
          return;
      }

      // Verify token with MySQL (replaced Supabase auth)
      try {
        // Verify JWT token using middleware helper
        const decoded = await verifyToken(token);

        if (!decoded || !decoded.email) {
          console.warn(`❌ Invalid WebSocket authentication token for channel: ${channel}`);

          // Log security event
          const securityEvent = {
            eventType: 'unauthorized_websocket_access',
            timestamp: new Date().toISOString(),
            channel: channel,
            ip: request.socket.remoteAddress,
            userAgent: request.headers['user-agent'],
            error: 'Invalid token'
          };
          console.log('🔒 Security Alert:', JSON.stringify(securityEvent, null, 2));

          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid or expired authentication token',
            code: 'WS_AUTH_INVALID',
            timestamp: new Date().toISOString()
          }));
          ws.close();
          return;
        }

        user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'user'
        };

        // Check supervisor privileges for SDC dashboard - MySQL query
        if (channel === 'sdc-dashboard') {
          const { data: supervisorData, error: supervisorError } = await from('supervisors')
            .select('id, email, name, role, depot')
            .eq('email', user.email.toLowerCase())
            .single();

          if (supervisorError || !supervisorData) {
            console.warn(`❌ Unauthorized WebSocket access attempt to SDC dashboard by ${user.email}`);

            // Log security event
            const securityEvent = {
              eventType: 'unauthorized_sdc_websocket_access',
              timestamp: new Date().toISOString(),
              email: user.email,
              channel: channel,
              ip: request.socket.remoteAddress,
              userAgent: request.headers['user-agent']
            };
            console.log('🔒 Security Alert:', JSON.stringify(securityEvent, null, 2));

            ws.send(JSON.stringify({
              type: 'error',
              error: 'SDC operator privileges required',
              code: 'WS_SDC_AUTH_FORBIDDEN',
              timestamp: new Date().toISOString()
            }));
            ws.close();
            return;
          }

          supervisor = supervisorData;
        }

        console.log(`✅ WebSocket authenticated: ${user.email} on channel: ${channel}`);
      } catch (error) {
        console.error('❌ WebSocket authentication error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Authentication failed',
          code: 'WS_AUTH_ERROR',
          timestamp: new Date().toISOString()
        }));
        ws.close();
        return;
      }
    }

    // Extract displayId from query parameters (for engineering displays)
    const displayId = url.searchParams.get('displayId');
    const depot = url.searchParams.get('depot');

    // Store client info with authentication details
    this.clients.set(clientId, {
      ws,
      channel,
      user,
      supervisor,
      displayId, // Only present for engineering displays
      depot, // Only present for engineering displays
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      subscriptions: new Set([channel]),
      authenticated: !!user
    });

    // Add to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(clientId);

    // Register display if this is an engineering display
    if (channel === 'engineering-display' && displayId) {
      this.registerDisplay(displayId, clientId, depot);
      console.log(`🖥️ Display registered: ${displayId} (Depot: ${depot || 'None'})`);
    }

    // Set up client event handlers
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Send welcome message with current status
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      channel,
      authenticated: !!user,
      user: user ? { email: user.email, role: user.role } : null,
      message: user ? `Authenticated as ${user.email}` : 'Connected to breakdown updates',
      timestamp: new Date().toISOString()
    });

    // Send initial data based on channel type
    if (channel === 'breakdowns' || channel === 'sdc-dashboard') {
      await this.sendInitialBreakdownData(clientId);
    } else if (channel === 'engineering-display' && depot) {
      // Send depot-filtered breakdowns for engineering displays
      await this.sendInitialBreakdownDataByDepot(clientId, depot);
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      // Update last activity
      client.lastActivity = new Date().toISOString();

      console.log(`📨 WebSocket message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.channel);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channel);
          break;
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        case 'get_status':
          this.sendStatusUpdate(clientId);
          break;
        case 'display_register':
          // Dynamic display registration
          this.handleDisplayRegistration(clientId, message);
          break;
        case 'display_update_filters':
          // Display updates its own filters
          this.handleDisplayFilterUpdate(clientId, message);
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message from ${clientId}:`, error);
    }
  }

  // Handle client disconnection
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`🔌 WebSocket disconnection: ${clientId}`);

    // Unregister display if it was a display client
    if (client.displayId) {
      this.unregisterDisplay(client.displayId);
      console.log(`🖥️ Display unregistered: ${client.displayId}`);
    }

    // Remove from all channels
    client.subscriptions.forEach(channel => {
      if (this.channels.has(channel)) {
        this.channels.get(channel).delete(clientId);
        if (this.channels.get(channel).size === 0) {
          this.channels.delete(channel);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);
  }

  // Handle channel subscription
  handleSubscription(clientId, channel) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    this.channels.get(channel).add(clientId);
    client.subscriptions.add(channel);

    this.sendToClient(clientId, {
      type: 'subscribed',
      channel,
      message: `Subscribed to ${channel}`,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Client ${clientId} subscribed to channel: ${channel}`);
  }

  // Handle channel unsubscription
  handleUnsubscription(clientId, channel) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (this.channels.has(channel)) {
      this.channels.get(channel).delete(clientId);
    }
    client.subscriptions.delete(channel);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channel,
      message: `Unsubscribed from ${channel}`,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Client ${clientId} unsubscribed from channel: ${channel}`);
  }

  // Send message to specific client
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== client.ws.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.handleDisconnection(clientId);
      return false;
    }
  }

  // Broadcast message to channel
  broadcast(channel, data) {
    if (!this.channels.has(channel)) {
      return 0;
    }

    let sentCount = 0;
    const clients = this.channels.get(channel);

    clients.forEach(clientId => {
      if (this.sendToClient(clientId, data)) {
        sentCount++;
      }
    });

    console.log(`📡 Broadcasted to ${sentCount} clients on channel: ${channel}`);
    return sentCount;
  }

  // Broadcast to all clients
  broadcastToAll(data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, data)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  // Set up file watchers for real-time updates
  setupFileWatchers() {
    // Watch breakdown counter file for breakdown updates
    if (existsSync(BREAKDOWN_COUNTER_PATH)) {
      this.fileWatchers.set('breakdowns', watchFile(BREAKDOWN_COUNTER_PATH, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          this.handleBreakdownsUpdate();
        }
      }));
      console.log('👁️ Watching breakdown counter file for changes');
    }
  }

  // NOTE: handleActivitiesUpdate() removed - activities now broadcast directly from resolve endpoint via Activity Logger

  // Handle breakdowns file update
  handleBreakdownsUpdate() {
    try {
      console.log('🔄 Breakdown data updated, broadcasting to clients');

      const updateData = {
        type: 'breakdowns_updated',
        message: 'Breakdown data has been updated',
        timestamp: new Date().toISOString(),
        source: 'file_watcher'
      };

      // Broadcast to relevant channels
      this.broadcast('breakdowns', updateData);
      this.broadcast('sdc-dashboard', updateData);

      // Broadcast depot-filtered data to engineering displays
      this.broadcastToEngineeringDisplays();

    } catch (error) {
      console.error('Error handling breakdowns update:', error);
    }
  }

  // Broadcast updated breakdowns to engineering displays (filtered by depot)
  async broadcastToEngineeringDisplays() {
    try {
      if (!this.channels.has('engineering-display')) {
        return;
      }

      const displayClients = this.channels.get('engineering-display');
      const depotsToUpdate = new Set();

      // Collect all unique depots that have displays
      displayClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client && client.depot) {
          depotsToUpdate.add(client.depot);
        }
      });

      // Query and broadcast breakdowns for each depot
      for (const depot of depotsToUpdate) {
        try {
          const depotBreakdownsSQL = `
            SELECT * FROM breakdowns
            WHERE depot = ?
              AND status NOT IN ('resolved', 'cleared')
            ORDER BY created_at DESC
            LIMIT 100
          `;

          const depotBreakdowns = await query(depotBreakdownsSQL, [depot]);

          // Send to all displays in this depot
          displayClients.forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client && client.depot === depot) {
              this.sendToClient(clientId, {
                type: 'breakdowns_updated',
                depot,
                breakdowns: depotBreakdowns || [],
                timestamp: new Date().toISOString()
              });
            }
          });

          console.log(`📡 Broadcasted ${depotBreakdowns?.length || 0} breakdowns to engineering displays in depot: ${depot}`);
        } catch (error) {
          console.error(`Error broadcasting breakdowns to depot ${depot}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in broadcastToEngineeringDisplays:', error);
    }
  }

  // Map activity type to WebSocket event type
  mapActivityToEvent(activity) {
    const typeMap = {
      'wizard_started': 'wizard_started',
      'wizard_completed': 'wizard_completed',
      'wizard_step': 'wizard_progress',
      'edit_initiated': 'assessment_edit_started',
      'breakdown_reported': 'breakdown_created'
    };

    return typeMap[activity.type] || typeMap[activity.activity_type] || null;
  }

  // Send initial breakdown data to new client
  // MIGRATED: Fetches from MySQL instead of Supabase
  async sendInitialBreakdownData(clientId) {
    try {
      // Load current breakdown data from JSON file
      const breakdownData = JSON.parse(readFileSync(BREAKDOWN_COUNTER_PATH, 'utf8'));

      // Fetch recent activities from MySQL database
      const recentActivities = await activityLogger.getRecentActivities(10);

      const initialData = {
        type: 'initial_data',
        breakdowns: breakdownData.breakdowns || [],
        recent_activities: recentActivities?.activities || [],
        timestamp: new Date().toISOString()
      };

      this.sendToClient(clientId, initialData);

    } catch (error) {
      console.error('Error sending initial breakdown data:', error);
    }
  }

  // Send depot-filtered breakdown data for engineering displays
  async sendInitialBreakdownDataByDepot(clientId, depot) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      console.log(`📊 Fetching breakdowns for engineering display in depot: ${depot}`);

      // Query MySQL for breakdowns in this specific depot
      const depotBreakdownsSQL = `
        SELECT * FROM breakdowns
        WHERE depot = ?
          AND status NOT IN ('resolved', 'cleared')
        ORDER BY created_at DESC
        LIMIT 100
      `;

      const depotBreakdowns = await query(depotBreakdownsSQL, [depot]);

      // Fetch recent activities for this depot
      const depotActivitiesSQL = `
        SELECT * FROM activities
        WHERE depot = ?
        ORDER BY timestamp DESC
        LIMIT 20
      `;

      const depotActivities = await query(depotActivitiesSQL, [depot]);

      const initialData = {
        type: 'initial_data',
        depot,
        breakdowns: depotBreakdowns || [],
        recent_activities: depotActivities || [],
        timestamp: new Date().toISOString()
      };

      console.log(`📡 Sending ${depotBreakdowns?.length || 0} breakdowns to engineering display for depot: ${depot}`);
      this.sendToClient(clientId, initialData);

    } catch (error) {
      console.error(`Error sending depot-filtered breakdown data for ${depot}:`, error);
      // Send error message to client
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Failed to fetch breakdown data for depot',
        depot,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Send status update to client
  sendStatusUpdate(clientId) {
    const stats = this.getConnectionStats();

    this.sendToClient(clientId, {
      type: 'status_update',
      stats,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getConnectionStats() {
    const channelStats = {};
    this.channels.forEach((clients, channel) => {
      channelStats[channel] = clients.size;
    });

    return {
      total_clients: this.clients.size,
      channels: channelStats,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };
  }

  // Generate unique client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Manual broadcast methods for external use
  broadcastWizardStarted(assessmentData) {
    return this.broadcast('sdc-dashboard', {
      type: 'wizard_started',
      data: assessmentData,
      timestamp: new Date().toISOString()
    });
  }

  broadcastWizardCompleted(assessmentData) {
    return this.broadcast('sdc-dashboard', {
      type: 'wizard_completed',
      data: assessmentData,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAssessmentProgress(progressData) {
    return this.broadcast('sdc-dashboard', {
      type: 'assessment_progress',
      data: progressData,
      timestamp: new Date().toISOString()
    });
  }

  broadcastBreakdownCreated(breakdownData) {
    // Broadcast to SDC dashboard
    this.broadcast('sdc-dashboard', {
      type: 'breakdown_created',
      data: breakdownData,
      timestamp: new Date().toISOString()
    });

    // Also broadcast to engineering displays for the affected depot
    if (breakdownData.depot) {
      this.broadcastBreakdownByDepot(breakdownData);
    }
  }

  // Broadcast breakdown update to engineering displays in a specific depot
  broadcastBreakdownByDepot(breakdownData) {
    try {
      if (!breakdownData || !breakdownData.depot) {
        return 0;
      }

      const depot = breakdownData.depot;
      let sentCount = 0;

      // Get all engineering-display clients and filter by depot
      if (this.channels.has('engineering-display')) {
        const displayClients = this.channels.get('engineering-display');

        displayClients.forEach(clientId => {
          const client = this.clients.get(clientId);

          // Only send to displays in the same depot
          if (client && client.depot === depot) {
            if (this.sendToClient(clientId, {
              type: 'breakdown_created',
              data: breakdownData,
              depot,
              timestamp: new Date().toISOString()
            })) {
              sentCount++;
            }
          }
        });

        if (sentCount > 0) {
          console.log(`📡 Broadcasted breakdown to ${sentCount} engineering displays in depot: ${depot}`);
        }
      }

      return sentCount;
    } catch (error) {
      console.error('Error broadcasting breakdown by depot:', error);
      return 0;
    }
  }

  // =====================================================
  // DEFECT INTELLIGENCE BROADCAST METHODS
  // =====================================================

  /**
   * Broadcast to defect intelligence channel
   * Helper method for all defect-related events
   */
  broadcastToChannel(channel, message) {
    try {
      const sentCount = this.broadcast(channel, message);
      console.log(`📡 Broadcasted ${message.type} to ${channel}: ${sentCount} clients`);
      return sentCount;
    } catch (error) {
      console.error(`❌ Failed to broadcast to ${channel}:`, error);
      return 0;
    }
  }

  /**
   * Broadcast when a vehicle shows repeat defects
   * @param {Object} vehicleData - Vehicle with repeat defect information
   */
  broadcastRepeatDefect(vehicleData) {
    const message = {
      type: 'NEW_REPEAT_DEFECT',
      data: {
        fleetNumber: vehicleData.fleetNumber,
        defectCount: vehicleData.defectCount,
        severity: vehicleData.averageSeverityScore || 'medium',
        depot: vehicleData.depot || 'Unknown',
        defects: vehicleData.defects || [],
        registration: vehicleData.registration || null,
        vehicleType: vehicleData.vehicleType || 'Unknown',
        unresolvedCount: vehicleData.unresolvedCount || 0
      },
      priority: vehicleData.defectCount >= 5 ? 'critical' : vehicleData.defectCount >= 3 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  /**
   * Broadcast trending issue updates
   * @param {Object} trendData - Trending defect information
   */
  broadcastTrendUpdate(trendData) {
    const message = {
      type: 'TREND_UPDATE',
      data: {
        defectType: trendData.defectType,
        count: trendData.currentCount,
        trend: trendData.trend, // 'rising' | 'falling' | 'stable'
        changePercent: trendData.changePercent,
        previousCount: trendData.previousCount,
        affectedModels: trendData.affectedModels || []
      },
      priority: trendData.priority || 'normal',
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  /**
   * Broadcast critical pattern detection
   * @param {Object} patternData - Critical pattern information
   */
  broadcastCriticalPattern(patternData) {
    const message = {
      type: 'CRITICAL_PATTERN',
      data: patternData,
      message: patternData.message || 'Critical defect pattern detected',
      priority: patternData.priority || 'critical',
      affectedVehicles: patternData.affectedVehicles || [],
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  /**
   * Broadcast depot statistics changes
   * @param {Object} depotData - Depot defect statistics
   */
  broadcastDepotStats(depotData) {
    const message = {
      type: 'DEPOT_STATS_UPDATE',
      data: {
        depotName: depotData.name || depotData.depotName,
        defectCount: depotData.defectCount,
        defectRate: depotData.defectRate,
        trend: depotData.trend,
        topIssue: depotData.topIssue,
        topIssueCount: depotData.topIssueCount,
        vehicleCount: depotData.vehicleCount,
        averageSeverity: depotData.averageSeverity
      },
      priority: depotData.trend === 'rising' && depotData.defectRate > 15 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  /**
   * Broadcast predictive maintenance alerts
   * @param {Object} alertData - Predictive maintenance alert information
   */
  broadcastPredictiveAlert(alertData) {
    const message = {
      type: 'PREDICTIVE_ALERT',
      data: {
        alertType: alertData.type,
        message: alertData.message,
        vehicles: alertData.vehicles || [],
        defectType: alertData.defectType,
        affectedCount: alertData.affectedCount,
        recommendation: alertData.recommendation,
        estimatedCost: alertData.estimatedCost
      },
      priority: alertData.priority || 'medium',
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  /**
   * Broadcast defect escalation event
   * @param {Object} escalationData - Escalation information
   */
  broadcastDefectEscalation(escalationData) {
    const message = {
      type: 'DEFECT_ESCALATED',
      data: {
        vehicleId: escalationData.vehicleId,
        defectCount: escalationData.defects?.length || 0,
        recipient: escalationData.recipient,
        priority: escalationData.priority,
        escalatedBy: escalationData.escalatedBy,
        message: escalationData.message
      },
      priority: escalationData.priority === 'critical' ? 'critical' : 'high',
      timestamp: new Date().toISOString()
    };

    return this.broadcastToChannel('defect-intelligence', message);
  }

  // =====================================================
  // DISPLAY MANAGEMENT METHODS
  // =====================================================

  /**
   * Register an engineering display
   * @param {string} displayId - Unique display identifier (e.g., 'yard1', 'depot-washington')
   * @param {string} clientId - WebSocket client ID
   * @param {string} depot - Depot name (optional)
   */
  registerDisplay(displayId, clientId, depot = null) {
    const displayInfo = {
      clientId,
      displayId,
      depot,
      filters: {
        status: ['pending', 'in-progress'],
        depot: depot || 'all'
      },
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    this.displays.set(displayId, displayInfo);

    // Track by depot if depot is specified
    if (depot) {
      if (!this.displaysByDepot.has(depot)) {
        this.displaysByDepot.set(depot, new Set());
      }
      this.displaysByDepot.get(depot).add(displayId);
    }

    console.log(`✅ Display registered: ${displayId}`, displayInfo);

    // Send confirmation to display
    this.sendToClient(clientId, {
      type: 'display_registered',
      displayId,
      depot,
      message: 'Display successfully registered',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unregister a display
   * @param {string} displayId - Display identifier
   */
  unregisterDisplay(displayId) {
    const display = this.displays.get(displayId);
    if (!display) return;

    // Remove from depot tracking
    if (display.depot && this.displaysByDepot.has(display.depot)) {
      this.displaysByDepot.get(display.depot).delete(displayId);
      if (this.displaysByDepot.get(display.depot).size === 0) {
        this.displaysByDepot.delete(display.depot);
      }
    }

    this.displays.delete(displayId);
    console.log(`✅ Display unregistered: ${displayId}`);
  }

  /**
   * Handle dynamic display registration from client
   * @param {string} clientId - Client ID
   * @param {Object} message - Registration message
   */
  handleDisplayRegistration(clientId, message) {
    const { displayId, depot } = message;

    if (!displayId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'displayId is required for registration',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update client info
    const client = this.clients.get(clientId);
    if (client) {
      client.displayId = displayId;
      client.depot = depot;
    }

    // Register display
    this.registerDisplay(displayId, clientId, depot);
  }

  /**
   * Handle display filter updates from client
   * @param {string} clientId - Client ID
   * @param {Object} message - Filter update message
   */
  handleDisplayFilterUpdate(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.displayId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Client is not registered as a display',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const display = this.displays.get(client.displayId);
    if (!display) return;

    // Update filters
    display.filters = { ...display.filters, ...message.filters };
    display.lastSeen = new Date().toISOString();

    console.log(`🔧 Display filters updated: ${client.displayId}`, display.filters);

    this.sendToClient(clientId, {
      type: 'display_filters_updated',
      displayId: client.displayId,
      filters: display.filters,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send command to specific display
   * @param {string} displayId - Display identifier
   * @param {Object} command - Command object
   * @returns {boolean} Success status
   */
  sendToDisplay(displayId, command) {
    const display = this.displays.get(displayId);
    if (!display) {
      console.warn(`❌ Display not found: ${displayId}`);
      return false;
    }

    const success = this.sendToClient(display.clientId, {
      ...command,
      displayId,
      timestamp: new Date().toISOString()
    });

    if (success) {
      display.lastSeen = new Date().toISOString();
    }

    return success;
  }

  /**
   * Highlight a specific breakdown on a display
   * @param {string} displayId - Display identifier
   * @param {string} breakdownId - Breakdown ID to highlight
   */
  displayHighlight(displayId, breakdownId) {
    console.log(`🎯 Highlighting breakdown ${breakdownId} on display ${displayId}`);
    return this.sendToDisplay(displayId, {
      type: 'display_highlight',
      breakdownId,
      action: 'highlight'
    });
  }

  /**
   * Change display filters remotely
   * @param {string} displayId - Display identifier
   * @param {Object} filters - New filters to apply
   */
  displayChangeFilters(displayId, filters) {
    const display = this.displays.get(displayId);
    if (!display) {
      console.warn(`❌ Display not found: ${displayId}`);
      return false;
    }

    // Update stored filters
    display.filters = { ...display.filters, ...filters };

    console.log(`🔧 Changing filters on display ${displayId}`, filters);
    return this.sendToDisplay(displayId, {
      type: 'display_filter',
      filters
    });
  }

  /**
   * Change which depot a display shows
   * @param {string} displayId - Display identifier
   * @param {string} depot - New depot name
   */
  displayChangeDepot(displayId, depot) {
    const display = this.displays.get(displayId);
    if (!display) {
      console.warn(`❌ Display not found: ${displayId}`);
      return false;
    }

    // Remove from old depot tracking
    if (display.depot && this.displaysByDepot.has(display.depot)) {
      this.displaysByDepot.get(display.depot).delete(displayId);
    }

    // Add to new depot tracking
    display.depot = depot;
    if (!this.displaysByDepot.has(depot)) {
      this.displaysByDepot.set(depot, new Set());
    }
    this.displaysByDepot.get(depot).add(displayId);

    console.log(`🏢 Changing depot on display ${displayId} to ${depot}`);
    return this.sendToDisplay(displayId, {
      type: 'display_depot_change',
      depot
    });
  }

  /**
   * Force a display to refresh its data
   * @param {string} displayId - Display identifier
   */
  displayRefresh(displayId) {
    console.log(`🔄 Forcing refresh on display ${displayId}`);
    return this.sendToDisplay(displayId, {
      type: 'display_refresh',
      action: 'refresh'
    });
  }

  /**
   * Broadcast command to all displays in a depot
   * @param {string} depot - Depot name
   * @param {Object} command - Command to broadcast
   */
  broadcastToDepotDisplays(depot, command) {
    const displays = this.displaysByDepot.get(depot);
    if (!displays || displays.size === 0) {
      console.warn(`❌ No displays found for depot: ${depot}`);
      return 0;
    }

    let successCount = 0;
    displays.forEach(displayId => {
      if (this.sendToDisplay(displayId, command)) {
        successCount++;
      }
    });

    console.log(`📡 Broadcasted to ${successCount}/${displays.size} displays in ${depot}`);
    return successCount;
  }

  /**
   * Get list of active displays
   * @returns {Array} Array of display information
   */
  getActiveDisplays() {
    const displays = [];
    this.displays.forEach((display, displayId) => {
      displays.push({
        displayId,
        depot: display.depot,
        filters: display.filters,
        registeredAt: display.registeredAt,
        lastSeen: display.lastSeen,
        online: true
      });
    });
    return displays;
  }

  /**
   * Get displays by depot
   * @param {string} depot - Depot name
   * @returns {Array} Array of display IDs
   */
  getDisplaysByDepot(depot) {
    const displayIds = this.displaysByDepot.get(depot);
    if (!displayIds) return [];

    return Array.from(displayIds).map(displayId => {
      const display = this.displays.get(displayId);
      return {
        displayId,
        depot: display.depot,
        filters: display.filters,
        registeredAt: display.registeredAt,
        lastSeen: display.lastSeen,
        online: true
      };
    });
  }

  /**
   * Get display information
   * @param {string} displayId - Display identifier
   * @returns {Object|null} Display information or null
   */
  getDisplayInfo(displayId) {
    const display = this.displays.get(displayId);
    if (!display) return null;

    return {
      displayId,
      depot: display.depot,
      filters: display.filters,
      registeredAt: display.registeredAt,
      lastSeen: display.lastSeen,
      online: true
    };
  }

  // Cleanup
  cleanup() {
    console.log('🧹 Cleaning up WebSocket connections');

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      client.ws.close();
    });

    // Clear file watchers
    this.fileWatchers.forEach((watcher, name) => {
      if (typeof watcher === 'function') {
        watcher(); // Call unwatcher if it's a function
      }
    });

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    this.clients.clear();
    this.channels.clear();
    this.fileWatchers.clear();
  }
}

// Create singleton instance
const webSocketHandler = new WebSocketHandler();

export default webSocketHandler;
