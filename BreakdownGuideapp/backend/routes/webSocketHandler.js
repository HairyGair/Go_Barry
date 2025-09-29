/**
 * WebSocket Handler for Real-time Breakdown Updates
 * Manages WebSocket connections and broadcasts real-time updates to SDC Dashboard
 */

import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data file paths
const BREAKDOWN_COUNTER_PATH = join(__dirname, '../data/breakdown-counter.json');
const ACTIVITIES_PATH = join(__dirname, '../data/activities.json');

class WebSocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.channels = new Map();
    this.lastActivityTimestamp = null;
    this.fileWatchers = new Map();
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

    // Set up file watchers for real-time updates
    this.setupFileWatchers();

    console.log('✅ WebSocket server initialized');
  }

  // Handle new WebSocket connection
  handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const url = new URL(request.url, `http://${request.headers.host}`);
    const channel = url.searchParams.get('channel') || 'general';
    
    console.log(`🔗 New WebSocket connection: ${clientId} on channel: ${channel}`);

    // Store client info
    this.clients.set(clientId, {
      ws,
      channel,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      subscriptions: new Set([channel])
    });

    // Add to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(clientId);

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
      message: 'Connected to breakdown updates',
      timestamp: new Date().toISOString()
    });

    // Send initial data if on breakdown channel
    if (channel === 'breakdowns' || channel === 'sdc-dashboard') {
      this.sendInitialBreakdownData(clientId);
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
    // Watch activities file for new assessment data
    if (existsSync(ACTIVITIES_PATH)) {
      this.fileWatchers.set('activities', watchFile(ACTIVITIES_PATH, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          this.handleActivitiesUpdate();
        }
      }));
      console.log('👁️ Watching activities file for changes');
    }

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

  // Handle activities file update
  handleActivitiesUpdate() {
    try {
      const activitiesData = JSON.parse(readFileSync(ACTIVITIES_PATH, 'utf8'));
      const latestActivity = activitiesData.activities?.[0];

      if (!latestActivity || latestActivity.timestamp === this.lastActivityTimestamp) {
        return; // No new activity
      }

      this.lastActivityTimestamp = latestActivity.timestamp;
      
      console.log(`🔄 New activity detected: ${latestActivity.type} for ${latestActivity.breakdown_id || latestActivity.fleet_no}`);

      // Determine event type and broadcast appropriate message
      const eventType = this.mapActivityToEvent(latestActivity);
      
      if (eventType) {
        const broadcastData = {
          type: eventType,
          data: latestActivity,
          timestamp: new Date().toISOString(),
          source: 'file_watcher'
        };

        // Broadcast to relevant channels
        this.broadcast('breakdowns', broadcastData);
        this.broadcast('sdc-dashboard', broadcastData);
        this.broadcast('assessment-progress', broadcastData);
      }

    } catch (error) {
      console.error('Error handling activities update:', error);
    }
  }

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

    } catch (error) {
      console.error('Error handling breakdowns update:', error);
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
  async sendInitialBreakdownData(clientId) {
    try {
      // Load current breakdown data
      const breakdownData = JSON.parse(readFileSync(BREAKDOWN_COUNTER_PATH, 'utf8'));
      const activitiesData = JSON.parse(readFileSync(ACTIVITIES_PATH, 'utf8'));

      const initialData = {
        type: 'initial_data',
        breakdowns: breakdownData.breakdowns || [],
        recent_activities: activitiesData.activities?.slice(0, 10) || [],
        timestamp: new Date().toISOString()
      };

      this.sendToClient(clientId, initialData);
      
    } catch (error) {
      console.error('Error sending initial breakdown data:', error);
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
    return this.broadcast('sdc-dashboard', {
      type: 'breakdown_created',
      data: breakdownData,
      timestamp: new Date().toISOString()
    });
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